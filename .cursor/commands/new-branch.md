Generate a **compliant git branch name** from my one-line description.

## Input

I will provide a short description of the work (e.g. "fix kanban drag bug in take-and-do").

## Output

Return **only** the branch name — no explanation unless I ask.

## Rules (from commitlint + Husky)

Format: `<type>/<SCOPE>-<slug>`

**Types:** `feat`, `fix`, `test`, `chore`, `docs`, `refactor`, `style`, `release`

**Scopes:** `GEN` (repo-wide), `TAD` (take-and-do), `DVN` (devinity-api/web), `PRT` (personal-website)

**Slug:** lowercase, hyphens between words; may include version like `1.2.0` or `v1`

**Max length:** 50 characters total

## Examples

- `feat/TAD-focus-session-persistence`
- `fix/DVN-user-hook-race`
- `chore/GEN-cursor-rules`
- `release/TAD-1.2.0`

Pick the most accurate `type` and `SCOPE` from the description. Abbreviate slug if needed to stay under 50 chars.
