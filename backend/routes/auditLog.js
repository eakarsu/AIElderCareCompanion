/**
 * HIPAA audit log query endpoint (admin/nurse only).
 *  GET /api/audit-log               — paginated list with optional filters
 *  GET /api/audit-log/patient/:id   — entries for a single patient
 *  GET /api/audit-log/user/:id      — entries for a single user
 */
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const pool = require('../db');
const { requireRole } = require('../middleware/rbac');
const { ensureTable } = require('../utils/hipaaAudit');

router.use(auth, requireRole('admin', 'nurse'));

router.get('/', async (req, res) => {
  try {
    await ensureTable();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const where = [];
    const params = [];
    if (req.query.user_id) { params.push(req.query.user_id); where.push(`user_id = $${params.length}`); }
    if (req.query.action) { params.push(req.query.action); where.push(`action = $${params.length}`); }
    if (req.query.entity_type) { params.push(req.query.entity_type); where.push(`entity_type = $${params.length}`); }
    if (req.query.patient) { params.push(req.query.patient); where.push(`patient_identifier = $${params.length}`); }
    if (req.query.from) { params.push(req.query.from); where.push(`created_at >= $${params.length}`); }
    if (req.query.to) { params.push(req.query.to); where.push(`created_at <= $${params.length}`); }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const countQ = await pool.query(`SELECT COUNT(*) FROM hipaa_audit_log ${whereClause}`, params);
    const total = parseInt(countQ.rows[0].count);

    params.push(limit); params.push(offset);
    const rows = await pool.query(
      `SELECT id, user_id, user_email, user_role, action, entity_type, entity_id,
              patient_identifier, ip_address, phi_redacted, details, created_at
         FROM hipaa_audit_log ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      data: rows.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/patient/:id', async (req, res) => {
  try {
    await ensureTable();
    const r = await pool.query(
      `SELECT id, user_id, user_email, user_role, action, entity_type, entity_id,
              ip_address, phi_redacted, details, created_at
         FROM hipaa_audit_log WHERE patient_identifier = $1
         ORDER BY created_at DESC LIMIT 500`,
      [req.params.id]
    );
    res.json({ data: r.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/user/:id', async (req, res) => {
  try {
    await ensureTable();
    const r = await pool.query(
      `SELECT id, action, entity_type, entity_id, patient_identifier,
              ip_address, phi_redacted, details, created_at
         FROM hipaa_audit_log WHERE user_id = $1
         ORDER BY created_at DESC LIMIT 500`,
      [req.params.id]
    );
    res.json({ data: r.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
