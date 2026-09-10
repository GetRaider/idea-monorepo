# Tasks page — TAD parity

| Field           | Value                                                                 |
| --------------- | --------------------------------------------------------------------- |
| Status          | Draft                                                                 |
| Scope           | TDX                                                                   |
| Apps / packages | `apps/todex-web`, `apps/todex-api`, `@repo/api/todex`, `@repo/ui`      |
| Created         | 2026-09-10                                                            |

## Problem

Todex `/tasks` is a single-route prototype: client-state sidebar, nested list grouped by status, Sheet editor. It does not match Take & Do’s Tasks **navigation and views**: routed boards/schedules, kanban + list + single-list, task detail, quick create, space settings, folder/board management, labels, or rich descriptions.

`docs/prd/TDX/tasks-page-plans.md` already decided to **carry TAD’s Tasks architecture** (sidebar = nav, main = views, root = index). v0 docs froze list-only / no Kanban / no labels / no `scheduleDate` UI — this PRD **supersedes that freeze for the Tasks page**.

Do **not** port TAD’s custom chrome. Match TAD **behavior**, implement with **shadcn / `@repo/ui`**. Prefer fewer, simpler surfaces.

**Ship as vertical slices, in priority order. Do not implement the whole PRD in one PR or one agent run.** Each slice is API (if needed) + UI + tests and must be usable alone. **Labels and emoji are last (P4).**

## Dates (do not conflate)

| Field           | Meaning                                                                 | Used by |
| --------------- | ----------------------------------------------------------------------- | ------- |
| **`scheduleDate`** | When the work is **planned to be done** (calendar / Today / Tomorrow). | Today, Tomorrow, list sort “schedule”, TaskView “Schedule” |
| **`dueDate`**      | The **last day it should be done** (deadline). Independent of plan.    | TaskView “Due”; **never** filters Today/Tomorrow |

A task can have a due date and no schedule, a schedule and no due date, both, or neither. Today/Tomorrow **only** query `scheduleDate`. Current Todex code filtering schedules on `dueDate` is a bug — fix it.

## Goals

- Users navigate Tasks the TAD way: **sidebar = nav**, **main = views**, **root = index**.
- Board and schedule URLs are shareable (P0 paths; `/:taskKey` in P3).
- Today/Tomorrow aggregate across boards by **`scheduleDate`** (P1).
- Board views (P2): **Kanban**, **List**, **Single list**.
- Task detail stays the **shadcn `Sheet`**. Do not build a custom overlay/split TaskView.
- Folder/board **create, rename, delete** (emoji in P4); boards nest under optional folders.
- **UI: shadcn-first, simple.** Compose `@repo/ui`. Missing primitives go in `@repo/ui`, not `todex-web`.
- Tasks **module sidebar collapses to icons only**.
- No import of `apps/take-and-do`.

## Delivery — vertical slices (priority)

One slice per PR (or a small PR sequence inside the slice). **Do not start slice N+1 until N is merged and usable.**

| Pri | Slice | Ships | Explicitly out of this slice |
| --- | --- | --- | --- |
| **P0** | Shell + nav | App Router (`/tasks`, `/board/:name`, `/schedule/today\|tomorrow`), root index, collapsible icon sidebar, folder/board create/rename/delete/move, existing list + Sheet still work on the board route | Kanban, scheduleDate wiring, TipTap, labels, emoji |
| **P1** | Schedule vs due | `scheduleDate` on create/update; `GET /v1/tasks` by schedule range; Today/Tomorrow real; Sheet **Schedule** vs **Due**; stop filtering on `dueDate` | Kanban, TipTap, labels, emoji |
| **P2** | Board views | Kanban + list + single-list, settings menu, status DnD, quick create, in-view search only | TipTap, labels, emoji, global search |
| **P3** | Task detail | `taskKey` in URL; TipTap (bubble menu); HTML sanitize on API | Labels, emoji |
| **P4** | Labels + emoji | **Last.** Workspace labels + attach on task; folder/board emoji field in UI | — |

