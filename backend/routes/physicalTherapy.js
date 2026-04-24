const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM physical_therapy ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM physical_therapy WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { patient_name, therapist_name, exercise_name, exercise_type, session_date, duration_minutes, sets, reps, pain_level, progress_notes, status } = req.body;
    const result = await pool.query(
      `INSERT INTO physical_therapy (patient_name, therapist_name, exercise_name, exercise_type, session_date, duration_minutes, sets, reps, pain_level, progress_notes, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [patient_name, therapist_name, exercise_name, exercise_type, session_date, duration_minutes, sets, reps, pain_level, progress_notes, status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { patient_name, therapist_name, exercise_name, exercise_type, session_date, duration_minutes, sets, reps, pain_level, progress_notes, status } = req.body;
    const result = await pool.query(
      `UPDATE physical_therapy SET patient_name=$1, therapist_name=$2, exercise_name=$3, exercise_type=$4, session_date=$5, duration_minutes=$6, sets=$7, reps=$8, pain_level=$9, progress_notes=$10, status=$11, updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [patient_name, therapist_name, exercise_name, exercise_type, session_date, duration_minutes, sets, reps, pain_level, progress_notes, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM physical_therapy WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
