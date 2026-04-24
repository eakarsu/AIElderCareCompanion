const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM social_engagement ORDER BY event_date DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM social_engagement WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { patient_name, activity_type, activity_name, event_date, duration_minutes, participants, location, mood_before, mood_after, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO social_engagement (patient_name, activity_type, activity_name, event_date, duration_minutes, participants, location, mood_before, mood_after, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [patient_name, activity_type, activity_name, event_date, duration_minutes, participants, location, mood_before, mood_after, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { patient_name, activity_type, activity_name, event_date, duration_minutes, participants, location, mood_before, mood_after, notes } = req.body;
    const result = await pool.query(
      `UPDATE social_engagement SET patient_name=$1, activity_type=$2, activity_name=$3, event_date=$4, duration_minutes=$5, participants=$6, location=$7, mood_before=$8, mood_after=$9, notes=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [patient_name, activity_type, activity_name, event_date, duration_minutes, participants, location, mood_before, mood_after, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM social_engagement WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
