const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM fall_alerts ORDER BY alert_time DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM fall_alerts WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { patient_name, location, severity, alert_time, sensor_type, response_status, responder_name, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO fall_alerts (patient_name, location, severity, alert_time, sensor_type, response_status, responder_name, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [patient_name, location, severity, alert_time || new Date(), sensor_type, response_status || 'pending', responder_name, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { patient_name, location, severity, alert_time, sensor_type, response_status, responder_name, notes } = req.body;
    const result = await pool.query(
      `UPDATE fall_alerts SET patient_name=$1, location=$2, severity=$3, alert_time=$4, sensor_type=$5, response_status=$6, responder_name=$7, notes=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [patient_name, location, severity, alert_time, sensor_type, response_status, responder_name, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM fall_alerts WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