**P4 is last on purpose.** Do not add `labels` / `task_labels` schema, label APIs, or emoji pickers before P0–P3 are done.

Locked defaults (not open questions):

- Collapsed sidebar: Today + Tomorrow + **every board icon** (nested boards included). Folder click **expands the sidebar**. No folder dropdown-nav.
- `scheduleDate` is a **calendar day** (store timestamp at start of the user’s local day). No time picker.
- Unschedule = clear Schedule in the Sheet. No drag-off-board.
- In-view search only until a later PRD; no `GET /v1/tasks` full-text this effort.

## Non-goals

- **Inbox** (unplanned / `scheduleDate IS NULL` capture queue) — later PRD.
- Right-hand **BoardHealthPanel**, Focus, Lightning menu, public/private boards.
- Persisted **column rank** (`Task.position`) — Kanban/list DnD only updates **status**.
- TAD-clone UI: custom `SidePanel`, dual-pane TaskView, `MultipleKanbanBoard` stacked boards, slash-command editor, sidebar board DnD, emoji-circle card root.
- Guests / IndexedDB, Calendar/Docs pages, GCal, EntityLink/mentions, Redis, AI.
- Copying TAD files (`ListBoard.tsx`, `KanbanBoard/`, Themes, Lexical).
- Nested folder trees in the UI (`Folder.parentId` may exist; UI is one-level folders → boards).
- `X-Workspace-Id` / multi-workspace picker.
- **Doing P0–P4 in one change set.**
- Labels or emoji work before P3 is done.

## User stories

Stories are tagged with the slice that ships them.

### Open Tasks home (P0)

**As a** signed-in user, **I want** `/tasks` to list folders and boards, **so that** I can pick a space without landing on a random first board.

**Acceptance criteria**

- [ ] `/tasks` shows a simple list of folders (collapsible) and root boards; empty state with create board/folder.
- [ ] Clicking a board goes to `/tasks/board/{encodedName}`.
- [ ] Header primary action on root is **Create board/folder** (`Dialog` from `@repo/ui`).
- [ ] No health / In Progress column.

### Navigate via sidebar (expand / collapse) (P0)

**As a** user, **I want** the Tasks sidebar to collapse to icons, **so that** I keep nav without the label column.

**Acceptance criteria**

- [ ] **Expanded:** section titles (Schedules, Spaces) + icon + label per row; `+` to create board/folder.
- [ ] **Collapsed:** width ~ icon rail (~48–56px). **No text labels.** Each row is the same icon, still clickable. `Tooltip` shows the name. Create is a `+` icon. Active row still highlighted.
- [ ] Toggle control on the sidebar (chevron / panel icon). Preference persisted (`localStorage` key `todex:tasks-sidebar-open`, default expanded).
- [ ] Schedules: Today, Tomorrow (no Inbox). Distinct icons so collapsed mode is usable.
- [ ] Spaces: root boards + folders. **Collapsed:** Today, Tomorrow, then every board icon (including boards in folders). Folder icons are expanded-mode only; clicking a folder while collapsed **expands the sidebar**.
- [ ] Rename/delete via `DropdownMenu`. Confirm delete with `ConfirmDialog`. Deleting a folder unsets `board.folderId`, does not cascade-delete boards. **No emoji until P4.**
- [ ] Move board into/out of folder via `Select` / menu — **not** sidebar drag-and-drop.

### Work a board (P2)

**As a** user, **I want** kanban and list views of one board, **so that** I can triage status.

**Acceptance criteria**

- [ ] Default view mode **kanban**; per-board persistence `todex:board-view-mode:v1`.
- [ ] List submode `grouped` | `single` persisted `todex:board-list-submode:v1`.
- [ ] List sort (title / **scheduleDate** / priority, asc/desc, enabled flag) persisted `todex:board-list-sort:v1`. Sort “schedule” uses `scheduleDate`, not `dueDate`.
- [ ] Settings: `DropdownMenu` in the header (view, list submode, sort). No public toggle.
- [ ] Quick-create: one `Input` at the top of the list / To Do column. Header **Create Task** focuses it.
- [ ] DnD between status columns/sections updates `status` only; reload may not preserve intra-column order.
- [ ] Nested subtasks in list (indent via `parentTaskId`); kanban cards are roots; subtasks in the Sheet.

