const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM incident_reports ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM incident_reports WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { patient_name, incident_type, incident_date, location, description, severity, witnesses, action_taken, reported_by, follow_up_required, status, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO incident_reports (patient_name, incident_type, incident_date, location, description, severity, witnesses, action_taken, reported_by, follow_up_required, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [patient_name, incident_type, incident_date, location, description, severity, witnesses, action_taken, reported_by, follow_up_required, status || 'open', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { patient_name, incident_type, incident_date, location, description, severity, witnesses, action_taken, reported_by, follow_up_required, status, notes } = req.body;
    const result = await pool.query(
      `UPDATE incident_reports SET patient_name=$1, incident_type=$2, incident_date=$3, location=$4, description=$5, severity=$6, witnesses=$7, action_taken=$8, reported_by=$9, follow_up_required=$10, status=$11, notes=$12, updated_at=NOW()
       WHERE id=$13 RETURNING *`,
      [patient_name, incident_type, incident_date, location, description, severity, witnesses, action_taken, reported_by, follow_up_required, status, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM incident_reports WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
