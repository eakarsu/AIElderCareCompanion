// Advance directive chatbot: walk through living-will creation with
// state-specific legal guidance.
const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { callOpenRouter } = require('../services/openrouter');

// POST /api/advance-directive/chat { patient_id, state, messages:[{role,content}] }
router.post('/chat', auth, aiRateLimiter, async (req, res) => {
  try {
    const { patient_id, state, messages = [] } = req.body || {};
    if (!patient_id || !state || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'patient_id, state, messages[] required' });
    }
    const system = `You are an advance-directive intake assistant for the U.S. state of ${state}. Walk the user through end-of-life preferences, healthcare proxy designation, and POLST topics. Output JSON {"reply":"...","fields_collected":{...},"next_question":"...","ready_for_review":bool}.`;
    let parsed;
    try {
      const raw = await callOpenRouter([{ role: 'system', content: system }, ...messages]);
      try { parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || raw); } catch { parsed = { raw }; }
    } catch (e) {
      return res.status(503).json({ error: 'LLM unavailable', detail: e.message });
    }
    try {
      await pool.query(
        `INSERT INTO legal_documents (patient_id, doc_type, state, payload, created_at)
         VALUES ($1,'advance_directive_draft',$2,$3,NOW())`,
        [patient_id, state, JSON.stringify(parsed)]
      );
    } catch {}
    return res.json({ response: parsed });
  } catch (e) {
    return res.status(500).json({ error: 'chat failed' });
  }
});

module.exports = router;
