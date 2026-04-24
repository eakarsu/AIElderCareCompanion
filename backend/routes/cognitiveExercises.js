const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cognitive_exercises ORDER BY exercise_date DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cognitive_exercises WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { patient_name, exercise_type, exercise_name, difficulty_level, exercise_date, duration_minutes, score, max_score, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO cognitive_exercises (patient_name, exercise_type, exercise_name, difficulty_level, exercise_date, duration_minutes, score, max_score, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [patient_name, exercise_type, exercise_name, difficulty_level, exercise_date || new Date(), duration_minutes, score, max_score, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { patient_name, exercise_type, exercise_name, difficulty_level, exercise_date, duration_minutes, score, max_score, notes } = req.body;
    const result = await pool.query(
      `UPDATE cognitive_exercises SET patient_name=$1, exercise_type=$2, exercise_name=$3, difficulty_level=$4, exercise_date=$5, duration_minutes=$6, score=$7, max_score=$8, notes=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [patient_name, exercise_type, exercise_name, difficulty_level, exercise_date, duration_minutes, score, max_score, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM cognitive_exercises WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