### Work Today / Tomorrow (P1)

**As a** user, **I want** tasks **scheduled** that day, across boards, **so that** I see the plan — not the deadline list.

**Acceptance criteria**

- [ ] `/tasks/schedule/today` and `/tomorrow` load tasks whose **`scheduleDate`** falls on that local calendar day.
- [ ] P1: reuse the **existing list** grouped by status, with board name on the row. P2: same view-mode as a board (kanban/list/single-list, context key `schedule:today` / `schedule:tomorrow`). One surface — do not stack a full kanban per board.
- [ ] Creating a task from a schedule view sets **`scheduleDate`** to that day (not `dueDate`) and requires a target board (`Select`).
- [ ] `dueDate` is not read or written by these views.

### Open and edit a task (P0 Sheet stays; dates P1; TipTap P3; labels P4)

**As a** user, **I want** a simple Sheet to edit a task, **so that** I can set plan vs deadline, description, and labels without a TAD TaskView clone.

**Acceptance criteria**

- [ ] **P0:** Selecting a task opens `@repo/ui` **`Sheet`** (right) with existing fields (summary, plain description, status, priority, due, estimate, parent).
- [ ] **P1:** Sheet adds **Schedule** (`scheduleDate`) next to **Due** (`dueDate`), labeled as in the Dates table. Clearing Schedule unschedules (drops off Today).
- [ ] **P1:** URL may still be board-only; **P3:** URL includes `taskKey`.
- [ ] **P3:** Description → TipTap (StarterKit + lists + checklist + **bubble menu only**). HTML in `Task.description`. Sanitize on API write.
- [ ] **P4:** Labels (`DropdownMenu` / multi-select; create inline). Color from name hash. Folder/board emoji `Input` (no picker).
- [ ] Save: explicit Save for summary/description; metadata can patch on change. Toast on failure. Delete via `ConfirmDialog`.

## Functional requirements

**P0**

1. App Router under `apps/todex-web/src/app/tasks/`: `page.tsx` (root), `board/[...boardPath]/page.tsx`, `schedule/[date]/page.tsx` (`today` \| `tomorrow` else `notFound()`). Optional `[taskKey]` segment is P3.
2. Unknown board name → in-page “Board not found”. Duplicate names: first match. No unique index.
3. Sidebar collapse preference: `localStorage` `todex:tasks-sidebar-open`.
4. Folder/board create, rename, delete, move (`folderId`). Call existing PATCH/DELETE.
5. Auth unchanged. UI = `@repo/ui` composition only.

**P1**

6. `GET /v1/tasks`: `{ boardId }` **xor** `{ scheduleFrom, scheduleTo }` filtering **`scheduleDate`**. 400 if both or neither. Range `[from, to)`.
7. Create/Update: optional `scheduleDate` and `dueDate` independently. No `labelIds` yet.
8. Quick create on a schedule view sets **`scheduleDate`** for that local day, not `dueDate`.
9. Only tasks with that `scheduleDate` appear (children do not inherit).

**P2**

10. View mode / list submode / sort in localStorage (`todex:board-view-mode:v1`, `todex:board-list-submode:v1`, `todex:board-list-sort:v1`). Sort “schedule” = `scheduleDate`.
11. Status DnD only. Quick create `Input`. In-view search only.

**P3**

12. TipTap + API HTML allowlist. `taskKey` in URL.

**P4 (last)**

13. `GET/POST/PATCH/DELETE /v1/labels`; unique `(workspaceId, name)` case-insensitive reject. Task DTO `labels: { id, name }[]`; PATCH `labelIds` replace-set.
14. Folder/board `emoji` in create/update UI (column already exists).

## Technical requirements

### Architecture

