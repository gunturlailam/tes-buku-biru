# Task Ownership — Hanif (UI/UX Frontend: Reports, Insights, Recommendations)

## Mission
Deliver understandable report and insight experiences using the shared frontend system and backend API.

## Primary ownership
- Report and financial detail UX.
- Risk signal, forecast, and recommendation feature interfaces.
- Frontend integration/quality for assigned modules.
- Responsive and interaction QA across the application.

## Phase 0 tasks
- [ ] Audit current frontend and understand framework/routes.
- [ ] Read PRD, methodology, API contract and UI guidelines.
- [ ] Coordinate route/component boundaries with Ronal.
- [ ] Review proposed user flows for reports and insights.
- [ ] Agree shared API client and types; do not create a competing client.

## Phase 1 tasks
- [ ] Design report screens and metric detail/explanation patterns.
- [ ] Design risk signal states: normal, attention, critical, insufficient.
- [ ] Define forecast presentation states: unavailable, evaluating, available, warning.
- [ ] Define recommendation cards with trigger, evidence, action, assumption, limitation.
- [ ] Use shared components/tokens owned by Ronal.

## Phase 2+
- [ ] Integrate profit/loss and cash movement report APIs.
- [ ] Integrate risk signal/recommendation endpoints when available.
- [ ] Integrate forecast only after backend release gate is approved.
- [ ] Add loading/empty/error/partial-data states and component tests.
- [ ] Test responsive layouts, keyboard navigation, and consistency.

## Must coordinate with
- Ronal for shared UI and app shell.
- Guntur for endpoint schemas and sample responses.
- Risfiatul for definitions, interpretation, and wording.

## Do not
- Recalculate financial metrics in frontend.
- Invent risk status or forecast values.
- Display forecast as certainty.
- Modify global components/styles without coordination.

## Deliverables
Reports, metric detail, insight/recommendation screens, responsive QA, frontend tests and integration notes.
