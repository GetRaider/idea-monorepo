# Agent development workflow

Treat **rules** as constraints, **task prompts** as explicit entry points, and **skills** as reusable procedures. The steps below are the same in any IDE. Point the agent at these files if the editor does not load them automatically.

## Repo inputs

- **Rules:** `.cursor/rules/`. Architecture, formatting, and framework constraints. Preserve local rule revisions when integrating this branch.
- **Task prompts:** `.cursor/commands/`. `own-task` for implementing work, `ask` for questions, `research` for audits, and `create-prd` for requirements. In Cursor these are slash commands (`/own-task`, `/ask`, `/research`, `/create-prd`). Elsewhere, paste the file or attach it as the task.
- **Skills:** `.agents/skills/`. The agent should apply a skill when its description matches the task. `review-changes` is intentionally manual.
- **Formatting:** `.cursor/hooks.json` runs Prettier after Cursor Agent edits. It is not a test runner. Other editors should format on save or run Prettier before commit.
- **Verification:** `pnpm verify:affected` checks lint, unit tests, and available typecheck tasks in impacted workspaces and their dependents. Add `--build`, `--e2e`, or `--full` when justified. It needs a local `main` or `origin/main` ref unless you pass `--full`. This is scoped verification, not a complete CI gate.

## User preferences

Keep these as your personal agent preferences. Leave repository-specific architecture, formatting, and framework rules in `.cursor/rules/`.

```text
- Be concise, direct, and technically precise.
- Answer questions directly without filler or repetitive summaries.
- Challenge incorrect assumptions and offer better alternatives with reasons.
- Inspect relevant code and investigate uncertainty before asking questions.
- Make reasonable, reversible decisions independently. Ask only when materially blocked.
- When implementing, report what changed, what was actually verified, and remaining risks or work only when present.
```

## Working on a task

1. Update `main` and create one feature or fix branch from `main` using `<type>/<SCOPE>-<slug>`. Do not let the agent create the branch unless you ask it to.
2. Start from `own-task` with the desired behavior and acceptance criteria. Small tasks go straight to implementation. Complex tasks get a short plan first.
3. The agent uses relevant skills, writes meaningful regression coverage, and runs `pnpm verify:affected` (optionally `--build` or `--e2e`).
4. For sensitive changes (auth, payments, migrations, concurrency) or substantial cross-module changes, start a **fresh agent conversation** and run `review-changes`. An independent review pass is unnecessary for cosmetic or routine low-risk edits.
5. Address material findings, run affected verification, commit, and open a PR. Merge to `main` through the normal review process.

## Scope and limits

- Formatting does not run tests or guarantee a build. `pnpm verify:affected` owns those checks.
- The verification script uses Git changes relative to `main` (or `origin/main`) plus staged, unstaged, and untracked changes. Root tooling changes trigger all-workspace checks.
- Not every package defines `typecheck` or `test`. Turbo skips missing tasks. Use `--build` when compiling an integration boundary matters, and use manual or browser checks for flows without automated end-to-end tests.
- A fresh reviewer agent is a separate reasoning pass, not a security guarantee.
- Do not enable automatic retry loops or multi-agent orchestration until the basic single-agent workflow is stable.
