const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { CareWorkflowError, validateEnrollment, validateIncident, assertPlanTransition, familySafeSummary } = require('../services/careWorkflow');

const router = express.Router();
router.use(auth);
const tenant = (req) => String(req.user.tenant_id || '').trim();
const actor = (req) => String(req.user.id);
router.use((req, res, next) => tenant(req) ? next() : res.status(403).json({ error: 'tenant-bound identity required' }));

router.post('/clients', requireRole('admin', 'nurse'), async (req, res, next) => {
  const key = String(req.get('Idempotency-Key') || '').trim();
  if (!key) return res.status(400).json({ error: 'Idempotency-Key header required' });
  let enrollment;
  try { enrollment = validateEnrollment(req.body); } catch (error) { return next(error); }
  try {
    const result = await pool.query(
      `INSERT INTO care_clients (tenant_id, idempotency_key, client_reference, guardian_reference, consent, emergency_contact_reference, created_by)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7) ON CONFLICT (tenant_id,idempotency_key)
       DO UPDATE SET last_seen_at=NOW() RETURNING id, client_reference, guardian_reference, consent, status, created_at`,
      [tenant(req), key, enrollment.client_reference, enrollment.guardian_reference, JSON.stringify(enrollment), enrollment.emergency_contact_reference, actor(req)]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
});

router.get('/clients/:id', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM care_clients WHERE id=$1 AND tenant_id=$2', [req.params.id, tenant(req)]);
    if (!result.rows[0]) return res.status(404).json({ error: 'client not found' });
    if (!['admin', 'nurse'].includes(req.user.role)) {
      const assignment = await pool.query(
        'SELECT 1 FROM care_client_assignments WHERE tenant_id=$1 AND client_id=$2 AND user_id=$3 AND active=true',
        [tenant(req), req.params.id, actor(req)]
      );
      if (!assignment.rows[0]) return res.status(403).json({ error: 'active client assignment required' });
    }
    if (req.user.role === 'family') return res.json(familySafeSummary(result.rows[0]));
    if (!['admin', 'nurse', 'caregiver'].includes(req.user.role)) return res.status(403).json({ error: 'insufficient role' });
    res.json(result.rows[0]);
  } catch (error) { next(error); }
});

