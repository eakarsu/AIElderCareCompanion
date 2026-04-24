const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET all medical equipment
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM medical_equipment ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET medical equipment by id
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM medical_equipment WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Medical equipment not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create medical equipment
router.post('/', auth, async (req, res) => {
  try {
    const { patient_name, equipment_name, equipment_type, manufacturer, serial_number, purchase_date, warranty_expiry, last_maintenance, next_maintenance, condition, location, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO medical_equipment (patient_name, equipment_name, equipment_type, manufacturer, serial_number, purchase_date, warranty_expiry, last_maintenance, next_maintenance, condition, location, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [patient_name, equipment_name, equipment_type, manufacturer, serial_number, purchase_date, warranty_expiry, last_maintenance, next_maintenance, condition, location, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update medical equipment
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { patient_name, equipment_name, equipment_type, manufacturer, serial_number, purchase_date, warranty_expiry, last_maintenance, next_maintenance, condition, location, notes } = req.body;
    const result = await pool.query(
      `UPDATE medical_equipment SET patient_name=$1, equipment_name=$2, equipment_type=$3, manufacturer=$4, serial_number=$5, purchase_date=$6, warranty_expiry=$7, last_maintenance=$8, next_maintenance=$9, condition=$10, location=$11, notes=$12, updated_at=NOW()
       WHERE id=$13 RETURNING *`,
      [patient_name, equipment_name, equipment_type, manufacturer, serial_number, purchase_date, warranty_expiry, last_maintenance, next_maintenance, condition, location, notes, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Medical equipment not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE medical equipment
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM medical_equipment WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Medical equipment not found' });
    }
    res.json({ message: 'Medical equipment deleted', deleted: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
