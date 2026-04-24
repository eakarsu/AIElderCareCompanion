const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM immunizations ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM immunizations WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { patient_name, vaccine_name, vaccine_type, dose_number, administered_date, administered_by, facility, lot_number, next_due_date, side_effects, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO immunizations (patient_name, vaccine_name, vaccine_type, dose_number, administered_date, administered_by, facility, lot_number, next_due_date, side_effects, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [patient_name, vaccine_name, vaccine_type, dose_number, administered_date, administered_by, facility, lot_number, next_due_date, side_effects, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { patient_name, vaccine_name, vaccine_type, dose_number, administered_date, administered_by, facility, lot_number, next_due_date, side_effects, notes } = req.body;
    const result = await pool.query(
      `UPDATE immunizations SET patient_name=$1, vaccine_name=$2, vaccine_type=$3, dose_number=$4, administered_date=$5, administered_by=$6, facility=$7, lot_number=$8, next_due_date=$9, side_effects=$10, notes=$11, updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [patient_name, vaccine_name, vaccine_type, dose_number, administered_date, administered_by, facility, lot_number, next_due_date, side_effects, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM immunizations WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