router.post('/clients/:id/assignments', requireRole('admin', 'nurse'), async (req, res, next) => {
  if (!req.body.user_id || !['nurse','caregiver','family','guardian'].includes(req.body.relationship)) {
    return res.status(400).json({ error: 'user_id and valid relationship required' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO care_client_assignments (tenant_id,client_id,user_id,relationship,assigned_by)
       SELECT $1,id,$2,$3,$4 FROM care_clients WHERE id=$5 AND tenant_id=$1
       ON CONFLICT (tenant_id,client_id,user_id) DO UPDATE SET relationship=EXCLUDED.relationship,active=true RETURNING *`,
      [tenant(req), String(req.body.user_id), req.body.relationship, actor(req), req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'client not found' });
    res.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
});

router.post('/plans', requireRole('admin', 'nurse'), async (req, res, next) => {
  const key = String(req.get('Idempotency-Key') || '').trim();
  const clientId = Number(req.body.client_id);
  if (!key || !Number.isInteger(clientId) || !req.body.assessment || !req.body.interventions) {
    return res.status(400).json({ error: 'Idempotency-Key, client_id, assessment and interventions required' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO governed_care_plans (tenant_id,idempotency_key,client_id,assessment,interventions,prepared_by)
       SELECT $1,$2,id,$3::jsonb,$4::jsonb,$5 FROM care_clients WHERE id=$6 AND tenant_id=$1
       ON CONFLICT (tenant_id,idempotency_key) DO UPDATE SET updated_at=governed_care_plans.updated_at RETURNING *`,
      [tenant(req), key, JSON.stringify(req.body.assessment), JSON.stringify(req.body.interventions), actor(req), clientId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'client not found' });
    res.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
});

router.post('/plans/:id/transition', requireRole('admin', 'nurse'), async (req, res, next) => {
  const expectedVersion = Number(req.body.version);
  if (!Number.isInteger(expectedVersion) || !req.body.reason) return res.status(400).json({ error: 'version and reason required' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const found = await client.query('SELECT * FROM governed_care_plans WHERE id=$1 AND tenant_id=$2 FOR UPDATE', [req.params.id, tenant(req)]);
    if (!found.rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'plan not found' }); }
    assertPlanTransition(found.rows[0].status, req.body.status);
    if (found.rows[0].version !== expectedVersion) { await client.query('ROLLBACK'); return res.status(409).json({ error: 'version conflict' }); }
    const updated = await client.query(
      `UPDATE governed_care_plans SET status=$1,version=version+1,approved_by=CASE WHEN $1='active' THEN $2 ELSE approved_by END,updated_at=NOW()
       WHERE id=$3 AND tenant_id=$4 AND version=$5 RETURNING *`,
      [req.body.status, actor(req), req.params.id, tenant(req), expectedVersion]
    );
    await client.query(`INSERT INTO care_audit_events (tenant_id,actor_id,subject_type,subject_id,event_type,details) VALUES ($1,$2,'care_plan',$3,'status_changed',$4::jsonb)`, [tenant(req), actor(req), req.params.id, JSON.stringify({ to: req.body.status, reason: req.body.reason })]);
    await client.query('COMMIT');
    res.json(updated.rows[0]);
  } catch (error) { await client.query('ROLLBACK'); next(error); } finally { client.release(); }
});

router.post('/incidents', requireRole('admin', 'nurse', 'caregiver'), async (req, res, next) => {
  const key = String(req.get('Idempotency-Key') || '').trim();
  if (!key) return res.status(400).json({ error: 'Idempotency-Key header required' });
  let incident;
  try { incident = validateIncident(req.body); } catch (error) { return next(error); }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const created = await client.query(
      `INSERT INTO governed_care_incidents (tenant_id,idempotency_key,client_id,severity,category,observed_facts,immediate_actions,occurred_at,reported_by,dispatch_status)
       SELECT $1,$2,id,$3,$4,$5,$6,$7::timestamptz,$8,$9 FROM care_clients WHERE id=$10 AND tenant_id=$1
       ON CONFLICT (tenant_id,idempotency_key) DO UPDATE SET updated_at=governed_care_incidents.updated_at RETURNING *`,
      [tenant(req), key, incident.severity, incident.category, incident.observed_facts, incident.immediate_actions, incident.occurred_at, actor(req), incident.requires_manual_dispatch ? 'manual_dispatch_required' : 'not_required', incident.client_id]
    );
    if (!created.rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'client not found' }); }
    if (incident.requires_manual_dispatch) {
      await client.query(`INSERT INTO care_dispatch_outbox (tenant_id,incident_id,status,payload) VALUES ($1,$2,'pending_manual_dispatch',$3::jsonb) ON CONFLICT (incident_id) DO NOTHING`, [tenant(req), created.rows[0].id, JSON.stringify({ severity: incident.severity })]);
    }
    await client.query(`INSERT INTO care_audit_events (tenant_id,actor_id,subject_type,subject_id,event_type,details) VALUES ($1,$2,'incident',$3,'reported',$4::jsonb)`, [tenant(req), actor(req), created.rows[0].id, JSON.stringify({ severity: incident.severity })]);
    await client.query('COMMIT');
    res.status(201).json({ ...created.rows[0], emergency_services_contacted: false });
  } catch (error) { await client.query('ROLLBACK'); next(error); } finally { client.release(); }
});

router.use((error, req, res, next) => error instanceof CareWorkflowError ? res.status(422).json({ error: error.message, code: error.code }) : next(error));
module.exports = router;
