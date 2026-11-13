# Testing & QA Strategy — ProfitAI

## Test pyramid

1. Unit tests: domain calculations, validation, rule evaluation.
2. Integration tests: API + database + auth + tenant boundaries.
3. Component tests: frontend forms, tables, KPI rendering, error states.
4. End-to-end tests: critical user journeys.

## Required financial fixtures

Create small hand-calculated datasets covering:
- revenue, returns, discounts;
- COGS and operating expenses;
- positive/negative profit;
- zero revenue;
- prior-period revenue zero;
- internal transfer;
- loan receipt/repayment;
- owner contribution/draw;
- refund;
- partial period;
- missing opening/closing balances;
- service business with no inventory.

Expected values must be calculated independently and reviewed.

## Forecast QA

- Walk-forward splits only.
- Compare against naive baseline.
- Track MAE/WAPE/Bias by horizon.
- Test zero actuals, missing dates, outliers, seasonality, and leakage.
- Keep a reproducible test dataset and model/version metadata.
- Forecast should be suppressed when release gates fail.

## Security QA

- Cross-tenant authorization tests.
- Role/permission tests.
- Input validation.
- Upload abuse cases.
- Secret scanning and dependency review.

## Release checklist

- CI green.
- Migrations tested.
- Core calculations match fixtures.
- API contract updated.
- Frontend loading/empty/error/partial states checked.
- No sensitive demo data.
- README setup instructions tested by another teammate.
- Known limitations documented.
