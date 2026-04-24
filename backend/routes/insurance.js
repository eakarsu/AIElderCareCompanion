const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET all insurance records
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM insurance ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET insurance by id
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM insurance WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Insurance record not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create insurance record
router.post('/', auth, async (req, res) => {
  try {
    const { patient_name, provider_name, policy_number, group_number, plan_type, coverage_start, coverage_end, copay, deductible, contact_phone, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO insurance (patient_name, provider_name, policy_number, group_number, plan_type, coverage_start, coverage_end, copay, deductible, contact_phone, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [patient_name, provider_name, policy_number, group_number, plan_type, coverage_start, coverage_end, copay, deductible, contact_phone, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update insurance record
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { patient_name, provider_name, policy_number, group_number, plan_type, coverage_start, coverage_end, copay, deductible, contact_phone, notes } = req.body;
    const result = await pool.query(
      `UPDATE insurance SET patient_name=$1, provider_name=$2, policy_number=$3, group_number=$4, plan_type=$5, coverage_start=$6, coverage_end=$7, copay=$8, deductible=$9, contact_phone=$10, notes=$11, updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [patient_name, provider_name, policy_number, group_number, plan_type, coverage_start, coverage_end, copay, deductible, contact_phone, notes, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Insurance record not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE insurance record
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM insurance WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Insurance record not found' });
    }
    res.json({ message: 'Insurance record deleted', deleted: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
