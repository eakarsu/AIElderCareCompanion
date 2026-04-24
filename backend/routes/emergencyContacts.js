const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM emergency_contacts ORDER BY priority ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM emergency_contacts WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { patient_name, contact_name, relationship, phone, email, address, priority, is_medical_proxy, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO emergency_contacts (patient_name, contact_name, relationship, phone, email, address, priority, is_medical_proxy, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [patient_name, contact_name, relationship, phone, email, address, priority || 1, is_medical_proxy || false, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { patient_name, contact_name, relationship, phone, email, address, priority, is_medical_proxy, notes } = req.body;
    const result = await pool.query(
      `UPDATE emergency_contacts SET patient_name=$1, contact_name=$2, relationship=$3, phone=$4, email=$5, address=$6, priority=$7, is_medical_proxy=$8, notes=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [patient_name, contact_name, relationship, phone, email, address, priority, is_medical_proxy, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM emergency_contacts WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
