# Product & Technical Decisions Log

Record decisions here or in an ADR. Do not silently change approved decisions.

| ID | Decision | Final Decision | Status | Date |
|---|---|---|---|---|
| D-001 | Repository | One GitHub repository with backend and frontend folders | ✅ Agreed | 2024-11-14 |
| D-002 | Backend as source of truth | Python/FastAPI owns all financial calculations | ✅ Approved by Risfiatul | 2024-11-14 |
| D-003 | Database | PostgreSQL 16 | ✅ Approved by Risfiatul | 2024-11-14 |
| D-004 | Frontend scope | Next.js - One app, Ronal (design system/dashboard), Hanif (reports/insights) | ✅ Approved by Risfiatul | 2024-11-14 |
| D-005 | Mobile | Phase 2 (not in MVP) - Web-first | ✅ Approved by Risfiatul | 2024-11-14 |
| D-006 | Currency | IDR only for MVP | ✅ Approved by Risfiatul | 2024-11-14 |
| D-007 | Forecast priority | Cash flow forecast first (more critical for UMKM survival) | ✅ Approved by Risfiatul | 2024-11-14 |
| D-008 | Risk model | Independent signals with evidence (no composite score) | ✅ Approved by Risfiatul | 2024-11-14 |
| D-009 | LLM | Contextual explanation + storytelling + synthesis, BUT never calculate numbers, strict validation, fallback required | ✅ Approved by Risfiatul | 2024-11-14 |
| D-010 | Tech Stack | Backend: FastAPI + SQLAlchemy + Alembic, Frontend: Next.js 14+ + TypeScript + Tailwind | ✅ Approved by Risfiatul | 2024-11-14 |

## Open questions (implementation details)
- [ ] FastAPI exact version? (Recommend: 0.104.0+)
- [ ] Next.js exact version? (Recommend: 14.0.0+)
- [ ] Authentication: JWT or session-based? (Recommend: JWT with httpOnly cookies)
- [ ] Multi-tenant: One user → multiple organizations? (Recommend: Yes via organization_members table)
- [ ] Accounting basis: Cash only or both? (Recommend: Cash for MVP, accrual in Phase 2)
- [ ] Hackathon deadline? (To be confirmed by Risfiatul)
- [ ] Hackathon judging criteria? (To be mapped by Risfiatul)
- [ ] LLM provider: Gemini, OpenAI, or both? (Recommend: Gemini primary with fallback)

## Status: Ready for Implementation ✅
All critical product decisions (D-001 to D-010) approved by Product Lead (Risfiatul) on 2024-11-14.

**Team can proceed with Phase 0 implementation.**
