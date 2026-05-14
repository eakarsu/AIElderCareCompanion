// Agentic health coach: proactive outreach based on health trends.
const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { callOpenRouter } = require('../services/openrouter');

// POST /api/agentic-health-coach/scan { patient_id }
router.post('/scan', auth, aiRateLimiter, async (req, res) => {
  try {
    const { patient_id } = req.body || {};
    if (!patient_id) return res.status(400).json({ error: 'patient_id required' });

    let recentVitals = [];
    let meds = [];
    let mood = [];
    try {
      const r = await pool.query(`SELECT * FROM health_monitoring WHERE patient_id = $1 AND ts > NOW() - INTERVAL '14 days' ORDER BY ts DESC LIMIT 200`, [patient_id]);
      recentVitals = r.rows;
    } catch {}
    try {
      const r = await pool.query(`SELECT drug_name, dosage FROM medications WHERE patient_id = $1 AND active = true`, [patient_id]);
      meds = r.rows;
    } catch {}
    try {
      const r = await pool.query(`SELECT * FROM mood_tracking WHERE patient_id = $1 ORDER BY recorded_at DESC LIMIT 14`, [patient_id]);
      mood = r.rows;
    } catch {}

    const system = 'You are a proactive geriatric health coach. Detect concerning trends (rising BP, sleep degradation, mood dip) and suggest outreach actions. Output JSON {"alerts":["..."],"outreach":[{"channel":"phone|sms|email","message":"..."}]}.';
    let parsed;
    try {
      const raw = await callOpenRouter([{ role: 'system', content: system }, { role: 'user', content: JSON.stringify({ vitals: recentVitals.slice(0, 30), meds, mood }).slice(0, 6000) }]);
      try { parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || raw); } catch { parsed = { raw }; }
    } catch (e) {
      return res.status(503).json({ error: 'LLM unavailable', detail: e.message });
    }

    try {
      await pool.query(`INSERT INTO caregiver_notes (patient_id, content, source, created_at) VALUES ($1,$2,'agentic_coach',NOW())`, [patient_id, JSON.stringify(parsed)]);
    } catch {}
    return res.json({ patient_id, scan: parsed, vital_count: recentVitals.length });
  } catch (e) {
    console.error('agentic coach error:', e);
    return res.status(500).json({ error: 'scan failed' });
  }
});

module.exports = router;
