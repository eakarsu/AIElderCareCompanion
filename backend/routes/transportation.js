const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM transportation ORDER BY pickup_date DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM transportation WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { patient_name, pickup_location, dropoff_location, pickup_date, pickup_time, transport_type, wheelchair_accessible, companion_needed, driver_name, status, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO transportation (patient_name, pickup_location, dropoff_location, pickup_date, pickup_time, transport_type, wheelchair_accessible, companion_needed, driver_name, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [patient_name, pickup_location, dropoff_location, pickup_date, pickup_time, transport_type, wheelchair_accessible || false, companion_needed || false, driver_name, status || 'scheduled', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { patient_name, pickup_location, dropoff_location, pickup_date, pickup_time, transport_type, wheelchair_accessible, companion_needed, driver_name, status, notes } = req.body;
    const result = await pool.query(
      `UPDATE transportation SET patient_name=$1, pickup_location=$2, dropoff_location=$3, pickup_date=$4, pickup_time=$5, transport_type=$6, wheelchair_accessible=$7, companion_needed=$8, driver_name=$9, status=$10, notes=$11, updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [patient_name, pickup_location, dropoff_location, pickup_date, pickup_time, transport_type, wheelchair_accessible, companion_needed, driver_name, status, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM transportation WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
