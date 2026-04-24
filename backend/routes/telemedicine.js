const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM telemedicine ORDER BY session_date DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM telemedicine WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { patient_name, doctor_name, specialty, session_date, session_time, duration_minutes, platform, session_type, diagnosis, prescription, follow_up_date, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO telemedicine (patient_name, doctor_name, specialty, session_date, session_time, duration_minutes, platform, session_type, diagnosis, prescription, follow_up_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [patient_name, doctor_name, specialty, session_date, session_time, duration_minutes, platform, session_type, diagnosis, prescription, follow_up_date, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { patient_name, doctor_name, specialty, session_date, session_time, duration_minutes, platform, session_type, diagnosis, prescription, follow_up_date, notes } = req.body;
    const result = await pool.query(
      `UPDATE telemedicine SET patient_name=$1, doctor_name=$2, specialty=$3, session_date=$4, session_time=$5, duration_minutes=$6, platform=$7, session_type=$8, diagnosis=$9, prescription=$10, follow_up_date=$11, notes=$12, updated_at=NOW()
       WHERE id=$13 RETURNING *`,
      [patient_name, doctor_name, specialty, session_date, session_time, duration_minutes, platform, session_type, diagnosis, prescription, follow_up_date, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM telemedicine WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
