# Operations

1. Run `scripts/bootstrap.sh`, replace every placeholder in `.env`, then run `scripts/migrate.sh`.
2. Run `./start.sh`; it does not install, migrate, seed, start PostgreSQL, or terminate unrelated processes.
3. Demo data is destructive and opt-in: `CONFIRM_DEMO_SEED=yes scripts/seed-demo.sh` outside production only.

Use `/api/care-operations` for consented enrollments, assignments, plans, and incidents. High/critical incidents create a manual-dispatch queue; they never claim emergency services were contacted. Production use requires qualified caregiver procedures, accessibility testing, health-system agreements, device validation, messaging/billing adapters, and safeguarding review.
