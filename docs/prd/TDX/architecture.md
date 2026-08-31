# Todex — Architecture

| Field   | Value      |
| ------- | ---------- |
| Status  | Draft      |
| Scope   | TDX        |
| Created | 2026-08-31 |

Companion: [prd.md](./prd.md), [data-model.md](./data-model.md), [flows.md](./flows.md), [impl-plan-v0.md](./impl-plan-v0.md), [excalidraw](./todex-architecture-v1.excalidraw).

**Summary:** Unified AI context for Tasks, Calendar, and Docs — v0 builds the Nest/Next split, auth, and Tasks page that that context will sit on.

## v0 slice (implement this first)

| In                                                           | Out (sidebar disabled / later) |
| ------------------------------------------------------------ | ------------------------------ |
| Docker Compose: Postgres + Redis (local only)                | Hosted / cloud DB              |
| `pnpm-workspace` + turbo + `dev:todex`                       | —                              |
| `@repo/api/todex` Zod DTOs                                   | —                              |
| Auth (Google). **Dev:** signup on. **Prod:** `disableSignUp` | Email/password, anonymous      |
| Workspace + owner on first Google signup                     | Guests / IndexedDB / import    |
| **`/overview`** empty shell                                  | —                              |
| **`/tasks`** folders + boards + tasks                        | —                              |
| Redis + memory fallback                                      | AI containers / LLM in Docker  |
| Git scope **`TDX`** (add to commitlint/branchlint)           | —                              |

| Deferred                              | Notes                                                  |
| ------------------------------------- | ------------------------------------------------------ |
| `/calendar`, `/docs`                  | Routes may exist; **disabled in sidebar**              |
| Google Calendar sync                  | Later, **bidirectional**                               |
| Guests                                | Later: IndexedDB; local calendar ok; no GCal; no `/v1` |
| EntityLink / mentions                 | Later                                                  |
| Guest import merge policy             | Decide when guests land                                |
| Task `scheduleEnd` / overlay duration | Decide when Calendar ships                             |
| TipTap task description               | v0.1 — **plain string** in v0                          |
| AI / ContextService                   | LLM run locally by you; not in Compose                 |

## Decision: Devinity split, not TAD fullstack

|         | Take & Do                                      | Todex                                        |
| ------- | ---------------------------------------------- | -------------------------------------------- |
| API     | Next `app/api` + controllers                   | Nest `apps/todex-api`                        |
| Web     | Same process                                   | Next `apps/todex-web` — pages only           |
| Auth    | Better Auth in Next + anonymous + localStorage | Google only on API. Guests later (IndexedDB) |
| Tenancy | `userId` on Folder/Board/Task/Event            | `workspaceId` + `WorkspaceMember`            |
| DTOs    | App-local Zod ≠ FE `types/*`                   | Shared Zod `@repo/api/todex`                 |
| Cache   | None                                           | Redis + in-memory fallback                   |

**No BFF.** Browser → `todex-api` (`/api/auth/*`, `/v1/*`) with `credentials: include`. Cookies on **API origin**.

Apps **must not** import `apps/take-and-do`. Port into `todex-web` / `todex-api` / `@repo/api/todex` / `@repo/ui`.

## Request path (v0)

```
Registered (only mode in v0)
  todex-web ──► Better Auth (/api/auth) ──► Postgres (Docker)
       │
       └──► todex-api (/v1) ──► Postgres
                      └──► Redis (cache; memory fallback)
```

No GCal worker in v0. No guest path in v0.

## Monorepo registration (first wiring PR)

- `pnpm-workspace.yaml` — `apps/todex-api`, `apps/todex-web`
- `turbo.json` — pipeline tasks as needed
- Root `package.json` — `dev:todex` (api + web + `@repo/api` + `@repo/ui`)
- Commitlint / branchlint / `.cursor/rules` — scope **`TDX`**

## Apps

### `todex-api`

Nest + Drizzle + `@thallesp/nestjs-better-auth`.

**v0 modules:** Auth, Workspace, Tasks (folders/boards/tasks).

Later: Calendar, Docs, Links, Parse, Import, GCal sync (pg-boss).

No Focus. No AI service in Docker.

### `todex-web`

Next App Router. Shared DTOs from `@repo/api/todex`.

| Route       | v0                                          |
| ----------- | ------------------------------------------- |
| `/overview` | Empty shell; post-login home                |
| `/tasks`    | Live: folders `kind=tasks` + boards + tasks |
| `/calendar` | Disabled in sidebar                         |
| `/docs`     | Disabled in sidebar                         |

