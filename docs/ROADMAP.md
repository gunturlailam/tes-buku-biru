# Roadmap — ProfitAI

Roadmap is ordered by dependency, not calendar promise. Estimate duration only after repository audit.

## Phase 0 — Repository audit & agreement
- inspect existing backend/frontend structure and stack;
- agree MVP and data model;
- install/run project locally;
- agree API contract and GitHub protections.

Exit: all four can run the project; one sample API request works.

## Phase 1 — Transaction foundation (P0)
- organization/auth baseline;
- transaction model and CRUD;
- categories and filters;
- validation and audit/reversal behavior.

Exit: end-to-end transaction flow works and tenant tests pass.

## Phase 2 — Financial engine (P0)
- revenue/expense/cash movement aggregation;
- profit and margin where inputs support them;
- test fixtures and API responses;
- quality/warning metadata.

Exit: independent fixture calculations match.

## Phase 3 — Dashboard and reporting (P0/P1)
- KPI cards, trends, transactions summary;
- report definitions and partial-data states;
- responsive QA.

Exit: dashboard accurately reflects API and explains metrics.

## Phase 4 — Risk signals and recommendations (P1)
- configurable rules;
- evidence-backed recommendations;
- feedback/status tracking.

Exit: every signal traces to data and rule version.

## Phase 5 — Forecast and AI explanation (P2)
- baseline forecast;
- walk-forward evaluation;
- model release gate;
- optional LLM explanation.

Exit: model beats baseline on agreed test set or forecast remains disabled.

## Phase 6 — Hardening/demo
- security review;
- performance checks;
- demo dataset;
- setup guide and demo script;
- known limitations.
