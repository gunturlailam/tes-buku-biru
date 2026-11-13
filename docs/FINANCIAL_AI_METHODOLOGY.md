# Financial & AI Methodology — ProfitAI

**Status:** Baseline internal methodology; parameters require validation before production.

## 1. Non-negotiable rules

- Money arithmetic uses Decimal/fixed precision.
- Backend deterministic engine owns all financial calculations.
- Missing/zero denominator returns null + reason, never fabricated zero.
- Profit and cash flow are distinct.
- Transfer, loan principal, owner contribution/draw are not ordinary revenue/expense.
- Forecast is released only after time-series backtesting against baseline.
- AI explanation cannot alter numeric evidence.
- Insufficient data must be explicit.

## 2. Accounting context

For eligible Indonesian micro, small, and medium entities, SAK Indonesia untuk EMKM may be a relevant reporting framework. Eligibility and compliance must be assessed; a ProfitAI template alone does not establish compliance. The minimum financial statements under SAK EMKM include statement of financial position, income statement, and notes to financial statements. Business entity separation is important. The product must state whether information is cash or accrual basis and must not label reports compliant without appropriate review.

Official references for the team to verify at implementation:
- IAI — SAK EMKM: https://web.iaiglobal.or.id/SAK-IAI/Tentang%20SAK%20EMKM
- IAI publications: https://web.iaiglobal.or.id/

## 3. Metric definitions

Let:
- `gross_sales`: gross sales before returns/discounts.
- `sales_returns`: sales returns.
- `sales_discounts`: sales discounts.
- `net_revenue = gross_sales - sales_returns - sales_discounts`.
- `cogs`: cost of goods sold.
- `gross_profit = net_revenue - cogs`.
- `operating_profit = gross_profit - operating_expenses`.
- `net_profit = operating_profit + other_income - finance_cost - tax_expense` (account mapping must prevent double counting).

Ratios:
- `gross_margin = gross_profit / net_revenue * 100`
- `operating_margin = operating_profit / net_revenue * 100`
- `net_margin = net_profit / net_revenue * 100`
- `revenue_growth = (current_revenue - prior_revenue) / abs(prior_revenue) * 100`, only if prior revenue is non-zero and periods comparable.
- `current_ratio = current_assets / current_liabilities`
- `debt_to_asset = total_liabilities / total_assets * 100`
- `working_capital = current_assets - current_liabilities`
- `receivable_days = average_trade_receivables / credit_sales * period_days`, only if opening/closing receivables and credit sales are available.
- `average_inventory = (opening_inventory + closing_inventory) / 2`
- `inventory_turnover = cogs / average_inventory`
- `inventory_days = period_days / inventory_turnover`
- `cash_runway_days = available_cash / average_daily_net_cash_burn`, only if net cash burn is positive and observation period is adequate.

Rules:
- If denominator is zero/missing, return unavailable.
- If prior-period revenue is zero, show nominal change and "comparison base is zero", not infinite growth.
- If opening/closing balances are missing, do not pretend an average balance is known.
- Inventory ratios are not applicable to service businesses without inventory.
- Cash flow must be derived from cash movements, not net profit.

## 4. Cash-flow presentation

Separate operating, investing, and financing cash flows when classifications are available. If only transaction cash movements are recorded, label the result "cash movement summary based on recorded transactions", not a complete formal cash flow statement.

## 5. Data quality

Store period coverage, missing days, uncategorized count, duplicate warnings, opening/closing balances, reconciliation status, source, and import batch. Suggested states:
- `insufficient`
- `partial`
- `usable`
- `verified`

`verified` requires an actual review/reconciliation process. Upload success alone is not verification.

## 6. Risk signals

Do not create a universal health score at MVP. Use independent signals and show their triggers.

Initial configurable alert candidates (not universal standards):
- cash runway < 30 days: attention; < 14 days: critical;
- net cash flow negative one period: attention; two comparable periods: critical;
- revenue decline >10% vs comparable period: attention; >20% for two periods: critical;
- net margin falls 5 percentage points from own baseline: attention; negative for two periods: critical;
- receivable days >1.25× own historical median: attention; >1.5×: critical;
- current ratio <1.2: attention; <1.0: critical, only with complete current account data;
- debt/assets >60%: attention; >75%: critical, only with relevant balance data.

These are engineering starting points for alerts, not accounting standards, lending criteria, or universal business-health cutoffs. Validate by industry, company size, seasonality, and historical data before production. If data is insufficient, status is `insufficient`, not `normal`.

## 7. Forecasting

MVP target priority:
1. weekly/monthly cash balance and cash flow;
2. revenue if transaction history supports it;
3. profit only after accrual/COGS/expense data is sufficiently complete.

Baselines:
- naive last-period;
- seasonal naive when seasonality is supported;
- moving average;
- ETS/exponential smoothing candidate;
- ML only after adequate history/features and evidence of improvement.

Initial engineering guardrails, not guarantees:
- <8 complete points: no numeric forecast;
- 8–11 points: simple baseline only, low confidence;
- 12–23 points: compare simple/seasonal baseline if seasonality is meaningful;
- 24+ monthly points: evaluate seasonal candidates, but release still requires backtest.
A minimum point count does not prove model quality. Forecast horizon defaults to no more than three periods for MVP.

Use rolling-origin/walk-forward validation; never random shuffle time-series splits. Prevent leakage. Evaluate:
- MAE in currency units;
- WAPE when total actual is non-zero;
- sMAPE with near-zero caveat;
- Bias (forecast minus actual);
- MASE when valid.

Model release gate:
- compared with baseline on same folds/horizon;
- materially improves chosen primary metric;
- bias acceptable and stable;
- representative test window and adequate observations;
- model/data/feature/training-window versions recorded;
- limitations and uncertainty disclosed.
If no improvement, keep baseline or disable forecast. Never claim a generic "95% accuracy" from one run.

## 8. Recommendation engine

Pipeline:
1. deterministic metrics;
2. data-quality and applicability checks;
3. versioned rule evaluation;
4. evidence assembly;
5. priority ranking;
6. optional LLM explanation;
7. output schema/evidence validation.

Each recommendation contains rule ID/version, title, priority, trigger metrics, period, evidence references, suggested actions, assumptions, limitations, confidence label definition, and status.

LLM prohibited from inventing metrics, causes, transactions, sources, guaranteed outcomes, or legal/tax certainty. If structured output fails validation, show safe rule-based wording.

## 9. Test requirements

Unit tests: denominator zero, negative/refund, partial period, prior zero, Decimal rounding, transfers, owner contributions/draws, loan principal, missing opening/closing balances.

Forecast tests: walk-forward split, baseline comparison, leakage, missing dates, zero actuals, outliers, bias, horizon-specific metrics, reproducibility.

Acceptance: every metric traceable to source/period/formula version; missing data explicit; no forecast if gate fails; recommendations traceable to rules.
