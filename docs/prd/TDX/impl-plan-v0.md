# Todex — v0 implementation plan

| Field  | Value                                                                                 |
| ------ | ------------------------------------------------------------------------------------- |
| Status | Ready to implement                                                                    |
| Scope  | TDX                                                                                   |
| Goal   | Local Docker (Postgres) + Google auth + `/overview` (empty) + `/tasks` (list live)    |
| Out    | Redis, labels, Kanban, `X-Workspace-Id`, Calendar/Docs UI, GCal, guests, mentions, AI |

North star (not built in v0): **Unified AI context for Tasks, Calendar, and Docs.**

Scaffolds already exist (`apps/todex-api`, `apps/todex-web`) but are stock Nest 12 / Next 16 with nested `.git` / lockfiles. Phase 0 is a **rewire**, not “add apps to the workspace glob.”

---

## Phase 0 — Monorepo + Docker

**Done when:** `pnpm dev:todex` starts API + web against Compose Postgres (no Redis).

| Step | Work                                                                                                                                                         |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0.1  | Rewire scaffolds: delete `todex-api/.git`, `todex-web/pnpm-lock.yaml` + `pnpm-workspace.yaml`. `apps/*` already covers both.                                 |
| 0.2  | Pin catalog + `workspace:*`. Nest **11** (not 12 / `@nestjs/observe` / oxlint). Next **15** via catalog (not 16). Extend `@repo/typescript-config` + eslint. |
| 0.3  | Register turbo `dev:todex` (api + web + `@repo/api` + `@repo/ui`). Declare env in `turbo.json` `globalEnv` (`DATABASE_URL`, `BETTER_AUTH_*`, Google, URLs).  |
| 0.4  | `apps/todex-api/docker-compose.yml`: Postgres only (`5434:5432`). No Redis. No AI services.                                                                  |
| 0.5  | Env Zod for api/web (`DATABASE_URL`, `BETTER_AUTH_*`, Google OAuth identity-only, web/api URLs). No `REDIS_*`.                                               |
| 0.6  | Confirm `TDX` in commitlint + husky (already added)                                                                                                          |
| 0.7  | `@repo/ui`: shadcn primitives needed for the shell (Button off Themes, plus Input / Sidebar pieces as needed). Todex does not import Themes.                 |

**Branch example:** `chore/TDX-monorepo-docker`

---

## Phase 1 — `@repo/api/todex` + DB schemas

**Done when:** Shared Zod types compile; Drizzle migrations create v0 tables.

| Step | Work                                                                                                                                                                                      |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1  | Export barrel `@repo/api/todex` (`src/todex/`). Do **not** re-export from `@repo/api` main (Devinity class-validator). Add Zod to that subpath only.                                      |
| 1.2  | Zod: Workspace, WorkspaceMember, Folder, TaskBoard, Task (+ create/update/list DTOs). ISO dates; `estimationDays`; plain `description`; `parentTaskId` (deeper trees). **No Label DTOs.** |
| 1.3  | Drizzle: Better Auth tables + Workspace (`taskSeq`) + WorkspaceMember + Folder (`kind=tasks`) + TaskBoard + Task. **No Label / TaskLabel.** `scheduleDate` column ok (unused in UI).      |
| 1.4  | `taskKey`: required, `unique(workspaceId, taskKey)`, format `T-{n}`. `workspace.taskSeq` incremented in the same txn as insert. Client cannot set it. Never rewrite on move/reparent.     |
| 1.5  | Status enum: `todo \| in_progress \| done` (not TAD `"To Do"`).                                                                                                                           |
| 1.6  | `db:generate` / `db:migrate` against Compose Postgres                                                                                                                                     |
| 1.7  | Custom Nest Zod validation pipe (not `nestjs-zod`)                                                                                                                                        |

**Branch example:** `feat/TDX-api-todex-dtos-schema`

---

## Phase 2 — Auth + Workspace

**Done when:** Google sign-in on dev creates session + workspace; `/v1/workspaces` works.

| Step | Work                                                                                                                                             |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2.1  | Better Auth on API (Google only; no anonymous; no email/password). **Identity scopes only** — do not copy TAD `calendar.events`.                 |
| 2.2  | Dev: signup on. Prod: Google provider `disableSignUp: true`                                                                                      |
| 2.3  | Cookie on API origin (dev Lax / prod None+Secure); `trustedOrigins` = web URL; CORS `credentials`; `bodyParser: false`.                          |
| 2.4  | Nest AuthGuard on `/v1/*`. Resolve workspace from the user’s **sole** membership (0 or >1 → 403). **No `X-Workspace-Id`** until multi-workspace. |
| 2.5  | On first allowed signup: idempotent `Workspace` + owner `WorkspaceMember` (`taskSeq = 0`)                                                        |
| 2.6  | Web: Better Auth client → API; session check; redirect unauthenticated → sign-in                                                                 |

