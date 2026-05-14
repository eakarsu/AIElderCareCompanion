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

const parseJson = parseAIJson;
const userIdOf = (req) => req.user?.id || req.user?.userId || null;

/**
 * Helper: redacts payload, calls OpenRouter, rehydrates response.
 * Returns { result, content, parsed }.
 */
async function redactedAICall(systemPrompt, payload, promptText, options = {}) {
  const { redacted, mapping } = redactPHI(payload);
  const userContent = `${promptText}\n\nRedacted Payload: ${JSON.stringify(redacted, null, 2)}`;
  const result = await callOpenRouter([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent }
  ], options);
  const rawContent = result.choices?.[0]?.message?.content || '{}';
  const content = rehydrate(rawContent, mapping);
  const parsed = parseAIJson(content);
  return { result, content, parsed, mapping };
}

// POST /api/ai/medication-interaction-alert
// Fetches ALL active medications for patient_id, runs comprehensive interaction check
router.post('/medication-interaction-alert', auth, aiRateLimiter, async (req, res) => {
  try {
    const { patient_id } = req.body;
    if (!patient_id) return res.status(400).json({ error: 'patient_id is required' });

    // Resolve to numeric id when possible to avoid the patient_name=$1 cast hack
    const patientNumeric = !isNaN(Number(patient_id)) ? Number(patient_id) : null;
    const medsResult = await pool.query(
      `SELECT medication_name, dosage, frequency, time_of_day FROM medications
       WHERE (patient_name = $1 OR ($2::int IS NOT NULL AND id = $2::int))
         AND (status = 'active' OR status IS NULL)`,
      [String(patient_id), patientNumeric]
    );

    if (medsResult.rows.length === 0) {
      return res.json({ message: 'No active medications found for this patient', interactions: [] });
    }

    const medications = medsResult.rows;
    const promptText = `Perform a comprehensive drug interaction analysis for an elderly patient.

Return a JSON object:
{
  "overall_risk": "low|moderate|high|critical",
  "summary": "brief overall assessment",
  "interactions": [
    {
      "drug_a": "medication name",
      "drug_b": "medication name",
      "severity": "minor|moderate|major|contraindicated",
      "severity_score": 1-10,
      "description": "interaction description",
      "clinical_effect": "what may happen",
      "recommendation": "what to do"
    }
  ],
  "timing_conflicts": [
    {
      "medications": ["med1", "med2"],
      "issue": "description of timing concern",
      "recommendation": "suggested dosing schedule"
    }
  ],
  "monitoring_required": ["list of things to monitor"],
  "urgent_review_needed": true|false,
  "consult_physician_immediately": true|false
}`;

    const { result, content, parsed: analysis } = await redactedAICall(
      'You are a clinical pharmacist expert. Analyze drug interactions with precision. Always respond in valid JSON format.',
      { medications },
      promptText
    );

    await persistAIResult({
      userId: userIdOf(req),
      endpoint: 'medication-interaction-alert',
      entityType: 'patient',
      entityId: patient_id,
      requestPayload: { patient_id, medication_count: medications.length },
      aiResults: { content, analysis },
      model: result.model
    });
    await logPHIAccess({
      req, action: 'AI_ANALYSIS', entityType: 'patient', entityId: patient_id,
      patientIdentifier: patient_id, phiRedacted: true,
      details: { endpoint: 'medication-interaction-alert', medication_count: medications.length }
    });
    res.json({
      patient_id,
      medication_count: medications.length,
      medications,
      analysis,
      model: result.model
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/fall-risk-score
// Fetches mobility + medications + home safety + incidents, returns daily fall risk score
router.post('/fall-risk-score', auth, aiRateLimiter, async (req, res) => {
  try {
    const { patient_id } = req.body;
    if (!patient_id) return res.status(400).json({ error: 'patient_id is required' });

    const patientStr = String(patient_id);

    // Gather data from multiple tables (gracefully handle missing tables)
    const gather = async (query, params) => {
      try { const r = await pool.query(query, params); return r.rows; }
      catch { return []; }
    };

    const [medications, homeSafety, incidents, healthVitals] = await Promise.all([
      gather('SELECT medication_name, dosage FROM medications WHERE patient_name = $1 AND (status = $2 OR status IS NULL)', [patientStr, 'active']),
      gather('SELECT * FROM home_safety WHERE patient_name = $1 ORDER BY created_at DESC LIMIT 5', [patientStr]),
      gather('SELECT * FROM incident_reports WHERE patient_name = $1 ORDER BY created_at DESC LIMIT 10', [patientStr]),
      gather('SELECT vital_type, value, unit FROM health_monitoring WHERE patient_name = $1 ORDER BY recorded_at DESC LIMIT 20', [patientStr])
    ]);

    const promptText = `Calculate a comprehensive fall risk score for the patient referenced in the redacted payload.

Counts:
- Active medications: ${medications.length}
- Home safety assessments: ${homeSafety.length}
- Recent incidents: ${incidents.length}
- Health vitals: ${healthVitals.length}

Return a JSON object:
{
  "fall_risk_score": 0-100,
  "risk_level": "low|moderate|high|critical",
  "contributing_factors": [
    {
      "factor": "factor name",
      "impact": "low|moderate|high",
      "description": "how this contributes to fall risk",
      "modifiable": true|false
    }
  ],
  "medication_risks": ["medications that increase fall risk"],
  "environmental_risks": ["environmental hazards identified"],
  "physiological_risks": ["physiological factors"],
  "protective_factors": ["factors that reduce risk"],
  "immediate_interventions": ["actions to take now"],
  "long_term_recommendations": ["ongoing strategies"],
  "reassessment_recommended_days": 7,
  "emergency_plan_needed": true|false
}`;

    const { result, content, parsed: risk_assessment } = await redactedAICall(
      'You are a geriatric specialist and fall prevention expert. Always respond in valid JSON format.',
      { medications, home_safety: homeSafety, incidents, vitals: healthVitals },
      promptText
    );

    await persistAIResult({
      userId: userIdOf(req),
      endpoint: 'fall-risk-score',
      entityType: 'patient',
      entityId: patient_id,
      requestPayload: { patient_id },
      aiResults: { content, risk_assessment },
      model: result.model
    });
    await logPHIAccess({
      req, action: 'AI_ANALYSIS', entityType: 'patient', entityId: patient_id,
      patientIdentifier: patient_id, phiRedacted: true,
      details: { endpoint: 'fall-risk-score' }
    });
    res.json({
      patient_id,
      assessment_date: new Date().toISOString(),
      risk_assessment,
      model: result.model
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/caregiver-burnout
// Fetches caregiver notes + hours + patient count, returns burnout risk score
router.post('/caregiver-burnout', auth, aiRateLimiter, async (req, res) => {
  try {
    const { caregiver_id } = req.body;
    if (!caregiver_id) return res.status(400).json({ error: 'caregiver_id is required' });

    const gather = async (query, params) => {
      try { const r = await pool.query(query, params); return r.rows; }
      catch { return []; }
    };

    const [caregiverNotes, recentNotes] = await Promise.all([
      gather('SELECT COUNT(*) as total_notes, MIN(created_at) as first_note, MAX(created_at) as last_note FROM caregiver_notes WHERE caregiver_name = $1 OR caregiver_id = $2', [String(caregiver_id), caregiver_id]),
      gather('SELECT note_text, created_at, mood, stress_level FROM caregiver_notes WHERE caregiver_name = $1 OR caregiver_id = $2 ORDER BY created_at DESC LIMIT 10', [String(caregiver_id), caregiver_id])
    ]);

    const promptText = `Assess caregiver burnout risk based on the redacted note history.

Return a JSON object:
{
  "burnout_risk_score": 0-100,
  "burnout_stage": "none|early|moderate|severe|crisis",
  "key_indicators": [
    {
      "indicator": "indicator name",
      "severity": "low|moderate|high",
      "description": "what was observed"
    }
  ],
  "emotional_state_assessment": "overall emotional health summary",
  "physical_health_concerns": ["physical symptoms of burnout"],
  "respite_recommendations": [
    {
      "type": "type of respite",
      "description": "specific recommendation",
      "urgency": "immediate|soon|planned",
      "duration": "suggested duration"
    }
  ],
  "support_resources": ["community and professional resources"],
  "self_care_plan": {
    "daily": ["daily self-care actions"],
    "weekly": ["weekly recharge activities"],
    "professional_support": "recommendation for professional help"
  },
  "follow_up_recommended": true|false,
  "crisis_intervention_needed": true|false
}`;

    const { result, content, parsed: burnout_assessment } = await redactedAICall(
      'You are a mental health professional specializing in caregiver wellness. Always respond in valid JSON format.',
      { history_summary: caregiverNotes, recent_notes: recentNotes },
      promptText
    );

    await persistAIResult({
      userId: userIdOf(req),
      endpoint: 'caregiver-burnout',
      entityType: 'caregiver',
      entityId: caregiver_id,
      requestPayload: { caregiver_id },
      aiResults: { content, burnout_assessment },
      model: result.model
    });
    await logPHIAccess({
      req, action: 'AI_ANALYSIS', entityType: 'caregiver', entityId: caregiver_id,
      patientIdentifier: caregiver_id, phiRedacted: true,
      details: { endpoint: 'caregiver-burnout' }
    });
    res.json({
      caregiver_id,
      assessment_date: new Date().toISOString(),
      burnout_assessment,
      model: result.model
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/weekly-care-summary
// Aggregates all care activities for a week, generates family summary
router.post('/weekly-care-summary', auth, aiRateLimiter, async (req, res) => {
  try {
    const { patient_id, week_start } = req.body;
    if (!patient_id || !week_start) {
      return res.status(400).json({ error: 'patient_id and week_start are required' });
    }

    const weekStart = new Date(week_start);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const patientStr = String(patient_id);

    const gather = async (query, params) => {
      try { const r = await pool.query(query, params); return r.rows; }
      catch { return []; }
    };

    const [medications, appointments, healthMonitoring, moodTracking, dailyActivities, sleepTracking, incidents] = await Promise.all([
      gather('SELECT medication_name, dosage, frequency FROM medications WHERE patient_name = $1', [patientStr]),
      gather('SELECT doctor_name, specialty, appointment_date, appointment_type, status FROM appointments WHERE patient_name = $1 AND appointment_date BETWEEN $2 AND $3', [patientStr, weekStart, weekEnd]),
      gather('SELECT vital_type, value, unit, recorded_at, status FROM health_monitoring WHERE patient_name = $1 AND recorded_at BETWEEN $2 AND $3', [patientStr, weekStart, weekEnd]),
      gather('SELECT mood, notes, created_at FROM mood_tracking WHERE patient_name = $1 AND created_at BETWEEN $2 AND $3', [patientStr, weekStart, weekEnd]),
      gather('SELECT activity_type, duration_minutes, completed, notes FROM daily_activities WHERE patient_name = $1 AND created_at BETWEEN $2 AND $3', [patientStr, weekStart, weekEnd]),
      gather('SELECT hours_slept, quality, notes FROM sleep_tracking WHERE patient_name = $1 AND created_at BETWEEN $2 AND $3', [patientStr, weekStart, weekEnd]),
      gather('SELECT incident_type, description, severity, created_at FROM incident_reports WHERE patient_name = $1 AND created_at BETWEEN $2 AND $3', [patientStr, weekStart, weekEnd])
    ]);

    const promptText = `Generate a weekly care summary for the week of ${week_start}.

The redacted payload below contains care data for the period. Refer to the patient using the PATIENT_n token if needed.

Return a JSON object:
{
  "week_summary": "2-3 sentence overall summary for family",
  "health_highlights": {
    "overall_status": "stable|improving|declining|concerning",
    "key_vitals": "summary of important vital signs",
    "medication_adherence": "how well medications were managed",
    "notable_changes": ["any significant changes this week"]
  },
  "activities_summary": {
    "engagement_level": "low|moderate|high",
    "completed_activities": ["list of completed activities"],
    "sleep_quality": "summary of sleep patterns",
    "mood_trend": "description of mood during the week"
  },
  "appointments_summary": {
    "completed": ["appointments that occurred"],
    "upcoming": ["upcoming appointments"],
    "follow_ups_needed": ["any follow-up actions"]
  },
  "concerns": [
    {
      "concern": "description",
      "urgency": "low|moderate|high",
      "recommended_action": "what family should know or do"
    }
  ],
  "positive_moments": ["good things that happened this week"],
  "next_week_focus": ["priorities for the coming week"],
  "family_action_items": ["specific things family members can do"]
}`;

    const { result, content, parsed: summary } = await redactedAICall(
      'You are a care coordinator preparing a weekly summary for family members. Write in a warm, clear, and non-alarming tone. Always respond in valid JSON format.',
      { medications, appointments, vitals: healthMonitoring, mood: moodTracking, activities: dailyActivities, sleep: sleepTracking, incidents },
      promptText
    );

    await persistAIResult({
      userId: userIdOf(req),
      endpoint: 'weekly-care-summary',
      entityType: 'patient',
      entityId: patient_id,
      requestPayload: { patient_id, week_start },
      aiResults: { content, summary },
      model: result.model
    });
    await logPHIAccess({
      req, action: 'AI_ANALYSIS', entityType: 'patient', entityId: patient_id,
      patientIdentifier: patient_id, phiRedacted: true,
      details: { endpoint: 'weekly-care-summary', week_start }
    });

    res.json({
      patient_id,
      week_start: weekStart.toISOString().split('T')[0],
      week_end: weekEnd.toISOString().split('T')[0],
      generated_at: new Date().toISOString(),
      summary,
      model: result.model
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =============================================================================
// NEW: Family Proxy Chat — natural language Q&A over a patient's recent week
// =============================================================================
router.post('/family-summary-chat', auth, aiRateLimiter, async (req, res) => {
  try {
    const { patient_id, question } = req.body;
    if (!patient_id || !question) {
      return res.status(400).json({ error: 'patient_id and question are required' });
    }

    const patientStr = String(patient_id);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const gather = async (q, p) => {
      try { const r = await pool.query(q, p); return r.rows; }
      catch { return []; }
    };

    const [vitals, mood, sleep, social, appointments] = await Promise.all([
      gather('SELECT vital_type, value, unit, recorded_at FROM health_monitoring WHERE patient_name = $1 AND recorded_at >= $2 ORDER BY recorded_at DESC LIMIT 30', [patientStr, sevenDaysAgo]),
      gather('SELECT mood, created_at FROM mood_tracking WHERE patient_name = $1 AND created_at >= $2 ORDER BY created_at DESC LIMIT 14', [patientStr, sevenDaysAgo]),
      gather('SELECT hours_slept, quality, created_at FROM sleep_tracking WHERE patient_name = $1 AND created_at >= $2 ORDER BY created_at DESC LIMIT 7', [patientStr, sevenDaysAgo]),
      gather('SELECT activity_type, activity_name, event_date, mood_after FROM social_engagement WHERE patient_name = $1 AND event_date >= $2 ORDER BY event_date DESC LIMIT 14', [patientStr, sevenDaysAgo]),
      gather('SELECT doctor_name, specialty, appointment_date, status FROM appointments WHERE patient_name = $1 AND appointment_date >= $2 ORDER BY appointment_date DESC LIMIT 10', [patientStr, sevenDaysAgo])
    ]);

    const promptText = `A family member asks the following question about an elderly patient. Answer warmly and clearly using only the redacted data below. Cite specific data points where relevant.

Question: ${question}

Return a JSON object:
{
  "answer": "warm, clear answer for family",
  "supporting_data_points": ["specific items from the data that support the answer"],
  "things_going_well": ["positive observations"],
  "things_to_watch": ["mild concerns to monitor"],
  "suggested_followup_questions": ["additional questions family might ask"]
}`;

    const { result, content, parsed } = await redactedAICall(
      'You are a compassionate family liaison summarizing patient care for non-medical family members. Always respond in valid JSON format.',
      { vitals, mood, sleep, social, appointments },
      promptText
    );

    await persistAIResult({
      userId: userIdOf(req),
      endpoint: 'family-summary-chat',
      entityType: 'patient',
      entityId: patient_id,
      requestPayload: { patient_id, question_length: question.length },
      aiResults: { content, parsed },
      model: result.model
    });
    await logPHIAccess({
      req, action: 'AI_ANALYSIS', entityType: 'patient', entityId: patient_id,
      patientIdentifier: patient_id, phiRedacted: true,
      details: { endpoint: 'family-summary-chat' }
    });

    res.json({ patient_id, question, summary: parsed, model: result.model });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =============================================================================
// NEW: Medication Adherence Predictor
// =============================================================================
router.post('/medication-adherence-predictor', auth, aiRateLimiter, async (req, res) => {
  try {
    const { patient_id } = req.body;
    if (!patient_id) return res.status(400).json({ error: 'patient_id is required' });

    const patientStr = String(patient_id);
    const gather = async (q, p) => {
      try { const r = await pool.query(q, p); return r.rows; }
      catch { return []; }
    };

    const [meds, recentMoods, recentNotes] = await Promise.all([
      gather('SELECT medication_name, dosage, frequency, time_of_day, status FROM medications WHERE patient_name = $1', [patientStr]),
      gather('SELECT mood, created_at FROM mood_tracking WHERE patient_name = $1 ORDER BY created_at DESC LIMIT 14', [patientStr]),
      gather('SELECT note_text, created_at FROM caregiver_notes WHERE patient_name = $1 ORDER BY created_at DESC LIMIT 10', [patientStr])
    ]);

    const promptText = `Predict the patient's medication adherence risk over the next 7 days. Consider regimen complexity (count, frequency, time-of-day overlap), recent mood trends, and caregiver-noted observations.

Return a JSON object:
{
  "adherence_risk_score": 0-100,
  "risk_level": "low|moderate|high|critical",
  "primary_drivers": [{"factor": "...", "impact": "low|moderate|high"}],
  "predicted_missed_doses_per_week": 0,
  "high_risk_medications": ["medication names most likely to be missed"],
  "intervention_recommendations": ["actionable steps"],
  "reminder_strategy": "suggested reminder regimen",
  "caregiver_actions_today": ["concrete actions"]
}`;

    const { result, content, parsed } = await redactedAICall(
      'You are a geriatric medication adherence specialist. Always respond in valid JSON format.',
      { medications: meds, recent_mood: recentMoods, recent_notes: recentNotes },
      promptText
    );

    await persistAIResult({
      userId: userIdOf(req),
      endpoint: 'medication-adherence-predictor',
      entityType: 'patient',
      entityId: patient_id,
      requestPayload: { patient_id, medication_count: meds.length },
      aiResults: { content, parsed },
      model: result.model
    });
    await logPHIAccess({
      req, action: 'AI_ANALYSIS', entityType: 'patient', entityId: patient_id,
      patientIdentifier: patient_id, phiRedacted: true,
      details: { endpoint: 'medication-adherence-predictor' }
    });

    res.json({ patient_id, medication_count: meds.length, prediction: parsed, model: result.model });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
