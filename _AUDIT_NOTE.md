# Audit Notes — AIElderCareCompanion

Audit source: `_AUDIT/reports/batch_03.md` § 9 (substantive).

## Original audit recommendations

### Missing AI counterparts
- `/hospitalization-risk` — 30-day readmission risk.
- `/medication-cost-optimizer` — generic alternatives, assistance programs.
- `/caregiver-burden` — caregiver stress detection.
- `/nutrition-optimize` — swallow-safe recipes.

### Missing non-AI features
- Multi-user RBAC (patient / family / caregiver / doctor).
- Wearable vitals ingestion (Apple Watch, Oura).
- EHR integration (HL7 FHIR).
- Telehealth platform.

### Custom feature suggestions
- Real-time wearable streaming with thresholds.
- Voice-activated medication management.
- Agentic health coach (proactive outreach).
- Family video legacy messages.
- Pet care companion.
- Advance directive chatbot with state-specific guidance.
- Nursing-home transition handoff summary.

## Current state observed

37 routes, 11 AI endpoints already deployed (medication-analysis, fall-risk,
health-summary, social-recommendations, meal-plan, cognitive-exercises,
sleep-analysis, mood-insights, safety-evaluation, care-plan, chat). Mature
HIPAA-aware vertical.

## Implementations applied this pass

None — incremental AI additions on a HIPAA-touching surface should not be
mechanical. Each new endpoint requires PHI-handling review.

## Prioritized backlog

1. **MECHANICAL (with review)** — `/hospitalization-risk` reading
   `health_monitoring`, `medications`, `incident_reports` and returning a
   30-day readmission risk score.
2. **MECHANICAL (with review)** — `/caregiver-burden` reading
   `caregiver_notes` text + frequency, returning Zarit-style burden score.
3. **NEEDS-PRODUCT-DECISION** — RBAC overhaul (4+ roles) requires explicit
   policy mapping per route.
4. **NEEDS-CREDS** — Wearable + EHR + telehealth integrations require
   contracts (HealthKit, Oura, Epic / Cerner FHIR endpoints, Twilio Video).
5. **TOO-RISKY** — Voice-activated medication management without dual-confirm
   risks medication errors; needs careful UX design.

## Apply pass 3 (frontend)

- Verified: FE is comprehensively wired. `frontend/src/pages/AIAssistant.js` provides a unified AI Assistant page (cards + detail view) covering all 11 backend endpoints in `routes/ai.js`: medication-analysis, fall-risk-assessment, health-summary, social-recommendations, meal-plan, cognitive-exercises, sleep-analysis, mood-insights, safety-evaluation, care-plan, chat. Auth header `Bearer ${token}` from props/localStorage. Additional dedicated AI pages: `MedicationInteractionAlert.js`, `CaregiverChat.js`, `HipaaAuditLog.js`.
- The clinical AI extensions in backlog (`/hospitalization-risk`, `/caregiver-burden`) were not implemented in pass 2 (HIPAA review required), so there is nothing additional to surface in the FE at this time.
- Action: LEFT-AS-IS (idempotence rule).
- No files modified.

## Apply pass 4 (mechanical backlog)

Implemented 2 MECHANICAL backlog items as text-only LLM endpoints with PHI redaction, audit logging, and 503 gating on `OPENROUTER_API_KEY`:

- POST `/api/ai/hospitalization-risk` — pulls `health_monitoring`, `medications`, `incident_reports` for a patient and returns a structured 30-day readmission/admission risk score.
- POST `/api/ai/caregiver-burden` — pulls recent `caregiver_notes` (text + frequency) and returns a Zarit-style burden score with mitigation suggestions.

Files:
- New: `backend/routes/aiBacklog.js` (registered in `backend/server.js` under `/api/ai`).
- Modified: `frontend/src/pages/AIAssistant.js` — added 2 feature cards + default prompts. Existing JWT bearer auth, 503/error path, and `analysis` rendering already cover both endpoints.

Smoke test: `node --check` PASS on all touched files; sandbox-stub require of `aiBacklog.js` PASS. Live HTTP skipped — pre-existing `backend/node_modules` is missing `helmet` and the constraint disallows `npm install`.

Backlog still deferred: RBAC overhaul (NEEDS-PRODUCT-DECISION); HealthKit/Oura/Epic FHIR/Twilio (NEEDS-CREDS); voice-activated medication management (TOO-RISKY).

## Apply pass 5 (all backlog)

Implemented every remaining backlog item, category-aware. 6 features added.

- POST `/api/ai/nutrition-optimize` — MECHANICAL, IDDSI swallow-safe meal plan (PHI redacted).
- POST `/api/ai/medication-cost-optimizer` — MECHANICAL, generic alternatives + assistance programs (PHI redacted).
- POST `/api/ai/voice-meds-confirm/intent` + `/commit` — TOO-RISKY: dual-confirm with 60s token; commit logs confirmation but does NOT mutate medication state (`requires_nurse_review: true`).
- GET `/api/ai/wearable-vitals` — NEEDS-CREDS: Oura default + HealthKit relay; 503 + `missing: OURA_PERSONAL_TOKEN` (or HEALTHKIT_API_URL/TOKEN).
- GET `/api/ai/ehr-fhir/observations` — NEEDS-CREDS: Epic/Cerner FHIR R4; 503 + `missing: EHR_FHIR_URL,EHR_FHIR_TOKEN`.
- POST `/api/ai/telehealth-session` — NEEDS-CREDS: Twilio Programmable Video Rooms; 503 + `missing: TWILIO_ACCOUNT_SID,TWILIO_AUTH_TOKEN`.

RBAC overhaul left as PRODUCT-DECISION — existing `middleware/rbac.js` already provides `admin`/`nurse`/`caregiver`/`family` roles + `familyReadOnly`; a system-wide policy refactor is beyond the additive scope of pass 5.

Files:
- Modified: `backend/routes/aiBacklog.js` — appended 7 endpoints (3 LLM, 1 in-memory dual-confirm pair, 3 NEEDS-CREDS).
- Modified: `frontend/src/pages/AIAssistant.js` — 2 new feature cards (`nutrition-optimize`, `medication-cost-optimizer`) + default prompts. Other endpoints are admin-side and consumed via direct API.

Smoke test: `node --check` PASS on touched files. Sandbox-stub `require('./routes/aiBacklog')` PASS — exposes 9 routes. Live HTTP boot blocked by pre-existing missing `helmet` in `backend/node_modules`; constraint disallows `npm install`.