- **Apps / packages:** `apps/todex-web`, `apps/todex-api`, `@repo/api/todex`, `@repo/ui`.
- **Reuse (required):**
  - `todexClient` — extend
  - `TasksProvider` (`state` / `actions` / `meta`)
  - `@repo/ui` list above; current `Sheet` editor is the TaskView **starting point** (add fields, don’t replace with a custom overlay)
  - TAD as **behavior spec only** (routes, `scheduleDate` vs `dueDate`, view modes)
- **New modules (keep the list short):**
  - Route files under `src/app/tasks/`
  - `src/app/tasks/` colocated: sidebar, board/schedule view, description editor, url helper, view-preference hooks
  - Do **not** pre-create a large `components/tasks/*` kit (`TasksShell`, `SpaceSettings`, `CreateSpaceDialog`, …) if a page + `@repo/ui` covers it
- **Import boundaries:** no `apps/take-and-do`. TipTap wrapper in `todex-web` (P3, dynamic import). Label DTOs in `@repo/api/todex` (**P4 only**). New shadcn primitives in `@repo/ui` when a slice needs them.

### Data layer

- **P0–P3:** no new tables. `dueDate` and `scheduleDate` already exist — P1 wires both; **never alias them**. No `tasks.position`. `description` stays `text` (HTML from P3).
- **P4:** `labels` (`id`, `workspaceId`, `name`, timestamps); `task_labels` (`taskId`, `labelId`, `position` default 0, PK, cascade). Drizzle migrate then.
- **Queries:** P0 list-by-board; P1 list-by-**scheduleDate** range; P4 labels CRUD.

### API & contracts

- **P1 `GET /v1/tasks`:** Zod union `{ boardId }` | `{ scheduleFrom, scheduleTo }` on `schedule_date`. 400 if both or neither.
- **P1 `POST/PATCH /v1/tasks`:** `scheduleDate` and `dueDate` each `iso | null` optional.
- **P4:** `/v1/labels` CRUD; PATCH task `labelIds` full replace.
- Map Drizzle → DTO once. Cycle check unchanged. Cross-workspace 403.

### Frontend

- **Routes:** functional req 1. `AppNavRail` Tasks active for `/tasks/*`.
- **Sidebar:** two widths (`w-14` collapsed / `w-[220px]` expanded). `Tooltip` when collapsed. `Collapsible` for folder groups when expanded. Toggle stored in `todex:tasks-sidebar-open`.
- **DnD:** `@dnd-kit` for **status** only (kanban columns + list sections).
- **State:** TanStack Query; invalidate `['tasks']`, `['boards']`, `['folders']` (and `['labels']` in P4). Optimistic status (P2); toast + rollback on error.
- **Styling:** Tailwind on JSX via `cn()`. No styled-components, no Themes, no `*.styles.tsx`. Runtime `style` only for list indent and label HSL.

### Auth & permissions

- v0 `WorkspaceGuard`; labels/tasks/boards scoped to sole membership.

### Error handling & edge cases

- Nothing scheduled that day: empty state copy, not a fake board stack.
- No boards: disable Create Task; CTA to create a board.
- TipTap XSS (P3): sanitize on **API write** (allowlist TipTap tags; strip `script` / `iframe` / handlers).
- Delete board: confirm “Delete board and all its tasks?” (FK cascade).
- Parent cycle: API 400 + toast.
- Timezones: client sends local-day `scheduleFrom`/`scheduleTo` ISO for **scheduleDate**.
- TaskKey deep link missing: open the board/schedule, Sheet closed.
- Setting Due does not add the task to Today; setting Schedule to today does, even if Due is next week.

### Testing

- **P0:** url helper unit tests; folder/board update/delete still 403 across workspaces.
- **P1:** schedule local-day bounds; API e2e: due-today unscheduled **absent**; scheduled-today **present**; query XOR 400.
- **P2:** none required beyond existing; manual DnD + view switch.
- **P3:** XSS strip e2e.
- **P4:** labels CRUD e2e.
- **E2E web:** none required.

