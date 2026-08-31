# Todex — Architecture

| Field   | Value      |
| ------- | ---------- |
| Status  | Draft      |
| Scope   | TDX        |
| Created | 2026-08-31 |

Companion: [prd.md](./prd.md), [data-model.md](./data-model.md), [flows.md](./flows.md), [impl-plan-v0.md](./impl-plan-v0.md), [excalidraw](./todex-architecture-v1.excalidraw).

**Summary:** Unified AI context for Tasks, Calendar, and Docs — v0 builds the Nest/Next split, auth, and Tasks **list** that context will sit on.

## v0 slice (implement this first)

| In                                                                            | Out (sidebar disabled / later)            |
| ----------------------------------------------------------------------------- | ----------------------------------------- |
| Docker Compose: Postgres (local only)                                         | Redis, hosted / cloud DB                  |
| `pnpm-workspace` + turbo + `dev:todex`                                        | —                                         |
| `@repo/api/todex` Zod DTOs                                                    | —                                         |
| Auth (Google, identity scopes). **Dev:** signup on. **Prod:** `disableSignUp` | Email/password, anonymous, calendar OAuth |
| Workspace + owner on first Google signup                                      | Guests / IndexedDB / import               |
| **`/overview`** empty shell                                                   | —                                         |
| **`/tasks`** folders + boards + **list**                                      | Kanban, labels                            |
| shadcn via `@repo/ui` (no Themes)                                             | AI containers / LLM in Docker             |
| Git scope **`TDX`** (already in commitlint/branchlint)                        | —                                         |

| Deferred                              | Notes                                                  |
| ------------------------------------- | ------------------------------------------------------ |
| `/calendar`, `/docs`                  | Routes may exist; **disabled in sidebar**              |
| Google Calendar sync                  | Later, **bidirectional**                               |
| Redis + memory fallback               | When there is a consumer (GCal jobs / throttle)        |
| Labels / TaskLabel                    | Simple migration later                                 |
| `X-Workspace-Id`                      | When a user can belong to >1 workspace                 |
| Guests                                | Later: IndexedDB; local calendar ok; no GCal; no `/v1` |
| EntityLink / mentions                 | Later                                                  |
| Guest import merge policy             | Decide when guests land                                |
| Task `scheduleEnd` / overlay duration | Decide when Calendar ships                             |
| TipTap task description               | v0.1 — **plain string** in v0                          |
| AI / ContextService                   | LLM run locally by you; not in Compose                 |

## Decision: Devinity split, not TAD fullstack

|         | Take & Do                                      | Todex                                                     |
| ------- | ---------------------------------------------- | --------------------------------------------------------- |
| API     | Next `app/api` + controllers                   | Nest `apps/todex-api`                                     |
| Web     | Same process                                   | Next `apps/todex-web` — pages only (Next **15**, catalog) |
| Auth    | Better Auth in Next + anonymous + localStorage | Google only on API. Guests later (IndexedDB)              |
| Tenancy | `userId` on Folder/Board/Task/Event            | `workspaceId` + `WorkspaceMember`                         |
| DTOs    | App-local Zod ≠ FE `types/*`                   | Shared Zod `@repo/api/todex`                              |
| Cache   | None                                           | **None in v0.** Redis later                               |
| UI      | Radix Themes + list/kanban                     | shadcn `@repo/ui`; **list only** in v0                    |

**No BFF.** Browser → `todex-api` (`/api/auth/*`, `/v1/*`) with `credentials: include`. Cookies on **API origin**.

Apps **must not** import `apps/take-and-do`. Port into `todex-web` / `todex-api` / `@repo/api/todex` / `@repo/ui`.

## Request path (v0)

```
Registered (only mode in v0)
  todex-web ──► Better Auth (/api/auth) ──► Postgres (Docker)
       │
       └──► todex-api (/v1) ──► Postgres
```

No Redis. No GCal worker. No guest path.

## Monorepo registration (first wiring PR)

Scaffolds exist; rewire them — do not keep Nest 12 / Next 16 / nested `.git` / nested lockfiles.

- `pnpm-workspace.yaml` — `apps/*` already includes `todex-api` / `todex-web`
- `turbo.json` — `dev:todex` + `globalEnv` for Todex vars
- Root `package.json` — `dev:todex` (api + web + `@repo/api` + `@repo/ui`)
- Commitlint / branchlint / `.cursor/rules` — scope **`TDX`** (done)

## Apps

### `todex-api`

Nest 11 + Drizzle + `@thallesp/nestjs-better-auth`. Catalog deps. `bodyParser: false` for Better Auth.

**v0 modules:** Auth, Workspace, Tasks (folders/boards/tasks).

Later: Calendar, Docs, Links, Parse, Import, GCal sync (pg-boss), Labels, Redis.

No Focus. No AI service in Docker. No Redis module in v0.

### `todex-web`

Next App Router **15** (catalog). Shared DTOs from `@repo/api/todex`.

