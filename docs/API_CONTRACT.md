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

## 2. Endpoint inventory

This table mixes implemented and proposed endpoints. Ratio endpoints marked in
§4.1 are implemented; other endpoints remain proposals.

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
| GET | `/api/v1/balance-sheet` | Balance sheet as of a date |
| GET | `/api/v1/ratios` | Compute all CFO ratios for a period |
| GET | `/api/v1/ratios/thresholds` | Effective ratio thresholds |
| PATCH | `/api/v1/ratios/thresholds/{ratio_code}` | Override thresholds (owner/admin) |
| POST | `/api/v1/ratios/{ratio_code}/explain` | Optional LLM narrative with fallback |
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

Transaction list (`GET /api/v1/transactions`):
- `from`, `to` (required): inclusive date range.
- `limit` (default 50, max 200), `offset`.
- `tx_type`: filter by transaction type.
- `category_id`: filter by category.
- `search`: case-insensitive match on description.
- Reversal rows (`reversal_of_id != null`) are excluded from the list; the
  original transaction remains visible with `status = "reversed"` for audit.
- Update uses `PATCH`, not `PUT`. There is no hard `DELETE`; correction is done
  through `POST /api/v1/transactions/{id}/reverse`.

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

## 4.1 Ratio endpoints

Implemented in `backend/app/main.py` and `backend/app/ratio_service.py`.
Full behavior and ratio definitions: `docs/RATIO_CFO_SPEC.md` §5–§8.

- `GET /api/v1/ratios?from=&to=&as_of=`
  - `from`/`to` required; `as_of` optional (default `to`).
  - Returns 16 ratio results plus `period`, `as_of`, `currency`,
    `formula_version`, `data_quality`, `source`, and `snapshot_id`.
  - Upserts a `ratio_snapshots` row as an audit/cache side effect. Values are
    still recomputed from current data on every request.
  - Each ratio includes `code`, `name`, `category`, `value` (decimal string or
    `null`), `display`, `status` (`available`/`unavailable`), `quality`
    (`ok`/`partial`/`insufficient`), `reason` when unavailable, `threshold`
    (`target`, `warning`, `critical`, `direction`) or `null`, `band`, `unit`,
    and rule-based `narrative`.
  - `band` is one of `above_target`, `between_target_warning`,
    `between_warning_critical`, `below_critical`, `not_configured`,
    `insufficient`.
  - Formula version is `1.1.0`. `INV_TURN`, `TATO`, `ROA`, and `ROE` are
    annualized with `365 / days`.

- `GET /api/v1/balance-sheet?as_of=`
  - Returns the latest snapshot on/before `as_of`.
  - If none exists: HTTP `200` with `status: "unavailable"` and `reason`;
    it never fabricates zero balances.

- `GET /api/v1/ratios/thresholds`
  - Returns effective thresholds after organization/industry override.

- `PATCH /api/v1/ratios/thresholds/{ratio_code}`
  - Owner/admin only. Body: `target`, `warning`, `critical`, `direction`
    (`higher`/`lower`), all decimals.
  - Validation: `higher` → `critical <= warning <= target`;
    `lower` → `target <= warning <= critical`.
  - Percent values are stored as decimals (`0.30` = 30%).
  - Writes audit event `RATIO_THRESHOLD_UPDATED`.

- `POST /api/v1/ratios/{ratio_code}/explain?from=&to=&as_of=`
  - Calls an optional OpenAI-compatible LLM with only ratio code/name,
    category, band, direction, and data quality.
  - Returns `explanation`, `action`, `source` (`llm`/`fallback`),
    `llm_enabled`, optional `privacy_note`, and `disclaimer`.
  - LLM failure or invalid output always falls back with HTTP `200`.

### Example ratio response (abridged)

```json
{
  "period": {"from": "2026-10-01", "to": "2026-10-31"},
  "as_of": "2026-10-31",
  "currency": "IDR",
  "formula_version": "1.1.0",
  "snapshot_id": 1,
  "data_quality": {
    "status": "usable",
    "warnings": [
      "INV_TURN, TATO, ROA, dan ROE disetahunkan dari periode 31 hari; nilai periode pendek dapat fluktuatif."
    ]
  },
  "source": {
    "snapshot_id": 12,
    "as_of": "2026-10-31",
    "previous_snapshot_id": 11,
    "previous_as_of": "2026-09-30",
    "snapshot_status": "final",
    "transaction_count": 14,
    "warnings": []
  },
  "ratios": [
    {
      "code": "CR",
      "name": "Current Ratio",
      "category": "liquidity",
      "value": "4.7032",
      "display": "4.70x",
      "status": "available",
      "quality": "ok",
      "inputs": {"current_assets": "133100000.00", "current_liabilities": "28300000.00"},
      "threshold": {"target": "1.5000", "warning": "1.2000", "critical": "1.0000", "direction": "higher"},
      "band": "above_target",
      "interpretation": "Nilai rasio memenuhi target.",
      "unit": "x",
      "narrative": {
        "explanation": "Current ratio membandingkan aset lancar dengan utang lancar. Nilai saat ini di atas target.",
        "action": "Pertahankan buffer kas.",
        "source": "fallback",
        "llm_enabled": false,
        "quality": "ok",
        "disclaimer": "Narasi ini bersifat informatif, bukan saran keuangan."
      }
    }
  ]
}
```

`snapshot_id` at the top level is the upserted `ratio_snapshots` row.
`source.snapshot_id` is the `balance_snapshots` row used as input.

## 4.2 Missing inputs

If an input or denominator is missing, the ratio response uses
`status: "unavailable"`, `value: null`, and an explicit Indonesian `reason`.
Clients must not display a numeric value in that case. The frontend renders an
explanatory state instead.

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
