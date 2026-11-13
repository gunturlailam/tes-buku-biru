# Architecture — ProfitAI

## 1. Architectural decision

Gunakan satu backend sebagai sumber kebenaran untuk transaksi, perhitungan, risk signals, forecast, dan rekomendasi. Frontend mengakses backend melalui API yang terdokumentasi. Jangan mengimplementasikan ulang business rules di browser.

Stack final mengikuti teknologi yang sudah ada di repository. Jika belum dikunci, kandidat yang direkomendasikan:
- Backend: Python + FastAPI.
- Database: PostgreSQL.
- Web frontend: Next.js/React.
- API contract: REST + OpenAPI.
- Migrations: tool yang sesuai framework (mis. Alembic jika SQLAlchemy dipakai).
- Tests: framework native stack.

Ini rekomendasi, bukan izin untuk mengganti stack yang sudah berjalan.

## 2. Logical architecture

```text
Web Frontend
   |
   | HTTPS / JSON / REST
   v
API Layer
   |
   +-- Auth & Organization
   +-- Transaction Module
   +-- Import Module
   +-- Reporting Module
   +-- Financial Engine
   +-- Risk Signal Engine
   +-- Forecast Service
   +-- Recommendation Service
   |
   v
Domain / Application Services
   |
   v
PostgreSQL
```

External LLM provider, bila digunakan, dipanggil dari backend melalui adapter. Jangan panggil provider langsung dari frontend.

## 3. Backend module boundaries

- `auth`: identity, sessions/token, authorization.
- `organizations`: organization, membership, role.
- `transactions`: CRUD, classification, audit/reversal.
- `imports`: upload, preview, mapping, validation, deduplication.
- `accounts`: chart of accounts and category mapping.
- `financial_engine`: deterministic formulas and aggregation.
- `reports`: response composition and exports.
- `risk`: configurable rules and signals.
- `forecasting`: data preparation, baseline, backtest, model registry.
- `recommendations`: rules, evidence, prioritization.
- `ai`: LLM adapter, prompt templates, schema validation, safety filters.

Modules should depend on domain interfaces, not import each other's internal implementation arbitrarily.

## 4. Frontend boundaries

Frontend responsibilities:
- navigation, forms, filters, visualizations;
- API client and typed response handling;
- loading/empty/error/partial states;
- display source, period, currency, warnings;
- accessibility and responsive layout.

Frontend must not:
- calculate profit/margin/risk/forecast;
- store secrets;
- decide tenant authorization;
- infer missing financial values.

## 5. Data flow

1. User submits transaction.
2. API authenticates user and resolves authorized organization server-side.
3. Service validates payload and business rules.
4. Repository persists transaction and audit metadata.
5. Financial engine aggregates posted, eligible records for requested period.
6. API returns metrics with metadata and warnings.
7. Frontend renders response.
8. Recommendation service consumes validated metrics/evidence.
9. LLM, if enabled, receives only minimum necessary structured evidence.

## 6. Multi-tenancy

Every organization-owned table must carry organization scope or be reachable only through a verified scoped relation. All reads/writes are tenant-scoped. Add tests for cross-tenant access. Consider PostgreSQL Row-Level Security only if team can configure and test it correctly; it does not replace application authorization.

## 7. Reliability and consistency

- Use database transactions for multi-step writes.
- Use idempotency keys or duplicate detection for imports.
- Keep audit/reversal trail for financial corrections.
- Use pagination for transaction lists.
- Add indexes based on query patterns, not speculation.
- Define cache invalidation if dashboard aggregation is cached.
- Store formula/rule/model versions with generated analytics.

## 8. Suggested target layout

Adapt to actual repository; do not blindly move existing files.

```text
backend/
  app/
    api/v1/
    core/
    db/
    models/
    schemas/
    repositories/
    services/
      transactions/
      imports/
      financial_engine/
      risk/
      forecasting/
      recommendations/
      ai/
  migrations/
  tests/
frontend/
  src/
    app/
    components/
    features/
      auth/
      organization/
      transactions/
      dashboard/
      reports/
      risk/
      forecasts/
      recommendations/
    lib/
    types/
docs/
```

## 9. Observability

Log request IDs, actor/organization identifiers where appropriate, service errors, latency, and model version. Do not log full transaction descriptions, credentials, or sensitive financial payloads by default. Provide a way to trace an analytics response to its calculation run without exposing private data.
