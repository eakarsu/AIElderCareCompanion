const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET all housekeeping tasks
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM housekeeping ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET housekeeping task by id
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM housekeeping WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Housekeeping task not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create housekeeping task
router.post('/', auth, async (req, res) => {
  try {
    const { patient_name, task_name, area, frequency, assigned_to, scheduled_date, completed_date, status, priority, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO housekeeping (patient_name, task_name, area, frequency, assigned_to, scheduled_date, completed_date, status, priority, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [patient_name, task_name, area, frequency, assigned_to, scheduled_date, completed_date, status, priority, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update housekeeping task
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { patient_name, task_name, area, frequency, assigned_to, scheduled_date, completed_date, status, priority, notes } = req.body;
    const result = await pool.query(
      `UPDATE housekeeping SET patient_name=$1, task_name=$2, area=$3, frequency=$4, assigned_to=$5, scheduled_date=$6, completed_date=$7, status=$8, priority=$9, notes=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [patient_name, task_name, area, frequency, assigned_to, scheduled_date, completed_date, status, priority, notes, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Housekeeping task not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE housekeeping task
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM housekeeping WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Housekeeping task not found' });
    }
    res.json({ message: 'Housekeeping task deleted', deleted: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
