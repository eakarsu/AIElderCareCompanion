const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM daily_activities ORDER BY activity_date DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM daily_activities WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { patient_name, activity_name, activity_type, activity_date, duration_minutes, completion_status, assistance_needed, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO daily_activities (patient_name, activity_name, activity_type, activity_date, duration_minutes, completion_status, assistance_needed, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [patient_name, activity_name, activity_type, activity_date || new Date(), duration_minutes, completion_status || 'completed', assistance_needed || false, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { patient_name, activity_name, activity_type, activity_date, duration_minutes, completion_status, assistance_needed, notes } = req.body;
    const result = await pool.query(
      `UPDATE daily_activities SET patient_name=$1, activity_name=$2, activity_type=$3, activity_date=$4, duration_minutes=$5, completion_status=$6, assistance_needed=$7, notes=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [patient_name, activity_name, activity_type, activity_date, duration_minutes, completion_status, assistance_needed, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM daily_activities WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
