const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET all wound care records
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM wound_care ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET wound care by id
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM wound_care WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Wound care record not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create wound care record
router.post('/', auth, async (req, res) => {
  try {
    const { patient_name, wound_type, wound_location, size_cm, stage, treatment, dressing_type, last_changed, next_change_date, healing_status, caregiver_name, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO wound_care (patient_name, wound_type, wound_location, size_cm, stage, treatment, dressing_type, last_changed, next_change_date, healing_status, caregiver_name, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [patient_name, wound_type, wound_location, size_cm, stage, treatment, dressing_type, last_changed, next_change_date, healing_status, caregiver_name, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update wound care record
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { patient_name, wound_type, wound_location, size_cm, stage, treatment, dressing_type, last_changed, next_change_date, healing_status, caregiver_name, notes } = req.body;
    const result = await pool.query(
      `UPDATE wound_care SET patient_name=$1, wound_type=$2, wound_location=$3, size_cm=$4, stage=$5, treatment=$6, dressing_type=$7, last_changed=$8, next_change_date=$9, healing_status=$10, caregiver_name=$11, notes=$12, updated_at=NOW()
       WHERE id=$13 RETURNING *`,
      [patient_name, wound_type, wound_location, size_cm, stage, treatment, dressing_type, last_changed, next_change_date, healing_status, caregiver_name, notes, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Wound care record not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE wound care record
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM wound_care WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Wound care record not found' });
    }
    res.json({ message: 'Wound care record deleted', deleted: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
