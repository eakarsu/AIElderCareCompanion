// Nursing home transition: auto-generate handoff summaries for
// institutional care.
const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { callOpenRouter } = require('../services/openrouter');
const { redactPHI, rehydrate } = require('../utils/phiRedaction');

// POST /api/nursing-home-transition/handoff { patient_id, destination_facility }
router.post('/handoff', auth, aiRateLimiter, async (req, res) => {
  try {
    const { patient_id, destination_facility } = req.body || {};
    if (!patient_id) return res.status(400).json({ error: 'patient_id required' });

    let meds = [], allergies = [], conditions = [], directives = [];
    try { meds = (await pool.query(`SELECT drug_name, dosage, schedule FROM medications WHERE patient_id = $1 AND active = true`, [patient_id])).rows; } catch {}
    try { allergies = (await pool.query(`SELECT allergen, severity FROM allergies WHERE patient_id = $1`, [patient_id])).rows; } catch {}
    try { conditions = (await pool.query(`SELECT diagnosis, status FROM medical_records WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 25`, [patient_id])).rows; } catch {}
    try { directives = (await pool.query(`SELECT doc_type, payload FROM legal_documents WHERE patient_id = $1`, [patient_id])).rows; } catch {}

    const context = { meds, allergies, conditions, directives };
    const { redacted, mapping } = redactPHI ? redactPHI(context) : { redacted: context, mapping: {} };

    const system = 'Compose a clinical handoff summary for skilled-nursing intake. Include diagnoses, meds, allergies, directives, and 24h plan of care.';
    let summary;
    try {
      const raw = await callOpenRouter([{ role: 'system', content: system }, { role: 'user', content: JSON.stringify(redacted).slice(0, 6000) }]);
      summary = rehydrate ? rehydrate(raw, mapping) : raw;
    } catch (e) {
      return res.status(503).json({ error: 'LLM unavailable', detail: e.message });
    }

    try {
      await pool.query(
        `INSERT INTO care_plans (patient_id, plan_type, content, created_at) VALUES ($1,'nursing_home_handoff',$2,NOW())`,
        [patient_id, summary]
      );
    } catch {}

    return res.json({ patient_id, destination_facility: destination_facility || null, summary });
  } catch (e) {
    console.error('handoff error:', e);
    return res.status(500).json({ error: 'handoff failed' });
  }
});

module.exports = router;
