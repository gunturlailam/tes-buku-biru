# Product & Technical Decisions Log

Record decisions here or in an ADR. Do not silently change approved decisions.

| ID | Decision | Initial position | Status |
|---|---|---|---|
| D-001 | Repository | One GitHub repository with backend and frontend folders | Agreed per team context |
| D-002 | Backend as source of truth | All financial calculations in backend | Proposed baseline |
| D-003 | Database | PostgreSQL if already selected/available | Verify current repo |
| D-004 | Frontend scope | One shared frontend application, two feature owners | Proposed baseline |
| D-005 | Mobile | Not assumed in current MVP; decide after web/API foundation | Open |
| D-006 | Currency | IDR default for MVP | Proposed |
| D-007 | Forecast priority | Cash flow before profit forecast | Proposed |
| D-008 | Risk model | Independent configurable signals, no composite score at MVP | Proposed |
| D-009 | LLM | Explanation only, never financial arithmetic | Proposed |

## Open questions
- What exact framework and version are in `backend/` and `frontend/`?
- Is authentication already implemented?
- Is PostgreSQL already configured?
- Is the app intended for one business per user or multiple organizations?
- Is cash basis, accrual basis, or both in MVP?
- Does hackathon brief require mobile, specific AI provider, or particular judging criteria?

Update status to `Approved` only after team discussion.
