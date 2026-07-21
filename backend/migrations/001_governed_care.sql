BEGIN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id TEXT;
CREATE TABLE IF NOT EXISTS care_clients (
  id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, idempotency_key TEXT NOT NULL,
  client_reference TEXT NOT NULL, guardian_reference TEXT, consent JSONB NOT NULL,
  emergency_contact_reference TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','discharged')),
  approved_summary TEXT, next_visit_at TIMESTAMPTZ, created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(tenant_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS governed_care_plans (
  id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, idempotency_key TEXT NOT NULL,
  client_id BIGINT NOT NULL REFERENCES care_clients(id), assessment JSONB NOT NULL, interventions JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','paused','completed')), version INTEGER NOT NULL DEFAULT 1,
  prepared_by TEXT NOT NULL, approved_by TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS governed_care_incidents (
  id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, idempotency_key TEXT NOT NULL, client_id BIGINT NOT NULL REFERENCES care_clients(id),
  severity TEXT NOT NULL CHECK(severity IN ('low','moderate','high','critical')), category TEXT NOT NULL,
  observed_facts TEXT NOT NULL, immediate_actions TEXT NOT NULL, occurred_at TIMESTAMPTZ NOT NULL, reported_by TEXT NOT NULL,
  dispatch_status TEXT NOT NULL CHECK(dispatch_status IN ('not_required','manual_dispatch_required','acknowledged','completed','failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(tenant_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS care_dispatch_outbox (
  id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, incident_id BIGINT NOT NULL UNIQUE REFERENCES governed_care_incidents(id),
  status TEXT NOT NULL, payload JSONB NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, last_error TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS care_client_assignments (
  id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, client_id BIGINT NOT NULL REFERENCES care_clients(id),
  user_id TEXT NOT NULL, relationship TEXT NOT NULL CHECK (relationship IN ('nurse','caregiver','family','guardian')),
  assigned_by TEXT NOT NULL, active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, client_id, user_id)
);
CREATE TABLE IF NOT EXISTS care_audit_events (
  id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, actor_id TEXT NOT NULL, subject_type TEXT NOT NULL, subject_id TEXT NOT NULL,
  event_type TEXT NOT NULL, details JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS care_client_tenant_idx ON care_clients(tenant_id,status);
CREATE INDEX IF NOT EXISTS care_incident_queue_idx ON governed_care_incidents(tenant_id,dispatch_status,created_at);
COMMIT;
