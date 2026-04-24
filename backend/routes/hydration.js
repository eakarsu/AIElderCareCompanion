const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM hydration_tracking ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM hydration_tracking WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { patient_name, drink_type, amount_ml, recorded_at, daily_goal_ml, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO hydration_tracking (patient_name, drink_type, amount_ml, recorded_at, daily_goal_ml, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [patient_name, drink_type, amount_ml, recorded_at, daily_goal_ml, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { patient_name, drink_type, amount_ml, recorded_at, daily_goal_ml, notes } = req.body;
    const result = await pool.query(
      `UPDATE hydration_tracking SET patient_name=$1, drink_type=$2, amount_ml=$3, recorded_at=$4, daily_goal_ml=$5, notes=$6, updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [patient_name, drink_type, amount_ml, recorded_at, daily_goal_ml, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM hydration_tracking WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
