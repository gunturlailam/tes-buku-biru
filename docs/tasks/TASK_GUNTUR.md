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

- [x] Audit existing backend framework, versions, folders, dependencies and run commands.
- [x] Document current state; do not replace working stack without approval.
- [x] Ensure local environment and database setup works.
- [x] Propose database ERD and API contract.
- [x] Add `/health` endpoint and basic CI if absent (CI configured in `.github/workflows/backend-ci.yml`).

## Phase 1 tasks

- [x] Implement organization/member scope (Server-side resolved tenant isolation).
- [x] Implement transaction and category models.
- [x] Add migrations and seed categories (Alembic initialized and migrated to head).
- [x] Implement transaction CRUD, validation, reversal/audit (Create, Read, Update/PATCH, Reverse).
- [x] Add tenant isolation tests (`backend/tests/test_tenant_isolation.py` passing 100%).

## Phase 2 tasks

- [x] Implement financial aggregation and formulas from METHODOLOGY.md (`/summary`, `/profit-loss`, `/cash-flow`).
- [x] Use Decimal and consistent rounding (`Decimal` arithmetic with `ROUND_HALF_UP`).
- [x] Implement data-quality metadata and unavailable reasons (`status`, `warnings`, `reason`).
- [x] Add unit tests and independent fixtures (`backend/tests/test_financial_engine.py` passing 100%).
- [x] Publish OpenAPI and example responses (FastAPI OpenAPI docs live at `/docs`).

## Phase 3+

- [x] Implement import preview/confirm and duplicate guard (`/api/v1/imports/transactions/preview` & `/confirm`).
- [x] Implement configurable risk rules and evidence (`/api/v1/financial/health` with signals).
- [x] Implement recommendation API (`/api/v1/recommendations` rule-based with evidence).
- [x] Add logs/monitoring without sensitive payload leakage (Request-ID headers & safe error envelopes).
- [x] Implement baseline forecast/backtest interfaces when approved (Phase 5 / P2).
- [x] Implement optional LLM adapter only after privacy review (Phase 5 / P2).

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
