// ============================================================
// === Batch 03 Gaps & Frontend Mounts ===
// Auto-generated Gap-feature endpoints (lean v0).
// TODO: configure credentials (set OPENROUTER_API_KEY).
// ============================================================
const express = require('express');
const router = express.Router();

let _gfReady = false;
async function ensureGapTable(pool) {
  if (_gfReady || !pool) return;
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS gap_features (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(120) NOT NULL,
      user_id INT,
      input JSONB,
      output JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);
    _gfReady = true;
  } catch (_) { /* tolerant of missing DB */ }
}

async function callAI(prompt) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return { ok: false, status: 503, error: 'AI service unavailable. Set OPENROUTER_API_KEY (TODO: configure credentials).' };
  try {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
      }),
    });
    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content || '';
    return { ok: r.ok, status: r.status, text, raw: data };
  } catch (e) {
    return { ok: false, status: 500, error: String(e.message || e) };
  }
}

function buildHandler(slug, label, hint) {
  return async (req, res) => {
    const body = req.body || {};
    const userId = req.user?.id || null;
    const prompt = `Feature: ${label}\nContext hint: ${hint}\nUser input:\n${JSON.stringify(body, null, 2)}\n\nProduce a concise, actionable response.`;
    const ai = await callAI(prompt);
    try {
      const pool = req.app.locals.pool || req.app.get('pool') || null;
      if (pool) {
        await ensureGapTable(pool);
        await pool.query('INSERT INTO gap_features(slug, user_id, input, output) VALUES ($1,$2,$3,$4)',
          [slug, userId, body, { text: ai.text || ai.error || null }]);
      }
    } catch (_) { /* tolerant */ }
    if (!ai.ok) return res.status(ai.status || 500).json({ error: ai.error || ai.text || `Upstream error (${ai.status})`, slug });
    res.json({ slug, label, result: ai.text });
  };
}

router.post('/gap-no-30-day-hospitalisation-readmission-predictor', buildHandler('gap-ai-no-30-day-hospitalisation-readmission-predictor', 'No 30-day hospitalisation/readmission predictor', 'No 30-day hospitalisation/readmission predictor'));
router.post('/gap-no-medication-cost-optimisation-generic-assistance-progra', buildHandler('gap-ai-no-medication-cost-optimisation-generic-assistance-progra', 'No medication-cost optimisation (generic / assistance progra', 'No medication-cost optimisation (generic / assistance program)'));
router.post('/gap-no-caregiver-burden-detector', buildHandler('gap-ai-no-caregiver-burden-detector', 'No caregiver-burden detector', 'No caregiver-burden detector'));
router.post('/gap-no-nutrition-optimisation-engine-swallow-safe-recipes', buildHandler('gap-ai-no-nutrition-optimisation-engine-swallow-safe-recipes', 'No nutrition-optimisation engine (swallow-safe recipes)', 'No nutrition-optimisation engine (swallow-safe recipes)'));
router.post('/gap-no-wearables-ingestion-no-apple-watch-oura-streaming-endpoi', buildHandler('gap-non-no-wearables-ingestion-no-apple-watch-oura-streaming-endpoi', 'No wearables ingestion (no Apple Watch/Oura streaming endpoi', 'No wearables ingestion (no Apple Watch/Oura streaming endpoint)'));
router.post('/gap-limited-ehr-integration-no-hl7-fhir-import-export', buildHandler('gap-non-limited-ehr-integration-no-hl7-fhir-import-export', 'Limited EHR integration (no HL7-FHIR import/export)', 'Limited EHR integration (no HL7-FHIR import/export)'));
router.post('/gap-no-native-telehealth-video-infrastructure-only-session-meta', buildHandler('gap-non-no-native-telehealth-video-infrastructure-only-session-meta', 'No native telehealth video infrastructure (only session meta', 'No native telehealth video infrastructure (only session metadata)'));
router.post('/gap-no-webhooks-for-pharmacy-ehr-push-updates', buildHandler('gap-non-no-webhooks-for-pharmacy-ehr-push-updates', 'No webhooks for pharmacy/EHR push updates', 'No webhooks for pharmacy/EHR push updates'));
router.post('/gap-limited-notifications-module-only-internal-alerts', buildHandler('gap-non-limited-notifications-module-only-internal-alerts', 'Limited notifications module (only internal alerts)', 'Limited notifications module (only internal alerts)'));
router.post('/gap-no-prescription-e-rx-routing', buildHandler('gap-non-no-prescription-e-rx-routing', 'No prescription e-Rx routing', 'No prescription e-Rx routing'));

module.exports = router;