**UI:** shadcn on web + `@repo/ui`: `@radix-ui/react-*` + Tailwind + `cva` + `cn()`. No Themes.

**FE data (v0):** Http repository + TanStack Query (registered only). Guest `LocalWorkspaceRepository` later.

## Shared DTOs (Zod)

**Zod only for Todex** via **`@repo/api/todex`**. Devinity keeps `class-validator`.

| Layer             | Role                                            |
| ----------------- | ----------------------------------------------- |
| `@repo/api/todex` | Zod schemas + `z.infer`. One wire shape         |
| `todex-api`       | Zod pipe / `nestjs-zod`. Map Drizzle → DTO once |
| `todex-web`       | `Schema.parse(json)` after fetch                |

- Dates = **ISO strings** on the wire.
- Subtasks: flat `parentTaskId`; **deeper trees allowed** (not TAD one-level-only).
- Task `description`: **plain string** in v0; TipTap in v0.1.

## Auth

- Google only. Email/password off.
- **Dev:** Google signup **on** (self-register for first users).
- **Prod:** `disableSignUp: true` — sign-in only for existing accounts.
- No Better Auth anonymous in v0.
- Session cookie on API origin. Prod: `SameSite=None; Secure`. Dev: `Lax`.
- Guard `/v1/*`. `X-Workspace-Id` + membership.
- First Google signup (when allowed): `Workspace` + owner `WorkspaceMember`.

## Guests (not in v0)

Later:

|                               | Guest     | Registered               |
| ----------------------------- | --------- | ------------------------ |
| Tasks / Docs / local calendar | IndexedDB | `/v1`                    |
| Google Calendar               | **no**    | yes (bidirectional sync) |
| `/v1` writes                  | **no**    | yes                      |

Import merge policy (empty workspace vs merge) — **decide when guests land**.

## Capabilities (v0)

```ts
registered: { googleCalendar: false, ai: false, import: false, calendarPage: false, docsPage: false }
// guests: not shipped
```

## Local development (Docker Compose) — required for v0

`apps/todex-api/docker-compose.yml`:

| Service | Image            | Notes                                   |
| ------- | ---------------- | --------------------------------------- |
| `db`    | `postgres:15`    | Local only (e.g. `5434:5432`)           |
| `redis` | `redis:7-alpine` | AOF; avoid clashing with Devinity Redis |

**No AI / LLM services in Compose.** Run models locally yourself when needed.

`dev:todex` depends on compose up.

## Cache (Redis + fallback)

1. Prefer Redis.
2. Missing/fail → in-memory; health reports mode.
3. Miss/down → Postgres. CRUD never requires Redis.

v0 uses: throttle / short TTL. No pg-boss GCal jobs yet.

## API surface

### v0

| Prefix                                              | Purpose                  |
| --------------------------------------------------- | ------------------------ |
| `/api/auth/*`                                       | Better Auth (Google)     |
| `/v1/workspaces`                                    | list / current / members |
| `/v1/folders?kind=tasks`, `/v1/boards`, `/v1/tasks` | Tasks page               |

### Later

| Prefix                                 | Purpose            |
| -------------------------------------- | ------------------ |
| `/v1/calendars`, `/v1/events`          | Calendar           |
| `/v1/integrations/google-calendar`     | Bidirectional GCal |
| `/v1/folders?kind=docs`, `/v1/docs`    | Docs               |
| `/v1/links`, `/v1/resources/:type/:id` | Mentions           |
| `/v1/tasks/from-text`                  | Parser             |
| `/v1/import`                           | Guest import       |

## AI unified context (later)

North star: EntityLink + `contentText` for humans and AI. **Not in v0.** No AI in Docker.

## Scale / reliability

One Nest + Docker/local Postgres + Redis (memory fallback). GCal LWW / sync reliability apply when Calendar ships.

## B2B

Workspace tenancy ready. v0 = one human → one workspace on signup. No invites yet.

## Reuse from Take & Do

**Port for v0 Tasks:** Kanban/list UX, TanStack Query, task fields (→ `estimationDays`, plain description, deeper `parentTaskId` trees), Zod patterns via `@repo/api/todex`.

**Do not copy:** BFF, anonymous, Themes, Focus, Lexical, FE `Date` remappers, GCal-in-v0, Nest-in-Next.

## Git scope

**`TDX`** — `todex-api`, `todex-web`, `@repo/api/todex`. Register in commitlint + branchlint when wiring the monorepo.
