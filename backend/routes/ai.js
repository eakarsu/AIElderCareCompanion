const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { callOpenRouter, OPENROUTER_MODEL } = require('../services/openrouter');
const { parseAIJson } = require('../utils/parseAIJson');
const { persistAIResult } = require('../utils/aiResults');
const { redactPHI, rehydrate } = require('../utils/phiRedaction');
const { logPHIAccess } = require('../utils/hipaaAudit');

const SYSTEM_PROMPT = `You are an AI Elder Care Companion assistant. You help caregivers and healthcare professionals manage elderly patient care. Provide helpful, empathetic, and medically-informed responses. Patient names and identifiers in the input may be tokenized (e.g. PATIENT_1, DOCTOR_2) for privacy — refer to them using the same tokens in your response. Always recommend consulting with healthcare professionals for medical decisions. Format your responses in a clear, organized manner with sections and bullet points where appropriate.`;

/**
 * Sends a redacted prompt to OpenRouter and returns the rehydrated response
 * along with metadata. PHI is never sent to the external provider.
 */
async function runAIRedacted(prompt, context, payload) {
  const { redacted: redactedPayload, mapping } = redactPHI({ context, payload });
  const fullPrompt = `Context: ${JSON.stringify(redactedPayload.context)}\n\n${prompt}\n\nRedacted Data: ${JSON.stringify(redactedPayload.payload)}`;
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: fullPrompt }
  ];
  const result = await callOpenRouter(messages, { max_tokens: 1500, temperature: 0.4 });
  const rawContent = result.choices?.[0]?.message?.content || 'No response generated';
  const rehydratedContent = rehydrate(rawContent, mapping);
  return { result, rawContent, rehydratedContent, mapping };
}

function userId(req) {
  return req.user?.id || req.user?.userId || null;
}

