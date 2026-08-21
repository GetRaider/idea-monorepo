**Create a PRD** (Product Requirements Document) and save it for use by `/create-task`, `/generic-task`, and related commands.

## Input

- Feature or product description (required) — problem, users, constraints, rough scope
- Optional: target app, designs, deadlines, explicit non-goals

## Steps

1. Search the workspace for related features, schemas, routes, and existing PRDs — reuse terminology and avoid duplicating capabilities.
2. **Ask clarifying questions** before writing anything (see Discovery below). Do not draft or save the PRD until the feature context is complete enough to write testable requirements.
3. Infer **SCOPE** from affected areas (see Rules).
4. Derive a kebab-case **slug** from the feature name (3–6 words).
5. Write the PRD file to `docs/prd/<SCOPE>/<slug>.md` (create directories if missing).
6. Reply with the file path and a 2–3 sentence summary — do not paste the full PRD unless asked.

## Discovery

Ask targeted questions to fill gaps — batch them in one message. Cover what is missing from the input; skip what is already clear.

**Typical gaps to close**

- **Problem & users** — who is affected, what pain exists today, why now
- **Scope & non-goals** — what is in vs explicitly out for this iteration
- **Behavior** — happy path, edge cases, error/empty states, permissions
- **UX** — key flows, existing patterns to match, design constraints
- **Technical** — target app(s), data model, APIs, auth, integrations, performance, migrations
- **Execution** — how an agent should implement: modules to touch, patterns to follow, tests expected
- **Success** — how we know it shipped correctly; any deadlines or phasing

Use `AskQuestion` when choices are discrete; use open questions for free-form detail.

Only proceed to write the PRD when you can fill every section of the output template without guessing — including **Technical requirements** detailed enough for an agent to implement without follow-up. Unresolved items go in **Open questions** — but do not use that section to avoid asking upfront.

## Output file format

```markdown
# <Feature title>

| Field           | Value                        |
| --------------- | ---------------------------- |
| Status          | Draft                        |
| Scope           | <SCOPE>                      |
| Apps / packages | <e.g. take-and-do, @repo/ui> |
| Created         | <YYYY-MM-DD>                 |

## Problem

<What pain exists today; who is affected; why now>

## Goals

- <measurable or verifiable outcome>
- …

## Non-goals

- <explicitly out of scope for this PRD>
- …

## User stories

### <Story title>

**As a** <role>, **I want** <capability>, **so that** <benefit>.

**Acceptance criteria**

- [ ] <testable criterion>
- [ ] …

(repeat per story)

## Functional requirements

1. <requirement — specific, testable>
2. …

## Technical requirements

Enough detail for `/create-task` or `/generic-task` to implement without guessing.

### Architecture

- **Apps / packages:** <e.g. `apps/take-and-do`, `@repo/ui`>
- **Reuse (required):** <existing modules, components, hooks, services — prefer repo paths>
- **New modules:** <files or folders to create, following project conventions>
- **Import boundaries:** <what must stay in-app vs `@repo/*`>

### Data layer

- **Schema changes:** <tables, columns, indexes, enums — or "none">
- **Migration:** <drizzle migration needed, seed data, backfill — or "none">
- **Queries / persistence:** <what is read/written, key constraints>

### API & contracts

- **Endpoints / server actions:** <method, path, auth, request/response shape — or "N/A">
- **Shared types:** <DTOs or models in `@repo/api` — or "none">
- **Validation:** <inputs to validate at boundaries>

### Frontend (if applicable)

- **Routes / pages:** <paths and entry components>
- **Components:** <new vs extend existing; key props and states>
- **State & data fetching:** <server vs client, cache, optimistic updates>
- **Styling:** <`.styles.tsx` patterns, `@repo/ui` primitives to use>

### Auth & permissions

- <who can access; role/workspace checks; or "N/A">

### Error handling & edge cases

- <failure modes, user-visible messages, rollback behavior>

### Testing

- **Unit / integration:** <what to cover>
- **E2E:** <critical user flows — or "none">
- **Manual checks:** <steps for QA>

### Deployment & ops

- **Env vars:** <new or changed — or "none">
- **Scripts / commands:** <e.g. `db:migrate`, feature flags>
- **Rollout notes:** <phasing, backwards compatibility — or "none">

## UX / UI

<flows, states, empty/error cases — or "N/A" for backend-only work>

## Dependencies & risks

- <dependency or risk + mitigation>
- …

## Open questions

- [ ] <unresolved decision>
- …

## Success criteria

- <how we know this shipped correctly>

## Implementation checklist

Ordered steps for an agent executing this PRD:

- [ ] <step 1 — e.g. schema migration>
- [ ] <step 2 — e.g. API route>
- [ ] <step 3 — e.g. UI component>
- [ ] <verification — lint, tests, manual flow>
```

## Rules

- **Discovery first** — always ask questions when context is incomplete; never invent requirements to skip the Q&A
- **Execution-ready** — technical requirements must be concrete (paths, endpoints, schema fields, test targets); vague "implement X" is not enough
- **SCOPE:** `GEN` (repo-wide), `TAD` (take-and-do), `DVN` (devinity-api/web), `PRT` (personal-website), `TMP` (tempo) — see `.cursor/rules/git-conventions.mdc`
- **Monorepo:** apps must not import other apps; shared logic belongs in `@repo/*` — see `.cursor/rules/monorepo-architecture.mdc`
- Requirements must be **testable** — no vague "should be fast" without a threshold
- Prefer **reuse** over greenfield; call out existing modules to extend
- Status stays `Draft` until the user promotes it
- Do not implement application code — PRD only
- One PRD per feature; split into multiple files if scope spans unrelated capabilities

## Examples

**Input:** "Workspace emoji picker for take-and-do board headers"

**Output:** `docs/prd/TAD/workspace-emoji-picker.md`

**Input:** "Shared date-range filter component for all apps"

**Output:** `docs/prd/GEN/date-range-filter.md`
