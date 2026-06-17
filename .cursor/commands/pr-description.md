Generate a **PR description** from the current branch diff against `main`.

## Steps

1. Run `git diff main...HEAD --stat` and `git log main..HEAD --oneline` to understand scope.
2. Identify primary **SCOPE** (`GEN`, `TAD`, `DVN`, `PRT`) from changed paths.
3. Write the PR description below.

## Output format

```markdown
## Summary

- <bullet: what changed and why — 1-3 bullets>

## Scope

**<SCOPE>** — <apps/packages touched>

## Test plan

- [ ] <specific check derived from changes>
- [ ] `pnpm codeCheck` (or scoped filter if narrow)
- [ ] <app-specific: e.g. manual test of feature X>
```

## Rules

- Mention affected apps/packages by name
- Test plan must be actionable — not generic "test everything"
- If DB migrations included, note `db:migrate` / `db:push` step
- If only `.cursor/` changes, note no app code impact
- Do not invent changes not in the diff

## Branch context

If branch name follows `<type>/<SCOPE>-<slug>`, reference it in Summary when helpful.
