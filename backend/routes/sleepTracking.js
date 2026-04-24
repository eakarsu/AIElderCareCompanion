const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sleep_tracking ORDER BY sleep_date DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sleep_tracking WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { patient_name, sleep_date, bedtime, wake_time, total_hours, sleep_quality, interruptions, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO sleep_tracking (patient_name, sleep_date, bedtime, wake_time, total_hours, sleep_quality, interruptions, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [patient_name, sleep_date || new Date(), bedtime, wake_time, total_hours, sleep_quality, interruptions || 0, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { patient_name, sleep_date, bedtime, wake_time, total_hours, sleep_quality, interruptions, notes } = req.body;
    const result = await pool.query(
      `UPDATE sleep_tracking SET patient_name=$1, sleep_date=$2, bedtime=$3, wake_time=$4, total_hours=$5, sleep_quality=$6, interruptions=$7, notes=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [patient_name, sleep_date, bedtime, wake_time, total_hours, sleep_quality, interruptions, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM sleep_tracking WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
