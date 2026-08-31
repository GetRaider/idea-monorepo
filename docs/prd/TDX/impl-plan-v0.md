# Todex — v0 implementation plan

| Field  | Value                                                                        |
| ------ | ---------------------------------------------------------------------------- |
| Status | Ready to implement                                                           |
| Scope  | TDX                                                                          |
| Goal   | Local Docker + Google auth + `/overview` (empty) + `/tasks` (live)           |
| Out    | Calendar/Docs UI (disabled in sidebar), GCal, guests, mentions, AI in Docker |

North star (not built in v0): **Unified AI context for Tasks, Calendar, and Docs.**

---

## Phase 0 — Monorepo + Docker

**Done when:** `pnpm dev:todex` starts API + web against Compose Postgres/Redis.

| Step | Work                                                                                              |
| ---- | ------------------------------------------------------------------------------------------------- |
| 0.1  | Add `apps/todex-api`, `apps/todex-web` to `pnpm-workspace.yaml`                                   |
| 0.2  | Register turbo tasks; root `dev:todex` (api + web + `@repo/api` + `@repo/ui`)                     |
| 0.3  | `apps/todex-api/docker-compose.yml`: Postgres (dedicated port, e.g. 5434) + Redis. No AI services |
| 0.4  | Env Zod for api/web (`DATABASE_URL`, `REDIS_*`, `BETTER_AUTH_*`, Google OAuth, web/api URLs)      |
| 0.5  | Align `todex-api` / `todex-web` with monorepo tsconfig / eslint / vitest patterns (like Devinity) |
| 0.6  | Confirm `TDX` in commitlint + husky (already added)                                               |

**Branch example:** `chore/TDX-monorepo-docker`

---

## Phase 1 — `@repo/api/todex` + DB schemas

**Done when:** Shared Zod types compile; Drizzle migrations create v0 tables.

| Step | Work                                                                                                                                                                                |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1  | Export barrel `@repo/api/todex` (do not mix with Devinity class-validator models)                                                                                                   |
| 1.2  | Zod: Workspace, WorkspaceMember, Folder, TaskBoard, Task, Label (+ create/update/list DTOs). ISO date strings; `estimationDays`; plain `description`; `parentTaskId` (deeper trees) |
| 1.3  | Drizzle schemas in `todex-api` matching data-model v0 + Better Auth tables                                                                                                          |
| 1.4  | `db:generate` / `db:migrate` against Compose Postgres                                                                                                                               |
| 1.5  | Nest Zod validation pipe (`nestjs-zod` or custom)                                                                                                                                   |

**Branch example:** `feat/TDX-api-todex-dtos-schema`

---

## Phase 2 — Auth + Workspace

**Done when:** Google sign-in on dev creates session + workspace; `/v1/workspaces` works.

| Step | Work                                                                             |
| ---- | -------------------------------------------------------------------------------- |
| 2.1  | Better Auth on API (Google only; no anonymous; no email/password)                |
| 2.2  | Dev: signup on. Prod: `disableSignUp: true`                                      |
| 2.3  | Cookie config (dev Lax / prod None+Secure); `trustedOrigins` = web URL           |
| 2.4  | Nest AuthGuard on `/v1/*`; resolve `X-Workspace-Id` + membership                 |
| 2.5  | On first allowed signup: create Workspace + owner WorkspaceMember                |
| 2.6  | Redis cache module + memory fallback; health reports cache mode                  |
| 2.7  | Web: Better Auth client → API; session check; redirect unauthenticated → sign-in |

**Branch example:** `feat/TDX-auth-workspace`

---

## Phase 3 — App shell

**Done when:** Logged-in user lands on empty Overview; sidebar shows Tasks live, Calendar/Docs disabled.

| Step | Work                                                                                               |
| ---- | -------------------------------------------------------------------------------------------------- |
| 3.1  | Layout + sidebar (shadcn / `@repo/ui` primitives — no Radix Themes)                                |
| 3.2  | `/overview` empty shell; default post-login home                                                   |
| 3.3  | Sidebar: Overview, Tasks enabled; Calendar, Docs **disabled** (visible but not navigable / greyed) |
| 3.4  | Stub `/calendar`, `/docs` optional (redirect or “coming soon”) — must not be primary nav           |

**Branch example:** `feat/TDX-app-shell-overview`

---

## Phase 4 — Tasks API

**Done when:** CRUD folders/boards/tasks (+ labels) via `/v1` with Zod.

| Step | Work                                                                                      |
| ---- | ----------------------------------------------------------------------------------------- |
| 4.1  | Modules: Folders (`kind=tasks`), Boards, Tasks, Labels                                    |
| 4.2  | Endpoints: list/create/update/delete; task move / reparent (`parentTaskId`, deeper trees) |
| 4.3  | Map Drizzle → DTO once; no FE remappers                                                   |
| 4.4  | Unit/e2e smoke for happy paths + membership 403                                           |

**Branch example:** `feat/TDX-tasks-api`

---

## Phase 5 — Tasks UI

**Done when:** User can manage folders, boards, and tasks end-to-end on `/tasks`.

| Step | Work                                                                                                  |
| ---- | ----------------------------------------------------------------------------------------------------- |
| 5.1  | Http workspace/tasks client using `@repo/api/todex` + TanStack Query                                  |
| 5.2  | Sidebar: task folders + boards (`folderId` optional for root boards)                                  |
| 5.3  | Board views: port Kanban and/or list UX from TAD (no Themes, no Focus)                                |
| 5.4  | Task fields: summary, plain description, status, priority, dueDate, estimationDays, subtasks (deeper) |
| 5.5  | Labels if in schema for v0                                                                            |

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

- Guests / IndexedDB / import
- Google Calendar (any sync)
- Docs / EntityLink / mentions UI
- TipTap task body
- LLM / AI services in Docker
- Focus

---

## Suggested PR sequence

1. `chore(TDX): wire monorepo and docker compose`
2. `feat(TDX): add @repo/api/todex schemas and drizzle`
3. `feat(TDX): google auth and workspace bootstrap`
4. `feat(TDX): overview shell with disabled calendar docs nav`
5. `feat(TDX): tasks api`
6. `feat(TDX): tasks page ui`

Merge order = phase order. Prefer small PRs over one mega-PR.

---

## Acceptance checklist (v0 done)

- [ ] `docker compose up` → Postgres + Redis healthy
- [ ] `pnpm dev:todex` runs
- [ ] Google signup works in **dev**; creates workspace
- [ ] Land on `/overview` (empty)
- [ ] `/tasks`: create folder, board (with/without folder), task, subtask (nested), edit status/priority/estimate days
- [ ] Calendar & Docs disabled in sidebar
- [ ] No guest mode, no GCal, no AI containers
- [ ] Wire types from `@repo/api/todex` only (ISO dates)
