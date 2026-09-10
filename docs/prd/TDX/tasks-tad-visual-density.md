# Tasks — TAD visual density (shadcn)

| Field           | Value                                                                 |
| --------------- | --------------------------------------------------------------------- |
| Status          | Draft                                                                 |
| Scope           | TDX                                                                   |
| Apps / packages | `apps/todex-web`, `@repo/ui`                                          |
| Created         | 2026-09-10                                                            |

## Problem

`docs/prd/TDX/tasks-page-tad-parity.md` shipped TAD **behavior** (routes, schedule vs due, kanban/list, Sheet, TipTap). Todex still **looks like a prototype**: skinny list rows, skinny kanban cards, stacked form Sheet, raw search `<input>`, no command palette.

Users coming from Take & Do expect TAD **density** (grid rows, card meta, dual-pane task dialog, jump-to-task search) without a chrome clone.

This PRD **does not reopen P0–P4 product scope**. Labels/emoji stay P4 in tad-parity. No `apps/take-and-do` imports.

## Goals

- List rows match TAD grid density: checkbox, expand, inline priority, key + summary, schedule cell.
- Kanban cards match TAD card density: priority, key, summary, schedule, estimate. `DragOverlay` while dragging.
- Task detail is a **centered dual-pane overlay dialog** (TAD TaskView layout), composed from `@repo/ui` `Dialog` + existing TipTap — not a Sheet form stack.
- Header search is **⌘K / Ctrl+K Command** over boards, schedules, and tasks (loaded / fetched board lists). In-view title filter is removed.
- New primitives live in `@repo/ui` (Command, Popover). No TAD `*.ui.tsx` copy.

## Non-goals

- Labels, emoji, Lightning, BoardHealth, Inbox, unique board names, global full-text API.
- Copying `TaskView.ui.tsx`, `ListBoard.ui.tsx`, `TaskCard`, Lexical, Themes, sidebar DnD.
- Docked right pane from `design-todex-tasks-premium-bw.png` (TAD is a **modal overlay**, not docked).
- `react-day-picker` calendar widget — schedule/due stay `input type="date"` inside Popover/Dropdown.
- Persisted column rank / intra-column order.

## User stories

### Jump to a task from the header (Slice A)

**As a** user, **I want** ⌘K to search boards and tasks, **so that** I can open a task without scanning the current view.

**Acceptance criteria**

- [ ] Header has a search control that opens Command; shortcut ⌘K / Ctrl+K; Escape closes.
- [ ] Results: Today, Tomorrow, each board, tasks from `GET /v1/tasks?boardId=` for all boards (TanStack Query; reuse `['tasks', boardId]`).
- [ ] Choosing a board/schedule navigates; choosing a task navigates to `.../board/{name}/{taskKey}` (or schedule URL if currently on that schedule and the task is in the loaded schedule set — otherwise its board URL).
- [ ] Empty query shows groups; no matches shows Command empty state.
- [ ] In-view `search` filter on the list/kanban is gone.

### Scan a board like TAD (Slice B)

**As a** user, **I want** dense rows and cards with schedule and priority, **so that** I triage without opening every task.

**Acceptance criteria**

- [ ] List row CSS grid (TAD-like): checkbox | expand (if children) | priority | summary+key | schedule. Indent still via padding for nested rows.
- [ ] Priority dropdown patches `priority` optimistically.
- [ ] Schedule cell shows Today / Tomorrow / short date / empty; date input + Clear; patches `scheduleDate` (not `dueDate`).
- [ ] Expand toggles nested children; default expanded.
- [ ] Kanban card: priority dot, `taskKey`, summary, schedule, estimate; checkbox to toggle done.
- [ ] Drag uses `@dnd-kit` `DragOverlay`; source card `opacity-0` (not translated out of overflow).
- [ ] Label chips: **no UI** (slot not rendered). P4 later.

### Edit a task in a TAD-like dialog (Slice C)

**As a** user, **I want** a dual-pane overlay, **so that** writing the description is separate from metadata.

**Acceptance criteria**

- [ ] Selecting a task opens `@repo/ui` `Dialog` overlay (max width ~960px, min height ~70vh), not `Sheet`.
- [ ] Left: title input, TipTap description, child tasks (click opens that task).
- [ ] Right (~16rem): status, priority, schedule, due, estimate, parent — patch-on-change (optimistic where already used for status).
- [ ] Save persists **summary + description** only. Delete via `ConfirmDialog`.
- [ ] Overlay click and Escape close (existing Dialog behavior). URL `taskKey` unchanged.

## Functional requirements

**Slice A**

1. Add `cmdk` Command primitives to `@repo/ui`. Add Radix Popover (used in B).
2. Replace header `SearchField` with Command dialog + trigger showing ⌘K.
3. Remove `search` / `setSearch` from `TasksProvider` list filtering.

