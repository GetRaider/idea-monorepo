---
name: pre-pr-check
description: Run scoped lint, tests, and typechecking for changed workspaces, with optional build or e2e checks. Use before PRs, release readiness, or when verifying substantial changes.
---
# Pre-PR verification

1. Check the branch and working tree; identify changed apps, shared packages, and relevant downstream consumers.
2. Run `pnpm verify:affected --build` from the repo root. Add `--e2e` if relevant integration or UI flows have configured E2E tasks. For repo-wide tooling changes, run `pnpm verify:affected --full --build`.
3. Investigate introduced failures. Do not hide pre-existing failures, change unrelated tests, or claim success for checks not executed.
4. Inspect diff for secrets, migrations, API changes, backwards compatibility, and unintended files.
5. Report commands and results (pass/fail/skipped), along with remaining risks. A fresh Agent conversation using `/review-changes` is recommended for high-impact changes.

The verification script selects impacted workspaces from Git and runs applicable Turbo tasks. It does not deploy, migrate databases, or push commits.
