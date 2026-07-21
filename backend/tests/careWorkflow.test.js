const test = require('node:test');
const assert = require('node:assert/strict');
const { validateEnrollment, validateIncident, assertPlanTransition, canAccessClient, familySafeSummary } = require('../services/careWorkflow');

test('enrollment requires explicit scoped consent', () => {
  assert.throws(() => validateEnrollment({ consent_granted: false }), /consent/);
  const value = validateEnrollment({ client_reference:'C-1', consent_granted:true, consent_scopes:['scheduling'], consent_basis:'client', emergency_contact_reference:'EC-1' });
  assert.deepEqual(value.consent_scopes, ['scheduling']);
});
test('critical incidents always require manual dispatch and make no provider claim', () => {
  const value = validateIncident({ client_id:'1', occurred_at:'2026-07-18T10:00:00Z', severity:'critical', category:'fall', observed_facts:'Observed on floor', immediate_actions:'Stayed with client and called dispatcher' });
  assert.equal(value.requires_manual_dispatch, true);
  assert.equal(value.emergency_services_contacted, undefined);
});
test('plan transitions and tenant/assignment boundaries are enforced', () => {
  assert.doesNotThrow(() => assertPlanTransition('draft','active'));
  assert.throws(() => assertPlanTransition('draft','completed'));
  assert.equal(canAccessClient({ tenant_id:'a',role:'family',client_ids:[2] }, { tenant_id:'a',id:2 }, true), false);
  assert.deepEqual(Object.keys(familySafeSummary({ id:1,status:'active',approved_summary:'Stable',secret:'x' })).sort(), ['approved_summary','id','next_visit_at','status']);
});
