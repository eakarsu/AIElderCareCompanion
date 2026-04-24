const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM medical_records ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM medical_records WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { patient_name, record_type, title, description, doctor_name, facility, record_date, diagnosis_code, attachments, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO medical_records (patient_name, record_type, title, description, doctor_name, facility, record_date, diagnosis_code, attachments, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [patient_name, record_type, title, description, doctor_name, facility, record_date, diagnosis_code, attachments, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { patient_name, record_type, title, description, doctor_name, facility, record_date, diagnosis_code, attachments, notes } = req.body;
    const result = await pool.query(
      `UPDATE medical_records SET patient_name=$1, record_type=$2, title=$3, description=$4, doctor_name=$5, facility=$6, record_date=$7, diagnosis_code=$8, attachments=$9, notes=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [patient_name, record_type, title, description, doctor_name, facility, record_date, diagnosis_code, attachments, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM medical_records WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
