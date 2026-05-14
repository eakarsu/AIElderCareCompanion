const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*) FROM health_monitoring');
    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    const result = await pool.query(
      'SELECT * FROM health_monitoring ORDER BY recorded_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    res.json({
      data: result.rows,
      pagination: { page, limit, total, totalPages }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM health_monitoring WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { patient_name, vital_type, value, unit, recorded_at, normal_range_min, normal_range_max, status, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO health_monitoring (patient_name, vital_type, value, unit, recorded_at, normal_range_min, normal_range_max, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [patient_name, vital_type, value, unit, recorded_at || new Date(), normal_range_min, normal_range_max, status || 'normal', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { patient_name, vital_type, value, unit, recorded_at, normal_range_min, normal_range_max, status, notes } = req.body;
    const result = await pool.query(
      `UPDATE health_monitoring SET patient_name=$1, vital_type=$2, value=$3, unit=$4, recorded_at=$5, normal_range_min=$6, normal_range_max=$7, status=$8, notes=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [patient_name, vital_type, value, unit, recorded_at, normal_range_min, normal_range_max, status, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM health_monitoring WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
