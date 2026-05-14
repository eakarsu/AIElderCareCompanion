// Pet care companion: track pet medications, vet appointments, integrate
// with ADLs.
const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// POST /api/pet-care/pets { patient_id, name, species, dob? }
router.post('/pets', auth, async (req, res) => {
  try {
    const { patient_id, name, species, dob } = req.body || {};
    if (!patient_id || !name || !species) return res.status(400).json({ error: 'patient_id, name, species required' });
    let id = null;
    try {
      const r = await pool.query(
        `INSERT INTO pets (patient_id, name, species, dob, created_at) VALUES ($1,$2,$3,$4,NOW()) RETURNING id`,
        [patient_id, name, species, dob || null]
      );
      id = r.rows[0].id;
    } catch (e) {
      return res.status(500).json({ error: 'pets table missing — please add migration' });
    }
    return res.json({ id, patient_id, name, species });
  } catch (e) {
    return res.status(500).json({ error: 'create failed' });
  }
});

// POST /api/pet-care/medication { pet_id, drug_name, dose, schedule }
router.post('/medication', auth, async (req, res) => {
  try {
    const { pet_id, drug_name, dose, schedule } = req.body || {};
    if (!pet_id || !drug_name) return res.status(400).json({ error: 'pet_id + drug_name required' });
    try {
      const r = await pool.query(
        `INSERT INTO pet_medications (pet_id, drug_name, dose, schedule, created_at) VALUES ($1,$2,$3,$4,NOW()) RETURNING id`,
        [pet_id, drug_name, dose || null, schedule || null]
      );
      return res.json({ id: r.rows[0].id, pet_id, drug_name });
    } catch (e) {
      return res.status(500).json({ error: 'pet_medications table missing' });
    }
  } catch (e) {
    return res.status(500).json({ error: 'create failed' });
  }
});

// POST /api/pet-care/vet-appointments { pet_id, when, reason }
router.post('/vet-appointments', auth, async (req, res) => {
  try {
    const { pet_id, when, reason, vet_name } = req.body || {};
    if (!pet_id || !when) return res.status(400).json({ error: 'pet_id + when required' });
    try {
      const r = await pool.query(
        `INSERT INTO pet_vet_appointments (pet_id, scheduled_for, reason, vet_name, created_at) VALUES ($1,$2,$3,$4,NOW()) RETURNING id`,
        [pet_id, new Date(when), reason || null, vet_name || null]
      );
      return res.json({ id: r.rows[0].id, pet_id, scheduled_for: when });
    } catch (e) {
      return res.status(500).json({ error: 'pet_vet_appointments table missing' });
    }
  } catch (e) {
    return res.status(500).json({ error: 'create failed' });
  }
});

module.exports = router;
