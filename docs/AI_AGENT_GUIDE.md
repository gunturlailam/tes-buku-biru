# AI Coding Agent Guide

## Before generating code
Ask/inspect:
- Which existing framework and version are present?
- Which files already implement this capability?
- Which issue and acceptance criteria authorize this change?
- What API/schema is agreed?
- Which tests/commands are available?

## Prompt template for team use

```text
You are contributing to ProfitAI. Read AGENTS.md and the relevant docs first.
Issue: [issue title and link]
Owner: [human owner]
Goal: [specific outcome]
Acceptance criteria:
- [criterion 1]
- [criterion 2]
Scope:
- Allowed files/modules: [...]
- Do not modify: [...]
Constraints:
- Preserve existing stack and conventions.
- Financial calculations stay in backend and use Decimal.
- Respect tenant authorization.
- Do not invent data or claim untested accuracy.
- Add/update tests and docs.
Before coding, summarize your plan and files to change. Implement only this issue.
After coding, report changed files, tests actually run, results, risks, and remaining work.
Do not commit, push, or merge unless explicitly instructed.
```

## Agent boundaries
- One agent/task per issue.
- Human owner reviews every generated diff.
- Never let multiple agents edit the same shared file concurrently.
- Agent output is a proposal until tests and human review pass.
- Do not paste production secrets or private financial records into prompts.
