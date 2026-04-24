const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM meal_planning ORDER BY meal_date DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM meal_planning WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { patient_name, meal_type, meal_name, meal_date, calories, dietary_restrictions, ingredients, preparation_notes, status } = req.body;
    const result = await pool.query(
      `INSERT INTO meal_planning (patient_name, meal_type, meal_name, meal_date, calories, dietary_restrictions, ingredients, preparation_notes, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [patient_name, meal_type, meal_name, meal_date || new Date(), calories, dietary_restrictions, ingredients, preparation_notes, status || 'planned']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { patient_name, meal_type, meal_name, meal_date, calories, dietary_restrictions, ingredients, preparation_notes, status } = req.body;
    const result = await pool.query(
      `UPDATE meal_planning SET patient_name=$1, meal_type=$2, meal_name=$3, meal_date=$4, calories=$5, dietary_restrictions=$6, ingredients=$7, preparation_notes=$8, status=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [patient_name, meal_type, meal_name, meal_date, calories, dietary_restrictions, ingredients, preparation_notes, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM meal_planning WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
