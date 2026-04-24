const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM allergies ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM allergies WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { patient_name, allergen, allergy_type, severity, reaction, diagnosed_date, diagnosed_by, treatment, status, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO allergies (patient_name, allergen, allergy_type, severity, reaction, diagnosed_date, diagnosed_by, treatment, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [patient_name, allergen, allergy_type, severity, reaction, diagnosed_date, diagnosed_by, treatment, status || 'active', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { patient_name, allergen, allergy_type, severity, reaction, diagnosed_date, diagnosed_by, treatment, status, notes } = req.body;
    const result = await pool.query(
      `UPDATE allergies SET patient_name=$1, allergen=$2, allergy_type=$3, severity=$4, reaction=$5, diagnosed_date=$6, diagnosed_by=$7, treatment=$8, status=$9, notes=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [patient_name, allergen, allergy_type, severity, reaction, diagnosed_date, diagnosed_by, treatment, status, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM allergies WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
