const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM care_plans ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM care_plans WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { patient_name, plan_title, plan_type, start_date, end_date, goals, interventions, responsible_party, frequency, status, review_date, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO care_plans (patient_name, plan_title, plan_type, start_date, end_date, goals, interventions, responsible_party, frequency, status, review_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [patient_name, plan_title, plan_type, start_date, end_date, goals, interventions, responsible_party, frequency, status || 'active', review_date, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { patient_name, plan_title, plan_type, start_date, end_date, goals, interventions, responsible_party, frequency, status, review_date, notes } = req.body;
    const result = await pool.query(
      `UPDATE care_plans SET patient_name=$1, plan_title=$2, plan_type=$3, start_date=$4, end_date=$5, goals=$6, interventions=$7, responsible_party=$8, frequency=$9, status=$10, review_date=$11, notes=$12, updated_at=NOW()
       WHERE id=$13 RETURNING *`,
      [patient_name, plan_title, plan_type, start_date, end_date, goals, interventions, responsible_party, frequency, status, review_date, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM care_plans WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
