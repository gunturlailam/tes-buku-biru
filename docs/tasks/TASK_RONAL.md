# Task Ownership — Ronal (UI/UX Frontend: Design System, Shell, Dashboard, Transactions)

## Mission
Own the shared frontend foundation and deliver a clear, consistent core experience for entering and understanding financial data.

## Primary ownership
- UX foundation, design tokens, reusable components.
- Navigation, app shell, responsive layout.
- Dashboard and transaction feature UX.
- Frontend API integration patterns for assigned features.
- Accessibility and visual consistency.

## Phase 0 tasks
- [ ] Audit existing frontend framework, versions, routes, styling, components and run commands.
- [ ] Coordinate with Hanif before changing shared config or global styles.
- [ ] Propose sitemap and core user flows.
- [ ] Define shared design tokens, typography, spacing, colors, chart conventions.
- [ ] Agree API client/error/loading patterns with Guntur.

## Phase 1 tasks
- [ ] Build/clean app shell and navigation.
- [ ] Build shared form, table, modal, status, empty/error components.
- [ ] Build transaction list, filter, create/edit form UX.
- [ ] Integrate transaction APIs after contract is agreed.
- [ ] Handle validation, loading, empty, error, and success states.

## Phase 2 tasks
- [ ] Build dashboard KPI cards and trends from backend response.
- [ ] Show period, currency, data quality, warnings, and definitions.
- [ ] Ensure frontend does not calculate financial metrics itself.
- [ ] Add component tests for critical states.

## Must coordinate with
- Hanif: shared components, global styles, routing and feature boundaries.
- Guntur: API contract and integration.
- Risfiatul: metric definitions and copy/terminology.

## Do not
- Change backend formula semantics.
- Create parallel design systems.
- Hardcode financial data in production UI.
- Edit Hanif-owned feature modules without coordination.

## Deliverables
Frontend shell, design system, transaction experience, dashboard, responsive behavior, screenshots and UI tests.
