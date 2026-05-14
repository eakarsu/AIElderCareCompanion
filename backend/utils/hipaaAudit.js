/**
 * HIPAA-compliant audit logging for PHI access.
 * Records who accessed what (entity_type/entity_id), when, from where (ip),
 * and what action they performed. All read/write/AI operations on patient data
 * should be logged.
 */
const pool = require('../db');

let tableEnsured = false;

async function ensureTable() {
  if (tableEnsured) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hipaa_audit_log (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      user_email VARCHAR(255),
      user_role VARCHAR(50),
      action VARCHAR(50) NOT NULL,
      entity_type VARCHAR(100),
      entity_id VARCHAR(100),
      patient_identifier VARCHAR(255),
      ip_address VARCHAR(64),
      user_agent VARCHAR(500),
      phi_redacted BOOLEAN DEFAULT TRUE,
      details JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await pool.query('CREATE INDEX IF NOT EXISTS idx_hipaa_user ON hipaa_audit_log(user_id);');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_hipaa_entity ON hipaa_audit_log(entity_type, entity_id);');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_hipaa_patient ON hipaa_audit_log(patient_identifier);');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_hipaa_created ON hipaa_audit_log(created_at);');
  tableEnsured = true;
}

/**
 * Log a single audit entry. Best-effort: never throws so app flow continues.
 */
async function logPHIAccess({
  req,
  action,
  entityType,
  entityId,
  patientIdentifier,
  phiRedacted = true,
  details
}) {
  try {
    await ensureTable();
    const user = req?.user || {};
    await pool.query(
      `INSERT INTO hipaa_audit_log
       (user_id, user_email, user_role, action, entity_type, entity_id, patient_identifier,
        ip_address, user_agent, phi_redacted, details)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        user.id || user.userId || null,
        user.email || null,
        user.role || null,
        action,
        entityType || null,
        entityId != null ? String(entityId) : null,
        patientIdentifier || null,
        (req?.ip || req?.headers?.['x-forwarded-for'] || '').toString().slice(0, 64),
        (req?.headers?.['user-agent'] || '').slice(0, 500),
        phiRedacted,
        details ? JSON.stringify(details) : null
      ]
    );
  } catch (err) {
    console.error('hipaaAudit.logPHIAccess error:', err.message);
  }
}

/**
 * Express middleware factory: logs every read/write to a PHI route.
 * Usage: router.use(auditPHI('medication'))
 */
function auditPHI(entityType) {
  return (req, res, next) => {
    const action = (req.method || 'GET').toUpperCase();
    res.on('finish', () => {
      logPHIAccess({
        req,
        action,
        entityType,
        entityId: req.params?.id,
        patientIdentifier: req.body?.patient_name || req.body?.patient_id || req.query?.patient,
        phiRedacted: false,
        details: { path: req.originalUrl, status: res.statusCode }
      }).catch(() => {});
    });
    next();
  };
}

module.exports = { logPHIAccess, auditPHI, ensureTable };
