# Security & Privacy — ProfitAI

ProfitAI handles sensitive business and potentially personal/financial information. Security is a release requirement, not a later enhancement.

## Minimum controls

- Authentication and server-side authorization.
- Tenant isolation for every read/write and background job.
- Password hashing through a maintained authentication library; never store plaintext.
- Secrets only in environment/secret manager; `.env` ignored by Git.
- HTTPS in deployed environments.
- Input validation and safe parameterized database access.
- Rate limiting for authentication and expensive endpoints.
- Secure upload validation, file size limits, safe CSV parsing, and duplicate handling.
- Least-privilege database and service credentials.
- Avoid sensitive payloads in logs, analytics, screenshots, and prompts.
- Backups and tested restore procedure before production.
- Dependency updates and vulnerability review.
- Audit events for membership, role, transaction correction, and sensitive exports.

## LLM privacy

- Send only the minimum structured evidence required.
- Never send passwords, access tokens, identity documents, or full raw transaction files.
- Review provider retention, training, residency, and contractual terms before production use.
- Keep LLM API keys on backend.
- Treat model output as untrusted; validate schema and sanitize rendered content.

## User rights and governance

Before production, document privacy notice, purpose of processing, data retention, deletion/export process, access controls, incident handling, and applicable Indonesian personal data protection obligations. Obtain qualified legal review for compliance claims.

## Security acceptance tests

- Cross-tenant read/write denied.
- Role permissions enforced server-side.
- Expired/invalid token denied.
- Upload rejects malformed/oversized files.
- No secrets in repository/history/build artifacts.
- Sensitive logs are minimized.
