---
name: pre-pr-check
description: Run the local CI equivalent (codeCheck, lint, test, build) for changed apps/packages and report all failures before opening a pull request. Use when preparing a PR, verifying CI will pass, or running pre-merge checks on the monorepo.
---

# Pre-PR Check

## Goal

Surface the same failures CI would catch before opening a PR.

## Step 1 — Identify scope

From `git diff main...HEAD --name-only` (or `git status`), determine affected workspaces:

| Path prefix | Package |
|-------------|---------|
| `apps/take-and-do/` | take-and-do |
| `apps/devinity-api/` | devinity-api |
| `apps/devinity-web/` | devinity-web |
| `apps/personal-website/` | personal-website |
| `packages/api/` | @repo/api |
| `packages/ui/` | @repo/ui |
| `packages/shared/` | @repo/shared |
| `packages/eslint-config/` etc. | config packages |

If root config changed (`turbo.json`, `pnpm-workspace.yaml`, `commitlint.config.cjs`), run **full** checks.

## Step 2 — Run checks (from repo root)

### Always (repo-wide)

```bash
pnpm codeCheck    # tsc + lint via turbo
```

### Per affected workspace

```bash
pnpm test --filter=<workspace>...
pnpm build --filter=<workspace>...
```

For devinity-web e2e (only if e2e-relevant changes):

```bash
pnpm test:e2e --filter=devinity-web
```

### Full CI simulation (large changes)

```bash
pnpm codeCheck && pnpm test && pnpm build
```

## Step 3 — Report

For each command, report:

- ✅ passed
- ❌ failed — paste relevant error lines and file paths
- ⏭️ skipped — with reason

Do not stop at first failure unless user asked — collect all failures.

## Step 4 — Branch/commit hygiene (informational)

Remind if current branch or last commit may fail Husky:

- Branch: `<type>/<SCOPE>-<slug>`, max 50 chars
- Commit: `<type>(<SCOPE>): <subject>`, max 70 chars, no body

See `.cursor/rules/git-conventions.mdc`.

## take-and-do note

Staged lint runs via root `.husky/pre-commit` when `apps/take-and-do/**` is staged.

## Constraints

- Run commands, don't just suggest them
- Use `--filter` to avoid rebuilding unrelated apps when scope is narrow
- Fix failures before recommending PR open
