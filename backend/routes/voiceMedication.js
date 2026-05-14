// Voice-activated medication management: elderly can speak medication
// request; system verifies and logs.
const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { callOpenRouter } = require('../services/openrouter');

async function whisper(base64, mimeType = 'audio/webm') {
  // TODO: configure credentials — OPENAI_API_KEY
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const buf = Buffer.from(base64, 'base64');
  const form = new FormData();
  form.append('file', new Blob([buf], { type: mimeType }), 'rec.webm');
  form.append('model', 'whisper-1');
  const r = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  if (!r.ok) return null;
  const j = await r.json();
  return j.text || null;
}

// POST /api/voice-medication/request { patient_id, audio_base64?, transcript? }
router.post('/request', auth, aiRateLimiter, async (req, res) => {
  try {
    const { patient_id, audio_base64, transcript, mimeType } = req.body || {};
    if (!patient_id) return res.status(400).json({ error: 'patient_id required' });
    let text = transcript;
    if (!text && audio_base64) {
      text = await whisper(audio_base64, mimeType);
      if (!text) return res.status(503).json({ error: 'OPENAI_API_KEY missing' });
    }
    if (!text) return res.status(400).json({ error: 'transcript or audio_base64 required' });

    // Lookup the patient's active meds
    let meds = [];
    try {
      const r = await pool.query(`SELECT id, drug_name, dosage, schedule FROM medications WHERE patient_id = $1 AND active = true`, [patient_id]);
      meds = r.rows;
    } catch {}

    const system = 'Match the elderly user\'s spoken request to one of their active medications. Output JSON {"match_id":id_or_null,"confidence":0..1,"explanation":"..."}.';
    let parsed;
    try {
      const raw = await callOpenRouter([{ role: 'system', content: system }, { role: 'user', content: `Request: "${text}"\nActive meds: ${JSON.stringify(meds)}` }]);
      try { parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || raw); } catch { parsed = { raw }; }
    } catch (e) {
      return res.status(503).json({ error: 'LLM unavailable', detail: e.message });
    }

    if (parsed.match_id) {
      try {
        await pool.query(
          `INSERT INTO medication_log (patient_id, medication_id, source, taken_at, notes)
           VALUES ($1,$2,'voice',NOW(),$3)`,
          [patient_id, parsed.match_id, text]
        );
      } catch {}
    }
    return res.json({ patient_id, transcript: text, match: parsed });
  } catch (e) {
    console.error('voice-medication error:', e);
    return res.status(500).json({ error: 'request failed' });
  }
});

module.exports = router;
