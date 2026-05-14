/**
 * AI backlog endpoints.
 *
 * Apply pass 4 (mechanical):
 *   - POST /api/ai/hospitalization-risk
 *   - POST /api/ai/caregiver-burden
 *
 * Apply pass 5 (full backlog):
 *   - POST /api/ai/nutrition-optimize         (MECHANICAL, swallow-safe recipes)
 *   - POST /api/ai/medication-cost-optimizer  (MECHANICAL, generic + assistance programs)
 *   - POST /api/ai/voice-meds-confirm         (TOO-RISKY: dual-confirm gating, additive only)
 *   - GET  /api/ai/wearable-vitals            (NEEDS-CREDS: HEALTHKIT_API_TOKEN | OURA_PERSONAL_TOKEN)
 *   - GET  /api/ai/ehr-fhir/observations      (NEEDS-CREDS: EHR_FHIR_URL + EHR_FHIR_TOKEN)
 *   - POST /api/ai/telehealth-session         (NEEDS-CREDS: TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN)
 *
 * Env vars consumed:
 *   - OPENROUTER_API_KEY           — LLM endpoints (503 + missing if unset)
 *   - OURA_PERSONAL_TOKEN          — Oura Ring v2 API
 *   - HEALTHKIT_API_TOKEN          — Apple HealthKit relay (PRODUCT-DECISION: assumes a relay
 *                                    server; swap for native bridge in mobile)
 *   - EHR_FHIR_URL, EHR_FHIR_TOKEN — Epic / Cerner FHIR R4 base
 *   - TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VIDEO_API_KEY,
 *     TWILIO_VIDEO_API_SECRET     — Twilio Programmable Video creds
 *
 * All endpoints gate on the relevant env var(s); absent -> 503 + missing.
 * PHI is redacted before leaving the server when an LLM is invoked; results
 * are persisted and access is logged via the HIPAA audit utility.
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

const userIdOf = (req) => req.user?.id || req.user?.userId || null;

function requireKey(res) {
  if (!process.env.OPENROUTER_API_KEY) {
    res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured' });
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// 30-day Hospitalization Risk
// Reads health_monitoring, medications, incident_reports for the given patient
// and returns a structured readmission/admission risk score.
// ---------------------------------------------------------------------------
router.post('/hospitalization-risk', auth, aiRateLimiter, async (req, res) => {
  try {
    if (!requireKey(res)) return;
    const { patient_id } = req.body || {};
    if (!patient_id) return res.status(400).json({ error: 'patient_id is required' });

    const patientStr = String(patient_id);

    let vitals = [];
    let meds = [];
    let incidents = [];

    try {
      const r = await pool.query(
        `SELECT * FROM health_monitoring
         WHERE patient_name = $1
         ORDER BY recorded_at DESC NULLS LAST
         LIMIT 30`,
        [patientStr]
      );
      vitals = r.rows;
    } catch { /* table or column may not exist; tolerate */ }

    try {
      const r = await pool.query(
        `SELECT medication_name, dosage, frequency, status
         FROM medications
         WHERE patient_name = $1`,
        [patientStr]
      );
      meds = r.rows;
    } catch { /* tolerate */ }

    try {
      const r = await pool.query(
        `SELECT incident_type, description, severity, created_at
         FROM incident_reports
         WHERE patient_name = $1
         ORDER BY created_at DESC NULLS LAST
         LIMIT 20`,
        [patientStr]
      );
      incidents = r.rows;
    } catch { /* tolerate */ }

    const { redacted, mapping } = redactPHI({
      patient_id: patientStr,
      vitals_sample: vitals.slice(0, 10),
      vitals_count: vitals.length,
      medications: meds,
      recent_incidents: incidents
    });

    const messages = [
      {
        role: 'system',
        content: 'You are a geriatric clinical risk analyst. Estimate 30-day hospitalization risk for an elderly patient using the redacted record summary. Always respond in valid JSON format.'
      },
      {
        role: 'user',
        content: `Estimate 30-day hospitalization (admission or readmission) risk.

Redacted Record: ${JSON.stringify(redacted, null, 2)}

Return a JSON object:
{
  "risk_level": "low|moderate|high|critical",
  "risk_score": 0-100,
  "top_risk_factors": ["factor 1", "factor 2"],
  "protective_factors": ["factor 1"],
  "recommended_interventions": ["action 1"],
  "monitoring_priorities": ["item 1"],
  "follow_up_window_days": 1-30,
  "rationale": "concise explanation"
}`
      }
    ];

    const result = await callOpenRouter(messages, { max_tokens: 1200, temperature: 0.3 });
    const rawContent = result.choices?.[0]?.message?.content || '{}';
    const content = rehydrate(rawContent, mapping);
    const parsed = parseAIJson(content);

    await persistAIResult({
      userId: userIdOf(req),
      endpoint: 'hospitalization-risk',
      entityType: 'patient',
      entityId: patientStr,
      requestPayload: {
        patient_id: patientStr,
        vitals_count: vitals.length,
        medication_count: meds.length,
        incident_count: incidents.length
      },
      aiResults: { content, parsed },
      model: result.model
    });
    await logPHIAccess({
      req,
      action: 'AI_RISK_ANALYSIS',
      entityType: 'patient',
      entityId: patientStr,
      patientIdentifier: patientStr,
      phiRedacted: true,
      details: { endpoint: 'hospitalization-risk' }
    });

    res.json({
      patient_id: patientStr,
      analysis: content,
      parsed,
      input_summary: {
        vitals_count: vitals.length,
        medication_count: meds.length,
        incident_count: incidents.length
      },
      model: result.model
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Caregiver Burden (Zarit-style)
// Reads recent caregiver_notes (text + frequency) for the patient and
// returns a structured burden score with mitigation suggestions.
// ---------------------------------------------------------------------------
router.post('/caregiver-burden', auth, aiRateLimiter, async (req, res) => {
  try {
    if (!requireKey(res)) return;
    const { patient_id, caregiver_id } = req.body || {};
    if (!patient_id && !caregiver_id) {
      return res.status(400).json({ error: 'patient_id or caregiver_id is required' });
    }

    let notes = [];
    try {
      if (patient_id) {
        const r = await pool.query(
          `SELECT note, created_at
           FROM caregiver_notes
           WHERE patient_name = $1
           ORDER BY created_at DESC NULLS LAST
           LIMIT 50`,
          [String(patient_id)]
        );
        notes = r.rows;
      } else if (caregiver_id) {
        const r = await pool.query(
          `SELECT note, created_at
           FROM caregiver_notes
           WHERE caregiver_name = $1
           ORDER BY created_at DESC NULLS LAST
           LIMIT 50`,
          [String(caregiver_id)]
        );
        notes = r.rows;
      }
    } catch { /* tolerate */ }

    // Frequency: notes per day over the observed window
    let frequencyPerDay = 0;
    if (notes.length > 1) {
      const earliest = notes[notes.length - 1]?.created_at
        ? new Date(notes[notes.length - 1].created_at)
        : null;
      const latest = notes[0]?.created_at ? new Date(notes[0].created_at) : null;
      if (earliest && latest && latest > earliest) {
        const days = Math.max(1, (latest - earliest) / (1000 * 60 * 60 * 24));
        frequencyPerDay = +(notes.length / days).toFixed(2);
      }
    }

    const { redacted, mapping } = redactPHI({
      patient_id: patient_id || null,
      caregiver_id: caregiver_id || null,
      note_count: notes.length,
      frequency_per_day: frequencyPerDay,
      sample_notes: notes.slice(0, 20).map((n) => n.note)
    });

    const messages = [
      {
        role: 'system',
        content: 'You are a clinical caregiver-support specialist. Using a Zarit-style framework, estimate caregiver burden from redacted note text and frequency. Always respond in valid JSON format.'
      },
      {
        role: 'user',
        content: `Estimate caregiver burden.

Redacted Inputs: ${JSON.stringify(redacted, null, 2)}

Return a JSON object:
{
  "burden_level": "minimal|mild|moderate|severe",
  "burden_score": 0-100,
  "primary_stressors": ["stressor 1"],
  "emotional_signals": ["signal 1"],
  "physical_signals": ["signal 1"],
  "support_recommendations": ["action 1"],
  "respite_priority": "low|medium|high|urgent",
  "follow_up_window_days": 1-30,
  "rationale": "concise explanation"
}`
      }
    ];

    const result = await callOpenRouter(messages, { max_tokens: 1000, temperature: 0.3 });
    const rawContent = result.choices?.[0]?.message?.content || '{}';
    const content = rehydrate(rawContent, mapping);
    const parsed = parseAIJson(content);

    await persistAIResult({
      userId: userIdOf(req),
      endpoint: 'caregiver-burden',
      entityType: 'caregiver',
      entityId: caregiver_id || patient_id || null,
      requestPayload: {
        patient_id: patient_id || null,
        caregiver_id: caregiver_id || null,
        note_count: notes.length,
        frequency_per_day: frequencyPerDay
      },
      aiResults: { content, parsed },
      model: result.model
    });
    await logPHIAccess({
      req,
      action: 'AI_BURDEN_ANALYSIS',
      entityType: 'caregiver',
      entityId: caregiver_id || patient_id || null,
      patientIdentifier: patient_id || null,
      phiRedacted: true,
      details: { endpoint: 'caregiver-burden' }
    });

    res.json({
      patient_id: patient_id || null,
      caregiver_id: caregiver_id || null,
      analysis: content,
      parsed,
      input_summary: {
        note_count: notes.length,
        frequency_per_day: frequencyPerDay
      },
      model: result.model
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// Apply pass 5 — full backlog
// =============================================================================

// PRODUCT-DECISION: voice-meds dual-confirm is a TOO-RISKY surface. Implementation
// here is INTENT-ONLY: receives an utterance + parsed intent and returns a
// confirmation token. No medication state is mutated until /confirm is called
// with the same token within a 60s window. No barge-in dispensing.
const voiceMedsPending = new Map(); // token -> { patient_id, medication, dose, expires_at }
const VOICE_TOKEN_TTL_MS = 60_000;

function newToken() {
  return 'vmd_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ---------------------------------------------------------------------------
// /nutrition-optimize — swallow-safe recipes (texture-modified per IDDSI)
// MECHANICAL — text-only LLM, PHI redacted.
// ---------------------------------------------------------------------------
router.post('/nutrition-optimize', auth, aiRateLimiter, async (req, res) => {
  try {
    if (!requireKey(res)) return;
    const { patient_id, dysphagia_level, allergies, preferences, restrictions, target_calories } = req.body || {};
    if (!patient_id) return res.status(400).json({ error: 'patient_id is required' });

    let allergyRows = [];
    let medRows = [];
    try {
      const r = await pool.query('SELECT allergen, severity FROM allergies WHERE patient_name = $1', [String(patient_id)]);
      allergyRows = r.rows;
    } catch {}
    try {
      const r = await pool.query('SELECT medication_name FROM medications WHERE patient_name = $1', [String(patient_id)]);
      medRows = r.rows;
    } catch {}

    const { redacted, mapping } = redactPHI({
      patient_id: String(patient_id),
      dysphagia_level: dysphagia_level || 'unknown',
      allergies: [...(allergies || []), ...allergyRows.map(a => a.allergen)],
      preferences: preferences || [],
      restrictions: restrictions || [],
      target_calories: target_calories || null,
      med_count: medRows.length
    });

    const messages = [
      { role: 'system', content: 'You are a registered dietitian familiar with IDDSI texture levels for elderly patients with dysphagia. Always respond in valid JSON.' },
      { role: 'user', content: `Generate a 1-day meal plan with swallow-safe (IDDSI-aligned) recipes.\n\nInputs: ${JSON.stringify(redacted, null, 2)}\n\nReturn JSON:\n{\n  "iddsi_level": "Level 0-7",\n  "meals": [{"meal":"breakfast|lunch|dinner|snack","name":string,"texture":string,"ingredients":[string],"prep_steps":[string],"calories":number,"protein_g":number}],\n  "hydration_recommendations": [string],\n  "warning_foods": [string],\n  "rationale": string\n}` }
    ];
    const result = await callOpenRouter(messages, { max_tokens: 1500, temperature: 0.4 });
    const rawContent = result.choices?.[0]?.message?.content || '{}';
    const content = rehydrate(rawContent, mapping);
    const parsed = parseAIJson(content);

    await persistAIResult({ userId: userIdOf(req), endpoint: 'nutrition-optimize', entityType: 'patient', entityId: String(patient_id), requestPayload: { patient_id, dysphagia_level }, aiResults: { content, parsed }, model: result.model });
    await logPHIAccess({ req, action: 'AI_NUTRITION_OPTIMIZE', entityType: 'patient', entityId: String(patient_id), patientIdentifier: String(patient_id), phiRedacted: true, details: { endpoint: 'nutrition-optimize' } });

    res.json({ patient_id: String(patient_id), analysis: content, parsed, model: result.model });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// /medication-cost-optimizer — find generics + assistance programs.
// MECHANICAL — text-only LLM, PHI redacted.
// ---------------------------------------------------------------------------
router.post('/medication-cost-optimizer', auth, aiRateLimiter, async (req, res) => {
  try {
    if (!requireKey(res)) return;
    const { patient_id, insurance_plan, monthly_budget } = req.body || {};
    if (!patient_id) return res.status(400).json({ error: 'patient_id is required' });

    let meds = [];
    try {
      const r = await pool.query('SELECT medication_name, dosage, frequency, status FROM medications WHERE patient_name = $1', [String(patient_id)]);
      meds = r.rows;
    } catch {}

    const { redacted, mapping } = redactPHI({
      patient_id: String(patient_id),
      medications: meds,
      insurance_plan: insurance_plan || 'unknown',
      monthly_budget: monthly_budget || null
    });

    const messages = [
      { role: 'system', content: 'You are a Medicare Part-D pharmacist analyst. Suggest generic alternatives, manufacturer patient-assistance programs (e.g., NeedyMeds, RxAssist), and 90-day mail-order options. Always respond in valid JSON.' },
      { role: 'user', content: `Optimize medication cost.\n\nInputs: ${JSON.stringify(redacted, null, 2)}\n\nReturn JSON:\n{\n  "current_estimated_monthly_cost_usd": number,\n  "optimized_estimated_monthly_cost_usd": number,\n  "savings_usd": number,\n  "recommendations": [{"medication": string, "action": "switch_generic|patient_assistance|mail_order|dose_consolidation", "alternative": string, "estimated_savings_usd": number, "caveats": [string]}],\n  "assistance_programs": [{"program": string, "url": string, "applies_to": [string]}],\n  "rationale": string\n}` }
    ];
    const result = await callOpenRouter(messages, { max_tokens: 1500, temperature: 0.3 });
    const rawContent = result.choices?.[0]?.message?.content || '{}';
    const content = rehydrate(rawContent, mapping);
    const parsed = parseAIJson(content);

    await persistAIResult({ userId: userIdOf(req), endpoint: 'medication-cost-optimizer', entityType: 'patient', entityId: String(patient_id), requestPayload: { patient_id, med_count: meds.length }, aiResults: { content, parsed }, model: result.model });
    await logPHIAccess({ req, action: 'AI_MED_COST_OPTIMIZE', entityType: 'patient', entityId: String(patient_id), patientIdentifier: String(patient_id), phiRedacted: true, details: { endpoint: 'medication-cost-optimizer' } });

    res.json({ patient_id: String(patient_id), analysis: content, parsed, input_summary: { med_count: meds.length }, model: result.model });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// /voice-meds-confirm/intent — Step 1 of dual-confirm. TOO-RISKY: never mutates state.
// PRODUCT-DECISION: returns a confirmation_token valid 60s, requires explicit
// user-side voice or button confirmation via /voice-meds-confirm/commit.
// ---------------------------------------------------------------------------
router.post('/voice-meds-confirm/intent', auth, aiRateLimiter, async (req, res) => {
  try {
    const { patient_id, medication, dose, utterance } = req.body || {};
    if (!patient_id || !medication) return res.status(400).json({ error: 'patient_id and medication are required' });
    const token = newToken();
    voiceMedsPending.set(token, { patient_id, medication, dose, utterance, expires_at: Date.now() + VOICE_TOKEN_TTL_MS });
    // Defensive cleanup
    for (const [k, v] of voiceMedsPending) {
      if (v.expires_at < Date.now()) voiceMedsPending.delete(k);
    }
    await logPHIAccess({ req, action: 'AI_VOICE_MEDS_INTENT', entityType: 'patient', entityId: String(patient_id), patientIdentifier: String(patient_id), phiRedacted: false, details: { medication, dose: dose || null } });
    res.json({ confirmation_token: token, expires_in_ms: VOICE_TOKEN_TTL_MS, prompt: `Please confirm: ${medication}${dose ? ' ' + dose : ''} for patient ${patient_id}.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/voice-meds-confirm/commit', auth, aiRateLimiter, async (req, res) => {
  try {
    const { confirmation_token, confirm } = req.body || {};
    if (!confirmation_token || confirm !== true) {
      return res.status(400).json({ error: 'confirmation_token and confirm:true are required' });
    }
    const pending = voiceMedsPending.get(confirmation_token);
    if (!pending) return res.status(410).json({ error: 'Token expired or unknown' });
    if (pending.expires_at < Date.now()) {
      voiceMedsPending.delete(confirmation_token);
      return res.status(410).json({ error: 'Token expired' });
    }
    voiceMedsPending.delete(confirmation_token);
    // Important: this endpoint records a confirmation event but DOES NOT mutate
    // medication state — that requires a downstream nurse review (TOO-RISKY).
    await logPHIAccess({ req, action: 'AI_VOICE_MEDS_CONFIRMED', entityType: 'patient', entityId: String(pending.patient_id), patientIdentifier: String(pending.patient_id), phiRedacted: false, details: { medication: pending.medication, dose: pending.dose || null, requires_nurse_review: true } });
    res.json({ status: 'confirmation_logged', requires_nurse_review: true, patient_id: pending.patient_id, medication: pending.medication, dose: pending.dose || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// /wearable-vitals — Oura Ring (default) or HealthKit relay.
// NEEDS-CREDS: OURA_PERSONAL_TOKEN OR HEALTHKIT_API_TOKEN (+ HEALTHKIT_API_URL).
// ---------------------------------------------------------------------------
router.get('/wearable-vitals', auth, async (req, res) => {
  try {
    const { provider = 'oura' } = req.query || {};
    if (provider === 'oura') {
      if (!process.env.OURA_PERSONAL_TOKEN) {
        return res.status(503).json({ error: 'Wearable provider not configured', missing: 'OURA_PERSONAL_TOKEN' });
      }
      const r = await fetch('https://api.ouraring.com/v2/usercollection/daily_readiness', {
        headers: { 'Authorization': `Bearer ${process.env.OURA_PERSONAL_TOKEN}` }
      });
      const txt = await r.text();
      return res.status(r.ok ? 200 : 502).json({ provider, ok: r.ok, status: r.status, body: txt.slice(0, 4000) });
    }
    if (provider === 'healthkit') {
      const missing = [];
      if (!process.env.HEALTHKIT_API_URL) missing.push('HEALTHKIT_API_URL');
      if (!process.env.HEALTHKIT_API_TOKEN) missing.push('HEALTHKIT_API_TOKEN');
      if (missing.length) return res.status(503).json({ error: 'HealthKit relay not configured', missing: missing.join(',') });
      const r = await fetch(`${process.env.HEALTHKIT_API_URL}/vitals`, {
        headers: { 'Authorization': `Bearer ${process.env.HEALTHKIT_API_TOKEN}` }
      });
      const txt = await r.text();
      return res.status(r.ok ? 200 : 502).json({ provider, ok: r.ok, status: r.status, body: txt.slice(0, 4000) });
    }
    return res.status(400).json({ error: 'Unknown provider', supported: ['oura', 'healthkit'] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// /ehr-fhir/observations — Epic / Cerner FHIR R4 Observation search.
// NEEDS-CREDS: EHR_FHIR_URL + EHR_FHIR_TOKEN.
// ---------------------------------------------------------------------------
router.get('/ehr-fhir/observations', auth, async (req, res) => {
  try {
    const missing = [];
    if (!process.env.EHR_FHIR_URL) missing.push('EHR_FHIR_URL');
    if (!process.env.EHR_FHIR_TOKEN) missing.push('EHR_FHIR_TOKEN');
    if (missing.length) return res.status(503).json({ error: 'EHR not configured', missing: missing.join(',') });
    const { patient_fhir_id, code } = req.query || {};
    const url = new URL(`${process.env.EHR_FHIR_URL.replace(/\/$/, '')}/Observation`);
    if (patient_fhir_id) url.searchParams.set('patient', String(patient_fhir_id));
    if (code) url.searchParams.set('code', String(code));
    const r = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${process.env.EHR_FHIR_TOKEN}`, 'Accept': 'application/fhir+json' }
    });
    const txt = await r.text();
    res.status(r.ok ? 200 : 502).json({ ok: r.ok, status: r.status, body: txt.slice(0, 4000) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// /telehealth-session — Twilio Programmable Video room creation.
// NEEDS-CREDS: TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN.
// ---------------------------------------------------------------------------
router.post('/telehealth-session', auth, async (req, res) => {
  try {
    const missing = [];
    if (!process.env.TWILIO_ACCOUNT_SID) missing.push('TWILIO_ACCOUNT_SID');
    if (!process.env.TWILIO_AUTH_TOKEN) missing.push('TWILIO_AUTH_TOKEN');
    if (missing.length) return res.status(503).json({ error: 'Telehealth not configured', missing: missing.join(',') });
    const { patient_id, scheduled_for } = req.body || {};
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const tkn = process.env.TWILIO_AUTH_TOKEN;
    const basic = Buffer.from(`${sid}:${tkn}`).toString('base64');
    const params = new URLSearchParams({
      UniqueName: `eldercare-${patient_id || 'session'}-${Date.now()}`,
      Type: 'group',
      MaxParticipants: '4'
    });
    const r = await fetch(`https://video.twilio.com/v1/Rooms`, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(502).json({ ok: false, status: r.status, body: data });
    await logPHIAccess({ req, action: 'AI_TELEHEALTH_CREATED', entityType: 'patient', entityId: patient_id ? String(patient_id) : null, patientIdentifier: patient_id ? String(patient_id) : null, phiRedacted: false, details: { room_sid: data.sid, scheduled_for: scheduled_for || null } });
    res.json({ ok: true, room_sid: data.sid, unique_name: data.unique_name, status: data.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
