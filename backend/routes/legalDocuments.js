const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET all legal documents
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM legal_documents ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET legal document by id
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM legal_documents WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Legal document not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create legal document
router.post('/', auth, async (req, res) => {
  try {
    const { patient_name, document_type, title, description, attorney_name, effective_date, expiration_date, storage_location, status, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO legal_documents (patient_name, document_type, title, description, attorney_name, effective_date, expiration_date, storage_location, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [patient_name, document_type, title, description, attorney_name, effective_date, expiration_date, storage_location, status, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update legal document
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { patient_name, document_type, title, description, attorney_name, effective_date, expiration_date, storage_location, status, notes } = req.body;
    const result = await pool.query(
      `UPDATE legal_documents SET patient_name=$1, document_type=$2, title=$3, description=$4, attorney_name=$5, effective_date=$6, expiration_date=$7, storage_location=$8, status=$9, notes=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [patient_name, document_type, title, description, attorney_name, effective_date, expiration_date, storage_location, status, notes, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Legal document not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE legal document
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM legal_documents WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Legal document not found' });
    }
    res.json({ message: 'Legal document deleted', deleted: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
