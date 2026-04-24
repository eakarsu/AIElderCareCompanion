const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM medications ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM medications WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { patient_name, medication_name, dosage, frequency, time_of_day, prescribing_doctor, start_date, end_date, notes, status } = req.body;
    const result = await pool.query(
      `INSERT INTO medications (patient_name, medication_name, dosage, frequency, time_of_day, prescribing_doctor, start_date, end_date, notes, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [patient_name, medication_name, dosage, frequency, time_of_day, prescribing_doctor, start_date, end_date, notes, status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { patient_name, medication_name, dosage, frequency, time_of_day, prescribing_doctor, start_date, end_date, notes, status } = req.body;
    const result = await pool.query(
      `UPDATE medications SET patient_name=$1, medication_name=$2, dosage=$3, frequency=$4, time_of_day=$5, prescribing_doctor=$6, start_date=$7, end_date=$8, notes=$9, status=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [patient_name, medication_name, dosage, frequency, time_of_day, prescribing_doctor, start_date, end_date, notes, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM medications WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
