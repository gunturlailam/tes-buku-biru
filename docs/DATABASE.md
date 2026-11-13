# Database Design — ProfitAI

Logical starting point; adapt to actual ORM and repository schema. Do not create migrations until the team reviews entity relationships and tenant boundaries.

## Core entities

- `users`: identity.
- `organizations`: business workspace.
- `organization_members`: user membership and role.
- `business_profiles`: industry, currency, timezone, accounting basis, fiscal settings.
- `accounts`: chart-of-accounts entries.
- `categories`: user-facing transaction categories mapped to account/financial treatment.
- `transactions`: financial events.
- `transaction_reversals` or `reversal_of_id`: correction history.
- `import_batches`: upload metadata, status, source, hash.
- `import_rows`: row validation and duplicate status (retain only as needed).
- `opening_balances`: opening account balances by effective date.
- `financial_calculation_runs`: period, formula version, quality status.
- `risk_rule_versions`: configurable thresholds.
- `risk_signals`: triggered rule and evidence.
- `forecast_runs`: model version, training window, horizon, metrics.
- `recommendations`: rule, evidence, status, user feedback.
- `audit_events`: important actor/action/time metadata.

## Required constraints

- Organization-owned rows must have tenant scope.
- Foreign keys should prevent orphaned records.
- Amount precision appropriate for currency; use decimal numeric type.
- Index common query patterns such as `(organization_id, transaction_date)`.
- Use unique constraints/idempotency strategy for import rows where feasible.
- Use created/updated timestamps and actor IDs for audit-relevant changes.
- Avoid hard delete of posted financial transactions; use reversal/void.
- Store formula/rule/model versions with derived outputs.

## Important classification

A transaction type alone may not be enough for complete accounting. Account mapping and debit/credit treatment may be required for accrual reporting. Do not claim a full double-entry ledger unless implemented and tested as such.

## Migration policy

- One migration per coherent schema change.
- Never edit a migration already applied to shared environments; create a corrective migration.
- Review generated SQL.
- Test upgrade path from a clean database and, where relevant, existing seeded data.
- Back up before production migration.
