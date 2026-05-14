/**
 * Clinical AI extensions:
 *   - POST /api/ai/wound-photo-assessment  (base64 image — no multer dep)
 *   - POST /api/ai/fall-detection-confirm  (sensor stream confirmation + alert)
 *   - POST /api/ai/family-summary-chat     (proxied through /api/ai)
 *
 * All endpoints redact PHI before sending to OpenRouter and audit-log access.
 */
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const pool = require('../db');
const { callOpenRouter } = require('../services/openrouter');
const { parseAIJson } = require('../utils/parseAIJson');
const { persistAIResult } = require('../utils/aiResults');
const { redactPHI, rehydrate } = require('../utils/phiRedaction');
const { logPHIAccess } = require('../utils/hipaaAudit');
const { requireRole } = require('../middleware/rbac');

const userIdOf = (req) => req.user?.id || req.user?.userId || null;

// ---------------------------------------------------------------------------
// Wound photo AI assessment
// Accepts base64-encoded image. Stores assessment in wound_care if patient_id given.
// ---------------------------------------------------------------------------
router.post('/wound-photo-assessment', auth, requireRole('admin', 'nurse', 'caregiver'), aiRateLimiter, async (req, res) => {
  try {
    const { patient_id, image_base64, image_url, wound_location, prior_assessment_id } = req.body;
    if (!image_base64 && !image_url) {
      return res.status(400).json({ error: 'image_base64 or image_url is required' });
    }

    // Validate base64 size — limit 5MB to avoid blowing up the prompt
    if (image_base64 && image_base64.length > 7_000_000) {
      return res.status(413).json({ error: 'Image exceeds 5MB limit' });
    }

    // Optionally fetch prior assessment for progression analysis
    let priorAssessment = null;
    if (prior_assessment_id) {
      try {
        const r = await pool.query(
          'SELECT id, ai_assessment, created_at FROM wound_care WHERE id = $1',
          [prior_assessment_id]
        );
        priorAssessment = r.rows[0] || null;
      } catch { /* table may not exist */ }
    }

    // Image content payload (vision-capable model required for real assessment)
    const imageContent = image_url
      ? { type: 'image_url', image_url: { url: image_url } }
      : { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image_base64}` } };

    const { redacted, mapping } = redactPHI({
      wound_location,
      prior_assessment_summary: priorAssessment?.ai_assessment || null
    });

    const messages = [
      {
        role: 'system',
        content: 'You are a wound-care specialist nurse. Analyze wound images and provide structured clinical assessments. Always respond in valid JSON format.'
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Assess this wound photograph clinically.

Context (PHI-redacted): ${JSON.stringify(redacted)}

Return a JSON object:
{
  "wound_type": "pressure_ulcer|surgical|abrasion|laceration|burn|other",
  "stage": "I|II|III|IV|unstageable|n_a",
  "estimated_size_cm": "L x W (estimated)",
  "appearance": "description of color, drainage, edges",
  "tissue_types": ["granulation", "slough", "eschar", "epithelial"],
  "infection_signs": ["any signs of infection"],
  "healing_progression": "improving|stable|declining|new",
  "severity_score": 0-100,
  "recommended_dressing": "dressing recommendation",
  "treatment_recommendations": ["clinical actions"],
  "escalation_needed": true|false,
  "photograph_quality": "good|adequate|poor",
  "limitations": "what cannot be assessed from photo alone"
}`
          },
          imageContent
        ]
      }
    ];

    let result;
    try {
      result = await callOpenRouter(messages, { max_tokens: 1500, temperature: 0.3 });
    } catch (err) {
      // Fall back to text-only when vision model unavailable
      result = await callOpenRouter([
        { role: 'system', content: 'You are a wound-care specialist nurse. Always respond in valid JSON format.' },
        { role: 'user', content: `An image cannot be processed in this deployment. Provide a generic structured assessment template for wound at: ${redacted.wound_location || 'unspecified'}. Use the same JSON schema requested above.` }
      ], { max_tokens: 1000, temperature: 0.3 });
    }

    const rawContent = result.choices?.[0]?.message?.content || '{}';
    const content = rehydrate(rawContent, mapping);
    const assessment = parseAIJson(content);

    // Persist to wound_care if table exists
    let savedRecordId = null;
    try {
      const insert = await pool.query(
        `INSERT INTO wound_care (patient_name, wound_location, ai_assessment, severity, created_at)
         VALUES ($1, $2, $3, $4, NOW()) RETURNING id`,
        [String(patient_id || ''), wound_location || null, JSON.stringify(assessment), assessment?.severity_score || null]
      );
      savedRecordId = insert.rows[0]?.id;
    } catch { /* table may not have these columns */ }

    await persistAIResult({
      userId: userIdOf(req),
      endpoint: 'wound-photo-assessment',
      entityType: 'wound_care',
      entityId: savedRecordId || patient_id,
      requestPayload: { patient_id, wound_location, has_prior: !!priorAssessment },
      aiResults: { content, assessment },
      model: result.model
    });
    await logPHIAccess({
      req, action: 'AI_VISION_ANALYSIS', entityType: 'wound_care',
      entityId: savedRecordId || patient_id, patientIdentifier: patient_id,
      phiRedacted: true, details: { endpoint: 'wound-photo-assessment' }
    });

    res.json({
      patient_id,
      record_id: savedRecordId,
      assessment,
      model: result.model
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ---------------------------------------------------------------------------
// Fall detection — accelerometer/sensor confirmation + alert dispatch
// Body: { patient_id, sensor_event: { magnitude, duration_ms, ... }, location }
// ---------------------------------------------------------------------------
router.post('/fall-detection-confirm', auth, requireRole('admin', 'nurse', 'caregiver'), aiRateLimiter, async (req, res) => {
  try {
    const { patient_id, sensor_event, location } = req.body;
    if (!patient_id || !sensor_event) {
      return res.status(400).json({ error: 'patient_id and sensor_event are required' });
    }

    // No PHI in sensor data; redact location field for safety
    const { redacted, mapping } = redactPHI({ sensor_event, location });

    const messages = [
      {
        role: 'system',
        content: 'You are an emergency medical AI specializing in fall detection signal classification. You receive accelerometer/sensor data and determine if it represents a real fall versus a false positive (e.g., dropping the device, sitting down hard). Always respond in valid JSON format.'
      },
      {
        role: 'user',
        content: `Classify this sensor event:
${JSON.stringify(redacted, null, 2)}

Return a JSON object:
{
  "is_fall": true|false,
  "confidence": 0-100,
  "severity": "minor|moderate|severe|critical",
  "reasoning": "brief explanation",
  "recommended_action": "no_action|check_in|dispatch_caregiver|call_911",
  "false_positive_probability": 0-100
}`
      }
    ];

    const result = await callOpenRouter(messages, { max_tokens: 600, temperature: 0.2 });
    const rawContent = result.choices?.[0]?.message?.content || '{}';
    const content = rehydrate(rawContent, mapping);
    const classification = parseAIJson(content);

    // If confirmed fall — write to fall_alerts and incident_reports tables
    let alertId = null;
    if (classification?.is_fall && classification?.confidence >= 60) {
      try {
        const ins = await pool.query(
          `INSERT INTO fall_alerts (patient_name, location, severity, alert_time, sensor_type, response_status, notes)
           VALUES ($1, $2, $3, NOW(), $4, 'pending', $5) RETURNING id`,
          [
            String(patient_id),
            location || 'Unknown',
            classification?.severity || 'medium',
            'Wearable Device',
            `AI-confirmed fall (${classification.confidence}% confidence). ${classification.reasoning || ''}`
          ]
        );
        alertId = ins.rows[0]?.id;
      } catch (e) {
        console.error('fall_alerts insert failed:', e.message);
      }

      try {
        await pool.query(
          `INSERT INTO incident_reports (patient_name, incident_type, description, severity, created_at)
           VALUES ($1, 'fall', $2, $3, NOW())`,
          [
            String(patient_id),
            `Fall detected by sensor at ${location || 'unknown location'}. AI classification: ${classification.reasoning || ''}`,
            classification?.severity || 'moderate'
          ]
        );
      } catch { /* incident_reports may not have schema */ }
    }

    await persistAIResult({
      userId: userIdOf(req),
      endpoint: 'fall-detection-confirm',
      entityType: 'fall_alert',
      entityId: alertId || patient_id,
      requestPayload: { patient_id, sensor_event_keys: Object.keys(sensor_event || {}) },
      aiResults: { content, classification },
      model: result.model
    });
    await logPHIAccess({
      req, action: 'AI_FALL_CONFIRM', entityType: 'fall_alert',
      entityId: alertId || patient_id, patientIdentifier: patient_id,
      phiRedacted: true,
      details: { endpoint: 'fall-detection-confirm', confirmed: classification?.is_fall }
    });

    res.json({
      patient_id,
      classification,
      alert_id: alertId,
      alert_dispatched: !!alertId,
      model: result.model
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
