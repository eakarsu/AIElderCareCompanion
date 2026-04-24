const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET all billing records
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM billing ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET billing by id
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM billing WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Billing record not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create billing record
router.post('/', auth, async (req, res) => {
  try {
    const { patient_name, service_type, description, amount, billing_date, due_date, insurance_covered, out_of_pocket, payment_status, payment_method, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO billing (patient_name, service_type, description, amount, billing_date, due_date, insurance_covered, out_of_pocket, payment_status, payment_method, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [patient_name, service_type, description, amount, billing_date, due_date, insurance_covered, out_of_pocket, payment_status, payment_method, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update billing record
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { patient_name, service_type, description, amount, billing_date, due_date, insurance_covered, out_of_pocket, payment_status, payment_method, notes } = req.body;
    const result = await pool.query(
      `UPDATE billing SET patient_name=$1, service_type=$2, description=$3, amount=$4, billing_date=$5, due_date=$6, insurance_covered=$7, out_of_pocket=$8, payment_status=$9, payment_method=$10, notes=$11, updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [patient_name, service_type, description, amount, billing_date, due_date, insurance_covered, out_of_pocket, payment_status, payment_method, notes, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Billing record not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE billing record
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM billing WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Billing record not found' });
    }
    res.json({ message: 'Billing record deleted', deleted: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
