const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET all family messages
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM family_messages ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET family message by id
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM family_messages WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Family message not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create family message
router.post('/', auth, async (req, res) => {
  try {
    const { patient_name, sender_name, recipient_name, subject, message, priority, read_status, sent_at } = req.body;
    const result = await pool.query(
      `INSERT INTO family_messages (patient_name, sender_name, recipient_name, subject, message, priority, read_status, sent_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [patient_name, sender_name, recipient_name, subject, message, priority, read_status, sent_at]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update family message
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { patient_name, sender_name, recipient_name, subject, message, priority, read_status, sent_at } = req.body;
    const result = await pool.query(
      `UPDATE family_messages SET patient_name=$1, sender_name=$2, recipient_name=$3, subject=$4, message=$5, priority=$6, read_status=$7, sent_at=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [patient_name, sender_name, recipient_name, subject, message, priority, read_status, sent_at, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Family message not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE family message
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM family_messages WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Family message not found' });
    }
    res.json({ message: 'Family message deleted', deleted: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
