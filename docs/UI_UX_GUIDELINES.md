# UI/UX Guidelines — ProfitAI

## Product experience

The interface should make financial information understandable to non-accountants without hiding uncertainty. Prefer clear Indonesian labels and explain technical terms inline.

## Core navigation (MVP)

- Dashboard
- Transaksi
- Laporan
- Insight & Rekomendasi
- Pengaturan Usaha

Forecast navigation may appear only when forecast feature is enabled and passes release gate.

## Dashboard hierarchy

1. Selected period and business context.
2. Data-quality banner and warnings.
3. KPI cards: revenue, expenses, profit (if valid), net cash flow.
4. Trend chart with clear units and period labels.
5. Health signals with trigger explanations.
6. Recommendations with action and evidence.

## Financial display rules

- Always show currency and date range.
- Use Indonesian number formatting consistently.
- Distinguish unavailable, zero, negative, and not applicable.
- Never use color as the only indicator; include text/icon.
- Explain gross profit vs net profit and profit vs cash.
- Show calculation/source details on demand.
- Label forecasts as estimates and show horizon/model context.

## UX states

Every data-driven page must handle:
- loading;
- no data / first-use empty state;
- validation error;
- server error and retry;
- partial/incomplete data;
- stale data if cached;
- success/confirmation.

## Forms

- Explicit labels and validation messages.
- Confirm destructive/reversal actions.
- Explain transaction type and category.
- Preserve entered data on recoverable errors.
- Avoid ambiguous field names such as "nominal" without income/expense context.

## Visual system

Create reusable tokens for spacing, typography, colors, borders, radius, shadows, and chart styles. Keep dashboard cards and table patterns consistent. Meet readable contrast and keyboard accessibility expectations.

## Chart rules

- Label axes, units, period, and legend.
- Do not truncate axes in a way that exaggerates changes without clear disclosure.
- Avoid 3D charts.
- Show no-data states rather than zero-filled fabricated data.
- Forecast actual vs predicted should be visually distinct and clearly labeled.
