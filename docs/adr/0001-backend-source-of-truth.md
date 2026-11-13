# ADR 0001 — Backend is the source of truth for financial calculations

- Status: Proposed
- Decision owner: Risfiatul + Guntur
- Context: Web and any future mobile client must show identical financial results.
- Decision: All financial formulas, risk rules, and forecast generation execute in backend domain services. Frontend renders returned values and metadata.
- Consequences: Backend tests are authoritative; API responses include period, currency, formula/rule/model version, and data-quality metadata. Frontend must not duplicate calculations.
