const INCIDENT_LEVELS = ['low', 'moderate', 'high', 'critical'];
const PLAN_TRANSITIONS = Object.freeze({ draft: ['active'], active: ['paused', 'completed'], paused: ['active', 'completed'], completed: [] });

class CareWorkflowError extends Error {
  constructor(message, code = 'INVALID_CARE_WORKFLOW') { super(message); this.code = code; }
}

const required = (value, name, max = 1000) => {
  const clean = String(value || '').trim();
  if (!clean) throw new CareWorkflowError(`${name} is required`);
  if (clean.length > max) throw new CareWorkflowError(`${name} is too long`);
  return clean;
};

function validateEnrollment(input) {
  if (input.consent_granted !== true) throw new CareWorkflowError('documented consent is required');
  if (!Array.isArray(input.consent_scopes) || input.consent_scopes.length === 0) throw new CareWorkflowError('at least one consent scope is required');
  return {
    client_reference: required(input.client_reference, 'client_reference', 120),
    guardian_reference: input.guardian_reference ? required(input.guardian_reference, 'guardian_reference', 120) : null,
    consent_scopes: [...new Set(input.consent_scopes.map((v) => required(v, 'consent_scope', 80)))],
    consent_basis: required(input.consent_basis, 'consent_basis', 200),
    consent_expires_at: input.consent_expires_at || null,
    accessibility_needs: Array.isArray(input.accessibility_needs) ? input.accessibility_needs.slice(0, 20) : [],
    emergency_contact_reference: required(input.emergency_contact_reference, 'emergency_contact_reference', 120),
  };
}

function validateIncident(input) {
  const severity = required(input.severity, 'severity', 20).toLowerCase();
  if (!INCIDENT_LEVELS.includes(severity)) throw new CareWorkflowError('unsupported incident severity');
  return {
    client_id: required(input.client_id, 'client_id', 80),
    occurred_at: required(input.occurred_at, 'occurred_at', 40),
    severity,
    category: required(input.category, 'category', 80),
    observed_facts: required(input.observed_facts, 'observed_facts', 4000),
    immediate_actions: required(input.immediate_actions, 'immediate_actions', 4000),
    requires_manual_dispatch: ['high', 'critical'].includes(severity),
  };
}

function assertPlanTransition(from, to) {
  if (!(PLAN_TRANSITIONS[from] || []).includes(to)) throw new CareWorkflowError(`plan transition ${from} -> ${to} is not allowed`);
}

function canAccessClient(user, client, write = false) {
  if (!user || String(user.tenant_id) !== String(client.tenant_id)) return false;
  if (user.role === 'admin' || user.role === 'nurse') return true;
  const assignments = Array.isArray(user.client_ids) ? user.client_ids.map(String) : [];
  if (!assignments.includes(String(client.id))) return false;
  return !(write && user.role === 'family');
}

function familySafeSummary(row) {
  return { id: row.id, status: row.status, next_visit_at: row.next_visit_at, approved_summary: row.approved_summary };
}

module.exports = { CareWorkflowError, validateEnrollment, validateIncident, assertPlanTransition, canAccessClient, familySafeSummary };