### Deployment & ops

- **Env vars:** none.
- **Scripts:** `pnpm --filter todex-api db:generate` / `db:migrate`.
- **Rollout:** P0–P3 additive on existing schema. P4 is the only labels migration. Each slice ships API + web together for that slice.

## UX / UI

**Principle: simplicity over complexity.** One rail (app) + one Tasks sidebar + one main pane + one Sheet. No extra columns, no stacked schedule boards, no custom overlays.

```
AppNavRail | [Tasks sidebar expand/collapse] | Main
             expanded: icons + names           Header: crumbs + Create + (P2 settings)
             collapsed: icons + tooltips       Root list | Board/Schedule (list P1, kanban P2)
                                               Sheet (task)
```

- **Root:** folder/board rows (`Button` / `Collapsible`), not TAD emoji-circle cards. Emoji on those rows is **P4**.
- **Board/schedule:** settings `DropdownMenu`; one quick-create `Input`; three columns or list sections; single-list = Tasks vs Done.
- **Sheet:** stacked fields; Schedule and Due are two date fields with helper text as in the Dates table.
- **Sidebar collapsed:** icons only, tooltips, still navigable; expand to see names and folder children.

## Dependencies & risks

- **Scope** is Large if done at once — **don’t**. Mitigate with P0→P4.
- Board-name URL collisions.
- No position column — order flickers after refetch (P2).
- TipTap bundle (P3): `next/dynamic`, `ssr: false`.

## Open questions

- [ ] Inbox — deferred (`scheduleDate IS NULL` capture).
- [ ] Unique board names per workspace — not this PRD.

## Success criteria

Per slice, not the whole doc:

- **P0:** `/tasks` root + routed board; sidebar icons-only collapse; folder/board CRUD; existing list/Sheet still work.
- **P1:** Today/Tomorrow are **schedule** views. Due today + unscheduled **absent**; scheduled today + later due **present**. Sheet has Schedule and Due.
- **P2:** Kanban / list / single-list + status DnD on board and schedule.
- **P3:** TipTap + shareable `taskKey` URL.
- **P4:** Labels + emoji.
- Every slice: shadcn/`@repo/ui`; lint/typecheck/tests for touched packages; no `apps/take-and-do` imports.

## Implementation checklist

Execute **in order**. Stop after each slice.

### P0 — Shell + nav

- [ ] `tasks-url.helper` + App Router root / board / schedule (schedule page can stub until P1)
- [ ] Collapsible sidebar (icon-only + tooltips + persist); folder click expands sidebar
- [ ] Root index; create/rename/delete/move folder & board via existing API + `Dialog` / `DropdownMenu` / `ConfirmDialog`
- [ ] Move current list + Sheet onto the board route
- [ ] Verify: lint, navigate collapsed, CRUD board/folder

### P1 — Schedule vs due

- [ ] `@repo/api/todex` + API: `scheduleDate` on write; list-by-range XOR `boardId`; e2e due ≠ schedule
- [ ] `todexClient` schedule list
- [ ] Today/Tomorrow use `scheduleDate`; Sheet Schedule vs Due; quick create on schedule sets `scheduleDate` only
- [ ] Verify: manual date semantics + API tests

### P2 — Board views

- [ ] Kanban + list + single-list; settings `DropdownMenu`; localStorage prefs; `@dnd-kit` status-only; quick create; in-view search
- [ ] Schedule views reuse the same view modes
- [ ] Verify: switch views, DnD status, refetch order may shuffle (ok)

### P3 — Task detail

- [ ] `taskKey` URL sync
- [ ] TipTap bubble menu; sanitize description on API
- [ ] Verify: XSS e2e; deep link opens Sheet

### P4 — Labels + emoji (last)

- [ ] Drizzle `labels` / `task_labels`; migrate
- [ ] Labels module + DTO `labels` / `labelIds`; Sheet attach UI
- [ ] Folder/board emoji `Input`
- [ ] Verify: labels e2e; emoji shows in sidebar when expanded