| Route       | v0                                                   |
| ----------- | ---------------------------------------------------- |
| `/overview` | Empty shell; post-login home                         |
| `/tasks`    | Live **list**: folders `kind=tasks` + boards + tasks |
| `/calendar` | Disabled in sidebar                                  |
| `/docs`     | Disabled in sidebar                                  |

**UI:** shadcn primitives in **`@repo/ui`** (`@radix-ui/react-*` + Tailwind + `cva` + `cn()`). Todex does not import Themes and does not grow a second shadcn tree. TAD/Devinity Themes stay until those files are touched.

**FE data (v0):** Http repository + TanStack Query (registered only). Guest `LocalWorkspaceRepository` later.

## Shared DTOs (Zod)

**Zod only for Todex** via **`@repo/api/todex`**. Devinity keeps `class-validator`.

| Layer             | Role                                                       |
| ----------------- | ---------------------------------------------------------- |
| `@repo/api/todex` | Zod schemas + `z.infer`. One wire shape                    |
| `todex-api`       | Custom Zod pipe (not `nestjs-zod`). Map Drizzle → DTO once |
| `todex-web`       | `Schema.parse(json)` after fetch                           |

- Dates = **ISO strings** on the wire.
- Subtasks: flat `parentTaskId`; **deeper trees allowed** (not TAD one-level-only). No nested `subtasks[]` on the wire.
- Task `description`: **plain string** in v0; TipTap in v0.1.
- `taskKey`: `T-{n}`, unique per workspace, assigned on insert, never rewritten.

## Auth

- Google only. Email/password off. **Identity scopes only** (do not copy TAD `calendar.events`).
- **Dev:** Google signup **on** (self-register for first users).
- **Prod:** `disableSignUp: true` on the Google provider — sign-in only for existing accounts.
- No Better Auth anonymous in v0.
- Session cookie on API origin. Prod: `SameSite=None; Secure`. Dev: `Lax`.
- Guard `/v1/*`. Workspace = the user’s **sole** `WorkspaceMember`. 403 if 0 or >1 memberships.
- **No `X-Workspace-Id` in v0.** Add it when invites / multi-workspace exist.
- First Google signup (when allowed): idempotent `Workspace` + owner `WorkspaceMember`.

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
registered: { googleCalendar: false, ai: false, import: false, calendarPage: false, docsPage: false, labels: false, kanban: false }
// guests: not shipped
```

## Local development (Docker Compose) — required for v0

`apps/todex-api/docker-compose.yml`:

| Service | Image         | Notes                    |
| ------- | ------------- | ------------------------ |
| `db`    | `postgres:15` | Local only (`5434:5432`) |

**No Redis. No AI / LLM services in Compose.** Run models locally yourself when needed.

`dev:todex` depends on compose up.

## Cache

**None in v0.** CRUD is Postgres only.

Later: Redis + memory fallback when there is a consumer (GCal jobs / throttle). CRUD must still work if Redis is down.

## API surface

### v0

| Prefix                                              | Purpose                  |
| --------------------------------------------------- | ------------------------ |
| `/api/auth/*`                                       | Better Auth (Google)     |
| `/v1/workspaces`                                    | list / current / members |
| `/v1/folders?kind=tasks`, `/v1/boards`, `/v1/tasks` | Tasks list page          |

### Later

| Prefix                                 | Purpose            |
| -------------------------------------- | ------------------ |
| `/v1/calendars`, `/v1/events`          | Calendar           |
| `/v1/integrations/google-calendar`     | Bidirectional GCal |
| `/v1/folders?kind=docs`, `/v1/docs`    | Docs               |
| `/v1/links`, `/v1/resources/:type/:id` | Mentions           |
| `/v1/tasks/from-text`                  | Parser             |
| `/v1/import`                           | Guest import       |
| `/v1/labels`                           | Labels             |

## AI unified context (later)

North star: EntityLink + `contentText` for humans and AI. **Not in v0.** No AI in Docker.

## Scale / reliability

One Nest + Docker/local Postgres. Redis / GCal LWW apply when those features ship.

## B2B

Workspace tenancy ready. v0 = one human → one workspace on signup. No invites yet. Header-based workspace selection later.

## Reuse from Take & Do

**Port for v0 Tasks:** list UX _ideas_ (not the TAD files), TanStack Query, task fields (→ `estimationDays`, plain description, deeper `parentTaskId` trees), Zod patterns via `@repo/api/todex`.

**Do not copy:** BFF, anonymous, Themes, Focus, Lexical, FE `Date` remappers, GCal-in-v0, Nest-in-Next, board-prefix `taskKey` rewriting, one-level reparent, nested `subtasks[]` DTOs, `ListBoard.tsx` / Kanban as-is.

## Git scope

**`TDX`** — `todex-api`, `todex-web`, `@repo/api/todex`. `@repo/ui` shadcn work for Todex may land as `GEN` or ride a TDX PR; don’t put Themes in Todex.
