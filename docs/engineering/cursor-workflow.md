# Cursor agent development workflow

This repository uses Cursor for agent-assisted development. Treat **rules** as constraints, **commands** as explicit entry points, and **skills** as reusable procedures.

## Setup

- **Project rules:** `.cursor/rules/`. Preserve local rule revisions when integrating this branch.
- **Commands:** `.cursor/commands/`. Use `/own-task` for implementing work, `/ask` for questions, `/research` for audits, and `/create-prd` for requirements.
- **Skills:** `.agents/skills/`. Cursor discovers these and may apply them based on their descriptions. `/review-changes` is intentionally manual.
- **Hooks:** `.cursor/hooks.json` enables lightweight Prettier formatting after Agent edits. Check Cursor's **Customize → Hooks** output if it fails; restart Cursor if necessary. This hook is intentionally not a test runner.
- **Verification:** `pnpm verify:affected` checks lint, unit tests and available typecheck tasks in impacted workspaces and their dependents; use `--build`, `--e2e` or `--full` when justified. It requires a local `main` or `origin/main` ref unless using `--full`. This is best-effort scoped verification, not a complete CI security gate.

## Global User Rules (paste into Cursor Settings → Rules → User Rules)

These are account-level preferences, so this repository cannot change them for you:

```text
- Be concise, direct, and technically precise.
- Answer questions directly without filler or repetitive summaries.
- Challenge incorrect assumptions and offer better alternatives with reasons.
- Inspect relevant code and investigate uncertainty before asking questions.
- Make reasonable, reversible decisions independently. Ask only when materially blocked.
- When implementing, report what changed, what was actually verified, and remaining risks or work only when present.
```

Keep repository-specific architecture, formatting and framework rules in `.cursor/rules/`, not in these global preferences.

## Working on a task

1. Update `main` and create one feature/fix branch from `main` using your established `<type>/<SCOPE>-<slug>` naming. Avoid automatic branch creation by the Agent unless explicitly requested.
2. Use `/own-task` with desired behavior and acceptance criteria. Small tasks go straight to implementation; complex tasks get a short plan.
3. The Agent uses relevant skills, writes meaningful regression coverage and runs `pnpm verify:affected` (optionally `--build` / `--e2e`).
4. For sensitive changes (auth, payments, migrations, concurrency) or substantial cross-module changes, start a **fresh Cursor Agent conversation** and invoke `/review-changes`. Independent AI review is not required for cosmetic or routine low-risk edits.
5. Address material findings, run affected verification, commit and open a PR; merge to `main` through the normal review process.

## Scope, limitations and troubleshooting

- The formatter hook does not run tests or guarantee a successful build; the explicit verification command owns those checks.
- The verification script uses Git changes relative to `main` (or `origin/main`) plus staged, unstaged and untracked changes. Root tooling changes trigger all-workspace checks.
- Not every package defines `typecheck` or `test`; Turbo skips missing tasks. Use `--build` when compiling an integration boundary is important, and use manual/browser checks for flows without automated E2E.
- A fresh reviewer Agent is a separate reasoning pass, not a security guarantee.
- Do not enable automatic retry loops or multi-agent orchestration until the basic single-agent workflow is stable.
