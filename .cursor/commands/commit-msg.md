Generate a **compliant commit message** from my change summary.

## Input

I will describe what changed (or you may read `git diff --staged` if I say to use staged changes).

## Output

Return **only** the commit message header — single line, no body, no footer.

## Rules (commitlint.config.cjs)

Format: `<type>(<SCOPE>): <subject>`

**Types:** `feat`, `fix`, `test`, `chore`, `docs`, `refactor`, `style`, `release`

**Scopes:** `GEN`, `TAD`, `DVN`, `PRT` — required

**Max header length:** 70 characters

**No body. No footer.**

Use imperative mood: "add", "fix", "remove" — not "added" or "fixes".

## Scope selection

- `GEN` — tooling, shared packages, CI, root config
- `TAD` — apps/take-and-do
- `DVN` — apps/devinity-api, apps/devinity-web
- `PRT` — apps/personal-website

If changes span multiple apps, pick the primary scope or `GEN`.

## Examples

- `feat(TAD): persist focus session to database`
- `fix(DVN): guard user hook against stale session`
- `chore(GEN): add cursor git conventions rule`
