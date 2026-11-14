# API Contract — ProfitAI

This document defines conventions and proposed resource boundaries. Exact paths and schemas must be reconciled with the existing backend before implementation. OpenAPI generated from code is the executable contract.

## 1. Conventions

- Prefix: `/api/v1`
- JSON over HTTPS.
- Dates: ISO 8601 date (`YYYY-MM-DD`); timestamps with timezone.
- Currency: ISO 4217 code, MVP default `IDR`.
- Money: serialize as decimal string (e.g. `"125000.00"`), not binary float.
- Pagination: `limit`, `cursor` or `page` consistently.
- Every response includes request/correlation ID where practical.
- Authenticated organization context is resolved and authorized server-side.
- Errors use a consistent envelope.

## 2. Proposed endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Service health |
| POST | `/api/v1/auth/register` | Register a user and organization |
| POST | `/api/v1/auth/login` | Exchange email/password for a bearer token |
| GET | `/api/v1/me` | Current user |
| GET/POST | `/api/v1/organizations` | List/create organization |
| GET/PATCH | `/api/v1/organizations/{id}` | Organization profile |
| GET/POST | `/api/v1/transactions` | List/create |
| GET/PATCH | `/api/v1/transactions/{id}` | Read/update |
| POST | `/api/v1/transactions/{id}/reverse` | Reverse/void with audit |
| POST | `/api/v1/imports/transactions/preview` | Parse and validate upload |
| POST | `/api/v1/imports/{id}/confirm` | Confirm import |
| GET | `/api/v1/financial/summary` | KPI summary |
| GET | `/api/v1/financial/profit-loss` | Profit/loss summary |
| GET | `/api/v1/financial/cash-flow` | Cash movement summary |
| GET | `/api/v1/financial/health` | Health signals |
| POST | `/api/v1/forecasts/cash-flow` | Create/evaluate forecast |
| GET | `/api/v1/forecasts/{id}` | Forecast result |
| GET | `/api/v1/recommendations` | Recommendation list |

Do not implement all endpoints at once. P0 endpoints are health, auth/org, transaction CRUD, and financial summary.

Registration accepts `email`, `password` (minimum 8 characters), `full_name`,
`organization_name`, and optional `industry`. Login returns `access_token` and
`token_type`; send the token on protected requests as
`Authorization: Bearer <access_token>`.

## 3. Query parameters

Financial endpoints:
- `from`: inclusive start date.
- `to`: inclusive end date.
- `compare`: optional comparable prior period.
- `currency`: default IDR if supported.
- organization is derived from authorized context or validated membership, never trusted blindly.

## 4. Example metric response

```json
{
  "period": {"from": "2026-01-01", "to": "2026-01-31"},
  "currency": "IDR",
  "data_quality": {"status": "partial", "warnings": ["Opening inventory balance is missing"]},
  "formula_version": "1.0.0",
  "generated_at": "2026-02-01T03:00:00Z",
  "metrics": {
    "net_revenue": {"value": "12500000.00", "status": "available"},
    "net_profit": {"value": null, "status": "unavailable", "reason": "Expense classification incomplete"}
  }
}
```

## 5. Error envelope

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid fields.",
    "details": [{"field": "transaction_date", "reason": "Invalid date"}]
  },
  "request_id": "server-generated-id"
}
```

Never return stack traces, secrets, SQL, or sensitive internal details to clients.

## 6. Contract governance

- Backend owner proposes schema changes.
- Frontend owners review impact before merge.
- Breaking changes require versioning/migration plan.
- Update OpenAPI, typed frontend client/types, examples, and tests in the same PR or linked coordinated PRs.
