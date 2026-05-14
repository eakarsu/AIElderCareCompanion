// Real-time health monitoring: streaming vitals from wearables with
// threshold-triggered alerts.
const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

const THRESHOLDS = {
  hr_high: Number(process.env.HR_HIGH || 110),
  hr_low: Number(process.env.HR_LOW || 50),
  spo2_low: Number(process.env.SPO2_LOW || 92),
  sys_bp_high: Number(process.env.SYS_HIGH || 160),
  dia_bp_high: Number(process.env.DIA_HIGH || 100),
};

// POST /api/realtime-health/ingest { patient_id, source, samples:[{ts,hr?,spo2?,sys_bp?,dia_bp?}] }
router.post('/ingest', auth, async (req, res) => {
  try {
    const { patient_id, source = 'manual', samples = [] } = req.body || {};
    if (!patient_id || !Array.isArray(samples)) return res.status(400).json({ error: 'patient_id + samples[] required' });
    // TODO: configure credentials — OURA_API_KEY / APPLE_HEALTH_TOKEN / TERRA_API_KEY
    const alerts = [];
    let inserted = 0;
    for (const s of samples.slice(0, 1000)) {
      try {
        await pool.query(
          `INSERT INTO health_monitoring (patient_id, source, ts, hr, spo2, sys_bp, dia_bp, raw)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [patient_id, source, s.ts || new Date(), s.hr || null, s.spo2 || null, s.sys_bp || null, s.dia_bp || null, s]
        );
        inserted++;
      } catch {}
      if (s.hr != null && (s.hr > THRESHOLDS.hr_high || s.hr < THRESHOLDS.hr_low)) alerts.push({ ts: s.ts, type: 'hr_out_of_range', value: s.hr });
      if (s.spo2 != null && s.spo2 < THRESHOLDS.spo2_low) alerts.push({ ts: s.ts, type: 'spo2_low', value: s.spo2 });
      if (s.sys_bp != null && s.sys_bp > THRESHOLDS.sys_bp_high) alerts.push({ ts: s.ts, type: 'sys_bp_high', value: s.sys_bp });
      if (s.dia_bp != null && s.dia_bp > THRESHOLDS.dia_bp_high) alerts.push({ ts: s.ts, type: 'dia_bp_high', value: s.dia_bp });
    }
    if (alerts.length) {
      try {
        await pool.query(
          `INSERT INTO fall_alerts (patient_id, alert_type, payload, created_at) VALUES ($1,'vital_threshold',$2,NOW())`,
          [patient_id, JSON.stringify(alerts)]
        );
      } catch {}
    }
    return res.json({ patient_id, source, inserted, alerts });
  } catch (e) {
    console.error('realtime-health error:', e);
    return res.status(500).json({ error: 'ingest failed' });
  }
});

module.exports = router;