**Slice B**

4. Rewrite `TaskRow` to TAD grid; inline priority + schedule.
5. Rewrite kanban card density; `DragOverlay` in `TaskList` `DndContext`.
6. `DraggableTask` must not apply translate transform (overlay follows cursor).

**Slice C**

7. Replace `Sheet` task editor with `Dialog` dual-pane layout.
8. Metadata fields patch independently; Save = summary + description.

## Technical requirements

### Architecture

- **Apps / packages:** `apps/todex-web`, `@repo/ui`. No API/schema changes.
- **Reuse:** `TasksProvider`, `todexClient.tasks.list`, `task-helpers` date ISO helpers, `TaskDescriptionEditor`, `@repo/ui` Dialog / DropdownMenu / Input / Checkbox / Button.
- **New modules:**
  - `@repo/ui` `components/ui/command.tsx`, `components/ui/popover.tsx`
  - `apps/todex-web/src/app/tasks/task-command.tsx`
  - helpers: `formatScheduleLabel` in `task-helpers.ts`
- **Import boundaries:** no `apps/take-and-do`. TAD is layout spec only.

### Data layer

- **Schema / migration:** none.
- **Queries:** Command enables `['tasks', boardId]` for every board while open. Writes still PATCH task.

### API & contracts

- **N/A** — existing create/update/list.

### Frontend

- **Routes:** unchanged.
- **State:** TanStack Query; optimistic PATCH for status/priority/scheduleDate.
- **Styling:** Tailwind + `cn()`. Row indent `style={{ paddingLeft }}` only (existing). Dialog `maxWidth` already uses runtime style in `@repo/ui` Dialog.
- **Shortcuts:** `metaKey|ctrlKey + k` on `window`, ignore when focus is in TipTap/`contenteditable`/input (except the Command input).

### Auth & permissions

- Unchanged WorkspaceGuard.

### Error handling & edge cases

- Command: board fetch failure → toast, still show other boards.
- Missing `taskKey` deep link: unchanged (Sheet/Dialog closed).
- Clearing schedule removes from Today/Tomorrow after refetch.
- Nested row: only roots are kanban cards (unchanged).

### Testing

- **Unit:** `formatScheduleLabel` (today / tomorrow / other / null).
- **E2E:** none required.
- **Manual:** ⌘K jump; list priority/schedule; kanban drag overlay; dialog save vs metadata patch.

### Deployment & ops

- **Env vars:** none.
- **Deps:** `cmdk`, `@radix-ui/react-popover` on `@repo/ui`.
- **Rollout:** web-only.

## UX / UI

```
AppNavRail | Tasks sidebar | Main (header: breadcrumbs, ⌘K, settings, Create Task)
                             List grid / Kanban cards
           Dialog overlay: [ title + TipTap | metadata ]
```

- Command: groups Navigation / Boards / Tasks.
- List min width ~560px with horizontal scroll if needed (TAD `min-w-[560px]`).
- Kanban columns stay 3-col grid.

## Dependencies & risks

- cmdk + TipTap both in the page — Command is small; TipTap stays `next/dynamic`.
- Fetching all boards’ tasks on palette open can be N requests — acceptable for v0 workspace size; reuse query cache.
- Dual-pane Dialog vs tad-parity “keep Sheet”: **this PRD supersedes that chrome choice**.

## Open questions

- [x] Labels on rows — **deferred to tad-parity P4**.
- [x] Overlay vs docked — **overlay (TAD TaskView)**.
- [x] ⌘K corpus — **all boards’ tasks via existing list-by-board + nav items**.

## Success criteria

- Slice A: ⌘K opens Command; selecting a task changes the URL and opens the editor.
- Slice B: list shows schedule + priority without opening the task; drag shows overlay.
- Slice C: editor is dual-pane Dialog; metadata saves without clicking Save; title/description still need Save.
- No take-and-do imports; lint/tests for touched packages.

## Implementation checklist

Execute **in order**. Each slice is usable alone.

### Slice A — Command + header

- [ ] `@repo/ui` Command (+ Popover for B)
- [ ] `task-command.tsx`; wire header; ⌘K
- [ ] Remove in-view search filter
- [ ] Verify: shortcut, jump to board/task

### Slice B — Rows / cards / DnD overlay

- [ ] Grid `TaskRow` + schedule/priority patches
- [ ] Kanban card meta; `DragOverlay`; stop translating source
- [ ] `formatScheduleLabel` unit tests
- [ ] Verify: inline edits, drag preview

### Slice C — Dual-pane Dialog

- [ ] Replace Sheet with Dialog dual-pane
- [ ] Patch-on-change metadata; Save = summary + description
- [ ] Child task list on the left
- [ ] Verify: overlay close, URL taskKey, XSS editor unchanged
