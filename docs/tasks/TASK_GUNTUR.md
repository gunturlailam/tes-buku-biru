# Task Ownership — Guntur (Backend)

## Mission
Build secure, testable backend and database services that are the single source of truth for ProfitAI.

## Primary ownership
- Backend architecture and API implementation.
- Database schema, migrations, repositories.
- Authentication/organization authorization and tenant isolation.
- Transaction CRUD/import.
- Deterministic financial engine.
- API documentation, backend tests, deployment configuration.

## Phase 0 tasks
- [ ] Audit existing backend framework, versions, folders, dependencies and run commands.
- [ ] Document current state; do not replace working stack without approval.
- [ ] Ensure local environment and database setup works.
- [ ] Propose database ERD and API contract.
- [ ] Add `/health` endpoint and basic CI if absent.

## Phase 1 tasks
- [ ] Implement organization/member scope.
- [ ] Implement transaction and category models.
- [ ] Add migrations and seed categories.
- [ ] Implement transaction CRUD, validation, reversal/audit.
- [ ] Add tenant isolation tests.

## Phase 2 tasks
- [ ] Implement financial aggregation and formulas from METHODOLOGY.md.
- [ ] Use Decimal and consistent rounding.
- [ ] Implement data-quality metadata and unavailable reasons.
- [ ] Add unit tests and independent fixtures.
- [ ] Publish OpenAPI and example responses.

## Phase 3+
- [ ] Implement import preview/confirm and duplicate guard.
- [ ] Implement configurable risk rules and evidence.
- [ ] Implement baseline forecast/backtest interfaces when approved.
- [ ] Implement recommendation API and optional LLM adapter only after privacy review.
- [ ] Add logs/monitoring without sensitive payload leakage.

## Must coordinate with
- Risfiatul for domain definitions/formulas/risk/forecast acceptance.
- Ronal and Hanif before changing API schemas.
- Frontend members for sample payloads and integration.

## Do not
- Put business formulas in route handlers or frontend.
- Trust client-supplied organization ID without authorization.
- Hard-delete posted financial transactions.
- Change schema without migration/review.
- Store secrets or real financial data in repo.

## Deliverables
Running backend, migrations, API docs, tests, example dataset, secure tenant-scoped endpoints.