**Branch example:** `feat/TDX-auth-workspace`

---

## Phase 3 — App shell

**Done when:** Logged-in user lands on empty Overview; sidebar shows Tasks live, Calendar/Docs disabled.

| Step | Work                                                                                               |
| ---- | -------------------------------------------------------------------------------------------------- |
| 3.1  | Layout + sidebar from `@repo/ui` shadcn primitives (no Radix Themes, no app-local shadcn tree)     |
| 3.2  | `/overview` empty shell; default post-login home                                                   |
| 3.3  | Sidebar: Overview, Tasks enabled; Calendar, Docs **disabled** (visible but not navigable / greyed) |
| 3.4  | Stub `/calendar`, `/docs` optional (redirect or “coming soon”) — must not be primary nav           |

**Branch example:** `feat/TDX-app-shell-overview`

---

## Phase 4 — Tasks API

**Done when:** CRUD folders/boards/tasks via `/v1` with Zod.

| Step | Work                                                                                                                                 |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 4.1  | Modules: Folders (`kind=tasks`), Boards, Tasks. **No Labels module.**                                                                |
| 4.2  | Endpoints: list/create/update/delete; task move / reparent (`parentTaskId`, deeper trees). Cycle check (self + ancestor walk) → 400. |
| 4.3  | Assign `taskKey` on insert (`T-{n}` from `workspace.taskSeq`). Flat DTO — no nested `subtasks[]`.                                    |
| 4.4  | Map Drizzle → DTO once; no FE remappers                                                                                              |
| 4.5  | Unit/e2e smoke: happy paths, membership 403, cycle 400, cross-workspace 403 (do not leak existence)                                  |

**Branch example:** `feat/TDX-tasks-api`

---

## Phase 5 — Tasks UI

**Done when:** User can manage folders, boards, and a nested **list** of tasks on `/tasks`.

| Step | Work                                                                                                                                   |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 5.1  | Http workspace/tasks client using `@repo/api/todex` + TanStack Query                                                                   |
| 5.2  | Sidebar: task folders + boards (`folderId` optional for root boards)                                                                   |
| 5.3  | **List view only.** Rebuild thin nested list (indent via `parentTaskId`). Do **not** port TAD `ListBoard` / Kanban / TaskView / Focus. |
| 5.4  | Task fields: `taskKey` (display), summary, plain description, status, priority, dueDate, estimationDays, nested subtasks               |
| 5.5  | No labels UI. No `scheduleDate` in UI. Kanban is later.                                                                                |

**Branch example:** `feat/TDX-tasks-ui`

---

## Phase 6 — Hardening

**Done when:** Local happy path is repeatable for you on Google (dev signup).

| Step | Work                                                             |
| ---- | ---------------------------------------------------------------- |
| 6.1  | README / env sample for `todex-api` + `todex-web` + Compose      |
| 6.2  | `pnpm` lint/typecheck/test for changed packages                  |
| 6.3  | Smoke: compose up → Google signup → overview → create board/task |

---

## Explicit non-goals in this plan

- Redis / in-memory cache fallback
- Labels / TaskLabel
- Kanban
- `X-Workspace-Id` (multi-workspace)
- Guests / IndexedDB / import
- Google Calendar (any sync; no calendar OAuth scopes)
- Docs / EntityLink / mentions UI
- TipTap task body
- LLM / AI services in Docker
- Focus
- Next 16 / Nest 12 / `nestjs-zod`

---

## Suggested PR sequence

1. `chore(TDX): wire monorepo and docker compose`
2. `feat(TDX): add @repo/api/todex schemas and drizzle`
3. `feat(TDX): google auth and workspace bootstrap`
4. `feat(TDX): overview shell with disabled calendar docs nav`
5. `feat(TDX): tasks api`
6. `feat(TDX): tasks list ui`

Merge order = phase order. Prefer small PRs over one mega-PR. `@repo/ui` shadcn Button (off Themes) can ride in PR 1 or 4; don’t land Themes in Todex.

---

## Acceptance checklist (v0 done)

- [ ] `docker compose up` → Postgres healthy (no Redis container)
- [ ] `pnpm dev:todex` runs (Next 15, Nest 11, catalog)
- [ ] Google signup works in **dev**; creates workspace; identity scopes only
- [ ] Land on `/overview` (empty)
- [ ] `/tasks` **list**: create folder, board (with/without folder), task, nested subtask, edit status/priority/estimate days
- [ ] New tasks show stable `T-{n}`; reparent does not rewrite the key
- [ ] Calendar & Docs disabled in sidebar
- [ ] No guest mode, no GCal, no AI containers, no Redis, no labels
- [ ] Wire types from `@repo/api/todex` only (ISO dates)
- [ ] UI from `@repo/ui` shadcn primitives — no Radix Themes
