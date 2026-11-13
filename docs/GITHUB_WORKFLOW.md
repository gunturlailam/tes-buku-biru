# GitHub Workflow — ProfitAI

## Branch protection

Protect `main`:
- require Pull Request;
- require CI checks;
- require at least one approval;
- require conversation resolution;
- restrict force push/deletion;
- no direct pushes for normal feature work.

## Issue lifecycle

`Backlog → Ready → In Progress → In Review → Done`

Every issue has:
- clear title and context;
- one accountable owner;
- scope and out-of-scope;
- acceptance criteria;
- dependencies;
- test plan;
- target milestone.

## Labels

- type: `feature`, `bug`, `docs`, `test`, `chore`
- area: `backend`, `frontend`, `database`, `ai-ml`, `security`, `design`
- priority: `P0`, `P1`, `P2`
- status: `blocked`, `needs-decision`

## Pull request policy

- PR links issue (`Closes #123`).
- One coherent change per PR.
- Include test results and screenshots when relevant.
- Backend contract changes must notify both frontend owners.
- Financial formula/risk/forecast changes require Risfiatul review.
- Database migrations require Guntur review.
- UI system changes require frontend coordination between Ronal and Hanif.
- Do not merge unresolved conflicts or failing CI.

## Coordination rule

A shared file has one temporary editor/owner at a time. If a task spans backend and frontend, split into coordinated issues: backend contract first, frontend integration second, or agree a shared contract before parallel work.
