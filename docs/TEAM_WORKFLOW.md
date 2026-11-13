# Team Workflow & Ownership — ProfitAI

## 1. Team

| Person | Primary role | Accountable area |
|---|---|---|
| Risfiatul | Lead / Product / AI-ML | Product decisions, scope, methodology, AI/forecast validation |
| Guntur | Backend | API, database, auth, domain services, financial engine |
| Ronal | UI/UX Frontend | Design system, app shell, dashboard, transaction UX |
| Hanif | UI/UX Frontend | Reports, insight/recommendation UX, frontend integration and responsive QA |

The two frontend members work in the same frontend application. The split is by feature ownership, not separate competing implementations. Confirm exact existing framework and folders before dividing files.

## 2. Decision rights

- Risfiatul: final product scope, priority, methodology acceptance, release decision.
- Guntur: backend implementation and database technical proposal; changes to domain/API contracts reviewed with Lead and frontend.
- Ronal: design system and shared layout ownership.
- Hanif: reports/insights feature UX ownership and frontend integration in assigned modules.
- Security/financial methodology changes require review, not unilateral implementation.

## 3. Avoiding collisions

- One issue = one owner.
- One shared file = one active editor at a time.
- Shared components/tokens are owned by Ronal; propose changes via PR.
- Frontend feature modules are assigned explicitly in issues.
- API schema is proposed by Guntur and reviewed by frontend owners before merge.
- Formula/risk/forecast definitions are owned by Risfiatul; implementation can be delegated but cannot redefine semantics.
- Use feature branches and PRs; no direct pushes to main.

## 4. Weekly cadence

- Planning: choose small issues and owners.
- Daily async update: yesterday / today / blocker.
- Integration checkpoint: verify backend contract and frontend wiring.
- Review: demo completed work and tests.
- Retrospective: identify overlap, blockers, and process changes.

## 5. Definition of ready

Issue has goal, acceptance criteria, owner, dependencies, files/area, test plan, and design/API reference.

## 6. Definition of done

Acceptance criteria met, tests pass, docs updated, PR reviewed, CI green, and known limitations disclosed.

## 7. Escalation

If scope or formula is unclear, pause affected implementation and ask Risfiatul. If API schema is unclear, Guntur proposes a contract and frontend owners review. If shared UI ownership conflicts, Ronal coordinates with Hanif before editing.
