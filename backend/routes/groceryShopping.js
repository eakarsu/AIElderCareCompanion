const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET all grocery shopping items
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM grocery_shopping ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET grocery shopping item by id
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM grocery_shopping WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Grocery shopping item not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create grocery shopping item
router.post('/', auth, async (req, res) => {
  try {
    const { patient_name, item_name, category, quantity, unit, needed_by, dietary_note, purchased, store, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO grocery_shopping (patient_name, item_name, category, quantity, unit, needed_by, dietary_note, purchased, store, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [patient_name, item_name, category, quantity, unit, needed_by, dietary_note, purchased, store, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update grocery shopping item
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { patient_name, item_name, category, quantity, unit, needed_by, dietary_note, purchased, store, notes } = req.body;
    const result = await pool.query(
      `UPDATE grocery_shopping SET patient_name=$1, item_name=$2, category=$3, quantity=$4, unit=$5, needed_by=$6, dietary_note=$7, purchased=$8, store=$9, notes=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [patient_name, item_name, category, quantity, unit, needed_by, dietary_note, purchased, store, notes, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Grocery shopping item not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE grocery shopping item
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM grocery_shopping WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Grocery shopping item not found' });
    }
    res.json({ message: 'Grocery shopping item deleted', deleted: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