// Medication Analysis
router.post('/medication-analysis', auth, aiRateLimiter, async (req, res) => {
  try {
    const { medications, patient_info } = req.body;
    const { result, rehydratedContent, rawContent } = await runAIRedacted(
      `Analyze the following medications for potential interactions, side effects, and recommendations for an elderly patient.\n\nProvide:\n1. Potential drug interactions\n2. Common side effects for elderly patients\n3. Timing recommendations\n4. Things to watch for\n5. General wellness tips`,
      { type: 'medication_analysis' },
      { medications, patient_info }
    );
    const parsed = parseAIJson(rawContent);
    await persistAIResult({
      userId: userId(req),
      endpoint: 'medication-analysis',
      entityType: 'medication',
      requestPayload: { medication_count: Array.isArray(medications) ? medications.length : 0 },
      aiResults: { content: rehydratedContent, parsed },
      model: result.model
    });
    await logPHIAccess({
      req, action: 'AI_ANALYSIS', entityType: 'medication',
      patientIdentifier: patient_info?.name || patient_info?.patient_id,
      phiRedacted: true, details: { endpoint: 'medication-analysis' }
    });
    res.json({ analysis: rehydratedContent, parsed, model: result.model, usage: result.usage });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Fall Risk Assessment
router.post('/fall-risk-assessment', auth, aiRateLimiter, async (req, res) => {
  try {
    const { patient_data, history } = req.body;
    const { result, rehydratedContent, rawContent } = await runAIRedacted(
      `Perform a fall risk assessment for an elderly patient.\n\nProvide:\n1. Overall risk level (Low/Medium/High/Critical)\n2. Key risk factors identified\n3. Recommended preventive measures\n4. Environmental modifications suggested\n5. Exercise recommendations\n6. When to seek immediate medical attention`,
      { type: 'fall_risk_assessment' },
      { patient_data, history }
    );
    const parsed = parseAIJson(rawContent);
    await persistAIResult({
      userId: userId(req),
      endpoint: 'fall-risk-assessment',
      entityType: 'patient',
      requestPayload: { history_count: Array.isArray(history) ? history.length : 0 },
      aiResults: { content: rehydratedContent, parsed },
      model: result.model
    });
    await logPHIAccess({
      req, action: 'AI_ANALYSIS', entityType: 'patient',
      patientIdentifier: patient_data?.name, phiRedacted: true,
      details: { endpoint: 'fall-risk-assessment' }
    });
    res.json({ assessment: rehydratedContent, parsed, model: result.model, usage: result.usage });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Health Summary
router.post('/health-summary', auth, aiRateLimiter, async (req, res) => {
  try {
    const { vitals, patient_name } = req.body;
    const { result, rehydratedContent, rawContent } = await runAIRedacted(
      `Generate a comprehensive health summary for an elderly patient based on the supplied vitals.\n\nProvide:\n1. Overall health status assessment\n2. Vitals that need attention\n3. Trends to monitor\n4. Lifestyle recommendations\n5. When to contact a physician`,
      { type: 'health_summary' },
      { vitals, patient_name }
    );
    const parsed = parseAIJson(rawContent);
    await persistAIResult({
      userId: userId(req),
      endpoint: 'health-summary',
      entityType: 'patient',
      entityId: patient_name,
      requestPayload: { vital_count: Array.isArray(vitals) ? vitals.length : 0 },
      aiResults: { content: rehydratedContent, parsed },
      model: result.model
    });
    await logPHIAccess({
      req, action: 'AI_ANALYSIS', entityType: 'patient',
      patientIdentifier: patient_name, phiRedacted: true,
      details: { endpoint: 'health-summary' }
    });
    res.json({ summary: rehydratedContent, parsed, model: result.model, usage: result.usage });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Social Engagement Recommendations
router.post('/social-recommendations', auth, aiRateLimiter, async (req, res) => {
  try {
    const { patient_profile, current_activities } = req.body;
    const { result, rehydratedContent, rawContent } = await runAIRedacted(
      `Recommend social engagement activities for an elderly patient.\n\nProvide:\n1. Personalized activity suggestions\n2. Group activities suitable for their abilities\n3. Technology-assisted social options\n4. Family engagement ideas\n5. Community resources to explore\n6. Benefits of each suggested activity`,
      { type: 'social_recommendations' },
      { patient_profile, current_activities }
    );
    const parsed = parseAIJson(rawContent);
    await persistAIResult({
      userId: userId(req),
      endpoint: 'social-recommendations',
      requestPayload: { activity_count: Array.isArray(current_activities) ? current_activities.length : 0 },
      aiResults: { content: rehydratedContent, parsed },
      model: result.model
    });
    await logPHIAccess({
      req, action: 'AI_ANALYSIS', entityType: 'patient',
      patientIdentifier: patient_profile?.name, phiRedacted: true,
      details: { endpoint: 'social-recommendations' }
    });
    res.json({ recommendations: rehydratedContent, parsed, model: result.model, usage: result.usage });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Meal Plan Generator
router.post('/meal-plan', auth, aiRateLimiter, async (req, res) => {
  try {
    const { dietary_needs, restrictions, preferences } = req.body;
    const { result, rehydratedContent, rawContent } = await runAIRedacted(
      `Create a nutritious meal plan for an elderly patient.\n\nProvide:\n1. Recommended daily meal plan (breakfast, lunch, dinner, snacks)\n2. Nutritional benefits of each meal\n3. Easy preparation tips\n4. Hydration recommendations\n5. Supplements to consider\n6. Foods to avoid`,
      { type: 'meal_plan' },
      { dietary_needs, restrictions, preferences }
    );
    const parsed = parseAIJson(rawContent);
    await persistAIResult({
      userId: userId(req),
      endpoint: 'meal-plan',
      requestPayload: { restriction_count: Array.isArray(restrictions) ? restrictions.length : 0 },
      aiResults: { content: rehydratedContent, parsed },
      model: result.model
    });
    res.json({ plan: rehydratedContent, parsed, model: result.model, usage: result.usage });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Cognitive Exercise Generator
router.post('/cognitive-exercises', auth, aiRateLimiter, async (req, res) => {
  try {
    const { difficulty, interests, cognitive_status } = req.body;
    const { result, rehydratedContent, rawContent } = await runAIRedacted(
      `Suggest cognitive exercises for an elderly patient.\n\nProvide:\n1. 5 specific cognitive exercises with instructions\n2. Expected benefits of each exercise\n3. How to track progress\n4. Adaptations for different ability levels\n5. Warning signs to watch for\n6. How to make exercises engaging and fun`,
      { type: 'cognitive_exercises' },
      { difficulty, interests, cognitive_status }
    );
    const parsed = parseAIJson(rawContent);
    await persistAIResult({
      userId: userId(req),
      endpoint: 'cognitive-exercises',
      requestPayload: { difficulty },
      aiResults: { content: rehydratedContent, parsed },
      model: result.model
    });
    res.json({ exercises: rehydratedContent, parsed, model: result.model, usage: result.usage });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Sleep Analysis
router.post('/sleep-analysis', auth, aiRateLimiter, async (req, res) => {
  try {
    const { sleep_data, patient_info } = req.body;
    const { result, rehydratedContent, rawContent } = await runAIRedacted(
      `Analyze sleep patterns for an elderly patient.\n\nProvide:\n1. Sleep quality assessment\n2. Identified sleep issues\n3. Sleep hygiene recommendations\n4. Environmental adjustments\n5. When to consult a sleep specialist\n6. Natural sleep aids appropriate for elderly`,
      { type: 'sleep_analysis' },
      { sleep_data, patient_info }
    );
    const parsed = parseAIJson(rawContent);
    await persistAIResult({
      userId: userId(req),
      endpoint: 'sleep-analysis',
      requestPayload: { record_count: Array.isArray(sleep_data) ? sleep_data.length : 0 },
      aiResults: { content: rehydratedContent, parsed },
      model: result.model
    });
    await logPHIAccess({
      req, action: 'AI_ANALYSIS', entityType: 'patient',
      patientIdentifier: patient_info?.name, phiRedacted: true,
      details: { endpoint: 'sleep-analysis' }
    });
    res.json({ analysis: rehydratedContent, parsed, model: result.model, usage: result.usage });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Mood & Mental Health Insights
router.post('/mood-insights', auth, aiRateLimiter, async (req, res) => {
  try {
    const { mood_data, patient_info } = req.body;
    const { result, rehydratedContent, rawContent } = await runAIRedacted(
      `Provide mental health insights for an elderly patient.\n\nProvide:\n1. Mood pattern analysis\n2. Potential concerns (depression, anxiety, isolation)\n3. Coping strategy suggestions\n4. Activities to improve mood\n5. When to seek professional help\n6. Caregiver support recommendations`,
      { type: 'mood_insights' },
      { mood_data, patient_info }
    );
    const parsed = parseAIJson(rawContent);
    await persistAIResult({
      userId: userId(req),
      endpoint: 'mood-insights',
      requestPayload: { record_count: Array.isArray(mood_data) ? mood_data.length : 0 },
      aiResults: { content: rehydratedContent, parsed },
      model: result.model
    });
    await logPHIAccess({
      req, action: 'AI_ANALYSIS', entityType: 'patient',
      patientIdentifier: patient_info?.name, phiRedacted: true,
      details: { endpoint: 'mood-insights' }
    });
    res.json({ insights: rehydratedContent, parsed, model: result.model, usage: result.usage });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Home Safety Evaluation
router.post('/safety-evaluation', auth, aiRateLimiter, async (req, res) => {
  try {
    const { home_data, patient_mobility } = req.body;
    const { result, rehydratedContent, rawContent } = await runAIRedacted(
      `Evaluate home safety for an elderly patient.\n\nProvide:\n1. Room-by-room safety assessment\n2. Priority hazards to address\n3. Recommended modifications\n4. Assistive devices to consider\n5. Emergency preparedness checklist\n6. Cost-effective safety improvements`,
      { type: 'safety_evaluation' },
      { home_data, patient_mobility }
    );
    const parsed = parseAIJson(rawContent);
    await persistAIResult({
      userId: userId(req),
      endpoint: 'safety-evaluation',
      requestPayload: { rooms: home_data?.rooms?.length || 0 },
      aiResults: { content: rehydratedContent, parsed },
      model: result.model
    });
    res.json({ evaluation: rehydratedContent, parsed, model: result.model, usage: result.usage });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Care Plan Generator
router.post('/care-plan', auth, aiRateLimiter, async (req, res) => {
  try {
    const { patient_profile, conditions, goals } = req.body;
    const { result, rehydratedContent, rawContent } = await runAIRedacted(
      `Generate a comprehensive care plan for an elderly patient.\n\nProvide:\n1. Daily care routine\n2. Medication management schedule\n3. Physical activity plan\n4. Nutrition guidelines\n5. Social engagement plan\n6. Monitoring and check-in schedule\n7. Emergency protocols\n8. Caregiver self-care reminders`,
      { type: 'care_plan' },
      { patient_profile, conditions, goals }
    );
    const parsed = parseAIJson(rawContent);
    await persistAIResult({
      userId: userId(req),
      endpoint: 'care-plan',
      requestPayload: { condition_count: Array.isArray(conditions) ? conditions.length : 0 },
      aiResults: { content: rehydratedContent, parsed },
      model: result.model
    });
    await logPHIAccess({
      req, action: 'AI_ANALYSIS', entityType: 'patient',
      patientIdentifier: patient_profile?.name, phiRedacted: true,
      details: { endpoint: 'care-plan' }
    });
    res.json({ plan: rehydratedContent, parsed, model: result.model, usage: result.usage });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Ensure chat_history table exists
async function ensureChatHistory(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_history (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER,
      user_id INTEGER,
      role VARCHAR(20) NOT NULL,
      content TEXT NOT NULL,
      conversation_id VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// General Chat with multi-turn conversation history (PHI-redacted before sending)
router.post('/chat', auth, aiRateLimiter, async (req, res) => {
  try {
    const pool = require('../db');
    await ensureChatHistory(pool);

    const { message, patient_id, conversation_id } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required' });

    const user_id = req.user?.id || req.user?.userId;
    const conv_id = conversation_id || `conv_${user_id}_${Date.now()}`;

    // Fetch last 6 messages for context (rehydrated copies are stored locally
    // but we redact again before sending to OpenRouter)
    const history = await pool.query(
      `SELECT role, content FROM chat_history
       WHERE conversation_id = $1
       ORDER BY created_at DESC LIMIT 6`,
      [conv_id]
    );
    const contextMessages = history.rows.reverse();

    // Build redacted messages array — entire payload runs through PHI redactor
    const { redacted, mapping } = redactPHI({
      message,
      history: contextMessages.map(r => ({ role: r.role, content: r.content }))
    });

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...redacted.history.map(r => ({ role: r.role, content: r.content })),
      { role: 'user', content: redacted.message }
    ];

    // Store user message (original, not redacted) — local DB is HIPAA-controlled
    await pool.query(
      `INSERT INTO chat_history (patient_id, user_id, role, content, conversation_id) VALUES ($1,$2,$3,$4,$5)`,
      [patient_id || null, user_id, 'user', message, conv_id]
    );

    const responseData = await callOpenRouter(messages, { max_tokens: 1500, temperature: 0.7 });
    const rawAssistant = responseData.choices?.[0]?.message?.content || 'No response generated';
    const assistantContent = rehydrate(rawAssistant, mapping);

    // Store assistant response (rehydrated for display continuity)
    await pool.query(
      `INSERT INTO chat_history (patient_id, user_id, role, content, conversation_id) VALUES ($1,$2,$3,$4,$5)`,
      [patient_id || null, user_id, 'assistant', assistantContent, conv_id]
    );

    await persistAIResult({
      userId: user_id,
      endpoint: 'chat',
      entityType: 'conversation',
      entityId: conv_id,
      requestPayload: { conversation_id: conv_id, message_length: message.length },
      aiResults: { content: assistantContent },
      model: responseData.model
    });

    await logPHIAccess({
      req, action: 'AI_CHAT', entityType: 'conversation',
      entityId: conv_id, patientIdentifier: patient_id,
      phiRedacted: true, details: { endpoint: 'chat' }
    });

    res.json({
      response: assistantContent,
      conversation_id: conv_id,
      model: responseData.model,
      usage: responseData.usage
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
