# Planning, Knowledge, and Goals

| Field           | Value                                      |
| --------------- | ------------------------------------------ |
| Status          | Draft                                      |
| Scope           | TDX                                        |
| Apps / packages | `apps/todex-web`, `apps/todex-api`, `@repo/api/todex` |
| Created         | 2026-10-26                                 |

## Problem

Todex navigation treats Goals as a Docs document type. Planning (today labeled Tasks) owns spaces, tasks, and epics, while Goals — the thing those tasks are for — live under Docs next to general documents. The rail labels (Tasks, Docs) do not match the product split: Planning for goals and actionable work, Knowledge for documents, Calendar for scheduling.

## Goals

- The rail reads Overview, Planning, Calendar, Knowledge. Planning still opens `/tasks`. Knowledge still opens `/docs`.
- Goals are created, listed, and edited under Planning. Knowledge no longer lists or creates them.
- Existing goal rows, their prose, criteria, preconditions, and `doc_tasks` links still load.
- A goal shows title, description, status, deadline, derived progress, linked tasks, and the epics of those tasks.
- Knowledge has a Templates entry that only explains templates are not available yet.
- `/docs/goals` and `/docs/:id` for a goal still land on the Planning goal screen.

## Non-goals

- Renaming `/tasks` or `/docs` to `/planning` or `/knowledge`.
- A `goals` table, a goal↔epic join table, or any SQL migration.
- Stored progress. Progress is computed from linked task statuses.
- Explicit epic links. An epic appears because a linked task has `tasks.epicId`.
- Goal templates, document template types, or template CRUD.
- Changing mention tokens (`@docs`, `@tasks`). A goal mention may still resolve through `/docs/:id`, which redirects.
- Rewriting historical PRDs (`docs/prd/TDX/prd.md`, `data-model.md`, `ui.md`).
- Moving `planningProgress` out of `apps/todex-api`.

## User stories

### Planning and Knowledge labels

**As a** workspace member, **I want** the main nav to say Planning and Knowledge, **so that** scheduling, documents, and actionable work are separate.

**Acceptance criteria**

- [ ] Rail order stays Overview, Planning, Calendar, Knowledge.
- [ ] Planning highlights for `/tasks` and any `/tasks/...` path, including `/tasks/goals`.
- [ ] Knowledge highlights for `/docs` and any `/docs/...` path.
- [ ] Calendar, Overview, and Execution behavior is unchanged.
- [ ] Planning uses the layout-list icon (two stacked rounded squares and lines). Knowledge uses an open-book icon. Both match the existing 24px stroke icons in `apps/todex-web/src/components/icons.tsx`.

### Goals live in Planning

**As a** workspace member, **I want** Goals in the Planning sidebar, **so that** I manage goals next to spaces and tasks.

**Acceptance criteria**

- [ ] Planning sidebar Views include Goals after Tomorrow, with the concentric-target icon.
- [ ] Goals is active on `/tasks/goals` and `/tasks/goals/:goalId`.
- [ ] Inbox, Today, Tomorrow, and Spaces behave as they do today.
- [ ] The Knowledge sidebar has no Goals row.
- [ ] Knowledge All, General, folders, Quick Access, and Recently Updated show only `type === "common"`.
- [ ] Knowledge New creates a common doc only and still opens `/docs/:id`.

### Goal list and editor

**As a** workspace member, **I want** a goal screen with status, deadline, progress, and links to tasks and epics, **so that** I can see whether the goal is on track and open the related work.

**Acceptance criteria**

- [ ] `/tasks/goals` lists goals for the current workspace, newest `updatedAt` first.
- [ ] Each row shows title, status, deadline (or an empty deadline), and `progressPercent`.
- [ ] Empty list copy is "No goals yet." Search with no matches uses the existing docs search empty copy, "Nothing matches this search."
- [ ] New creates a goal titled "Untitled" with default body and opens `/tasks/goals/:goalId`.
- [ ] Detail edits title, description (stored as `body.why`), success criteria, preconditions, status, deadline, and linked tasks.
- [ ] Description uses the existing prose editor (`ProseSection` in `doc-editor.tsx`).
- [ ] Progress is read-only: `completed/total · percent%`. No linked tasks shows `0/0 · 0%`.
- [ ] Completed means `TaskStatus.DONE` only. `cancelled` is not completed. Same formula as `planningProgress` in `apps/todex-api/src/modules/epics/progress.ts`.
- [ ] Each linked task links to `tasksUrlHelper.routing.buildBoardUrl(spaceName, taskKey)`.
- [ ] Related epics are the distinct `epicId`s on those tasks. Each links via `tasksUrlHelper.routing.buildEpicUrl(spaceName, epicId)`. Tasks with no epic are omitted. Duplicate epics appear once.
- [ ] Delete still confirms, deletes the doc, and returns to `/tasks/goals`.
- [ ] The task detail goal picker and execution "Goal" link open `/tasks/goals/:goalId`.

### Knowledge templates placeholder

**As a** workspace member, **I want** a Templates place in Knowledge, **so that** document templates have a home later without mixing them with goals.

**Acceptance criteria**

- [ ] Knowledge sidebar has Templates under the view links, href `/docs/templates`.
- [ ] The page breadcrumb is Knowledge › Templates.
- [ ] The only content is the sentence "Document templates are not available yet."
- [ ] There is no create action, no template type, and no API.

### Existing goals keep working

**As a** workspace member, **I want** goals I already wrote to open in Planning, **so that** nothing is dropped in the move.

**Acceptance criteria**

- [ ] A goal saved before this change opens with its title, why, criteria, preconditions, and linked tasks.
- [ ] Missing `status` reads as `active`. Missing `deadline` reads as null.
- [ ] `folderId` on a goal is left as stored and is not shown in Knowledge or Planning.
- [ ] `/docs/goals` redirects to `/tasks/goals`.
- [ ] Opening `/docs/:id` when that doc is a goal redirects to `/tasks/goals/:id`.
- [ ] Opening `/docs/:id` for a common doc still opens the document editor.

## Functional requirements

1. Rail labels are Planning (`/tasks`) and Knowledge (`/docs`). Tooltips use those labels.
2. User-visible module names change in: rail, Planning page titles/breadcrumbs that say the module name, Knowledge breadcrumbs (today "Docs"), overview chapter "Recent Docs", and the execution goal href. Do not rename task-list section labels ("Tasks", "Done", "Cancelled") or the `@tasks` / `@docs` mention tokens. The mention menu label for docs becomes "Knowledge".
3. Overview "Recent Docs" becomes "Knowledge", still lists the eight most recently updated common docs, and links to `/docs` and `/docs/:id`. Goals are excluded.
4. Knowledge list surfaces (`page.tsx` Quick Access and Recently Updated, `general/page.tsx`, `folder/[folderId]/page.tsx`, `doc-collection.tsx` rows) exclude `DocType.GOAL`. Remove the Goals quick-access card. General remains.
5. `DocsCanvasHeader` New menu has "New doc" only.
6. Planning sidebar gains a Goals nav row. Goal list and detail render as `children` of `apps/todex-web/src/app/tasks/layout.tsx` (sidebar + `TaskView` stay mounted). `/tasks/goals` must not be parsed as a space or task key.
7. Goal create from Planning calls `POST /v1/docs` with `{ type: "goal", title: "Untitled" }` and routes to `/tasks/goals/:id`. `docs-provider` create, if invoked with `DocType.GOAL`, uses that same path instead of `/docs/:id`.
8. Goal detail is the current goal editor moved onto the Planning route: title, description, success criteria, preconditions, linked tasks, plus status, deadline, progress, and derived epics.
9. Status values are `active`, `paused`, `done`, displayed as Active, Paused, Done. Default `active`.
10. Deadline is a calendar date `YYYY-MM-DD` or null. Clearing the input saves null.
11. Saving status or deadline updates `docs.body` through the existing `PATCH /v1/docs/:id`. No new endpoint.
12. Linking and unlinking tasks keeps using `linkedTaskIds` on that same PATCH. A task can still set `goalId` from the task view.
13. Knowledge Templates is a static empty page. It is not a folder and not a doc type.
14. `/docs/goals` redirects to `/tasks/goals` (`permanent: false` in `apps/todex-web/next.config.ts`). `/docs/:goalId` redirects in the doc page after the doc is loaded, because the type is not known from the URL.

## Technical requirements

### Architecture

- **Apps / packages:** `apps/todex-web`, `apps/todex-api`, `packages/api/src/todex`. Apps must not import each other. Shared Zod and the `GoalStatus` const live in `@repo/api/todex`.
- **Reuse (required):**
  - Goal storage: `docs` + `doc_tasks` (`apps/todex-api/src/db/schema.ts`). `DocsService` create/get/update/remove (`apps/todex-api/src/modules/docs/docs.service.ts`).
  - Contracts: `GoalDocBodySchema`, `readGoalDocBody`, `DocSchema` (`packages/api/src/todex/doc.ts`).
  - Editor sections: `GoalSections`, `ProseSection`, `CriteriaSection`, `TaskLinkSelect` in `apps/todex-web/src/app/docs/doc-editor.tsx`. Move the goal-only pieces into `apps/todex-web/src/app/tasks/goals/` and import them from the Planning goal page. Leave the common-doc editor on `/docs/[docId]`.
  - List chrome: `DocsCanvasHeader` / `DocRows` patterns (breadcrumb, search, row). Goal pages may copy that structure under Planning; they should not mount `DocsProvider` unless the search state is still needed. Prefer a local query for `todexClient.docs.list({ type: "goal" })`.
  - Task and epic URLs: `tasksUrlHelper.routing.buildBoardUrl` and `buildEpicUrl` (`apps/todex-web/src/helpers/tasks-url.helper.ts`).
  - Progress math: same as `planningProgress` (done count / length, `Math.round`, 0 when empty). Implement a local helper next to the goal view. Do not import `apps/todex-api`.
  - Sidebar frame: `TasksModuleSidebar` (`apps/todex-web/src/app/tasks/module-sidebar.tsx`).
- **New modules:**
  - `apps/todex-web/src/app/tasks/goals/page.tsx` — list.
  - `apps/todex-web/src/app/tasks/goals/[goalId]/page.tsx` — detail.
  - `apps/todex-web/src/app/docs/templates/page.tsx` — static empty state.
  - `GoalStatus` in `packages/api/src/todex/enums.ts`, re-exported from `packages/api/src/todex/index.ts`.
  - `PlanningIcon`, `KnowledgeIcon`, and `GoalIcon` in `apps/todex-web/src/components/icons.tsx`.
- **Import boundaries:** Web imports types from `@repo/api/todex` only. API maps rows with `readGoalDocBody`. No new Nest module.

### Data layer

- **Schema changes:** none. `doc_type` stays `common | goal`.
- **Migration:** none. No backfill. `readGoalDocBody` supplies defaults when `status` or `deadline` is absent.
- **Queries / persistence:**
  - Goal body remains jsonb on `docs.body`:

    ```ts
    {
      why: ProseDoc
      successCriteria: AcceptanceCriteria
      preconditions: AcceptanceCriteria
      status: "active" | "paused" | "done"
      deadline: string | null // YYYY-MM-DD
    }
    ```

  - `GoalDocBodySchema` stays `.strict()`. `emptyGoalDocBody` sets `status: "active"` and `deadline: null`.
  - `readGoalDocBody` parses `status` only if it is one of the three values; otherwise `active`. `deadline` only if it matches `YYYY-MM-DD`; otherwise null. Existing why/criteria/preconditions behavior stays.
  - List summaries need the new fields without sending prose to the client. Extend `DocSummarySchema` with:
    - `goalStatus: GoalStatus | null`
    - `goalDeadline: string | null`
    - `progressPercent: number | null` (integer 0–100)
    - Common docs: all three `null`.
    - Goals: `goalStatus` and `progressPercent` always set; `goalDeadline` nullable.
  - `DocsService.list`: select `body` in the query, map status/deadline from it, do not put `body` on the summary. For goal ids in that page of rows, one follow-up query joining `doc_tasks` to `tasks.status`, grouped by `docId`, then `planningProgress`. Common-only lists skip that follow-up when no goal rows are present.
  - Writes stay on `PATCH /v1/docs/:id` with `body.status` / `body.deadline`. `UpdateGoalDocBodySchema` accepts both as optional. `folderId` is unchanged and not cleared.

### API & contracts

- **Endpoints:** no new routes.
  - `GET /v1/docs?type=goal` returns summaries including `goalStatus`, `goalDeadline`, `progressPercent`.
  - `GET /v1/docs/:id` returns `GoalDoc` whose `body` includes `status` and `deadline`.
  - `POST /v1/docs` and `PATCH /v1/docs/:id` accept the extended goal body. Auth stays the current workspace guard.
- **Shared types:** `GoalStatus`, updated `GoalDocBody`, `UpdateGoalDocBody`, `DocSummary` in `packages/api/src/todex`.
- **Validation:** Zod at the existing docs controller boundary. Reject a goal `status` outside the enum and a `deadline` that is not `YYYY-MM-DD` or null. Reject goal fields on a common doc (already covered by the strict common body).
- **Agent tools:** `apps/todex-api/src/modules/agent/tools/doc-tool-handler.ts` copy should say goals are Planning goals stored as `type: "goal"`, not Knowledge docs. Tool names, arguments, and the `why` write path stay. Status and deadline do not need new tool args in this iteration.

### Frontend

- **Routes / pages:**
  - `/tasks/goals`, `/tasks/goals/[goalId]` inside the tasks layout.
  - `/docs/templates`.
  - `/docs`, `/docs/general`, `/docs/folder/:folderId`, `/docs/:docId` remain. The doc page redirects when `doc.type === "goal"`.
  - `next.config.ts` redirect: `/docs/goals` → `/tasks/goals`, `permanent: false`.
- **Components:**
  - `AppNavRail` `NAV` labels and icons.
  - `TasksModuleSidebar` Goals row. Active when `pathname === "/tasks/goals"` or `pathname.startsWith("/tasks/goals/")`.
  - `DocsModuleSidebar`: remove Goals; add Templates (`active` on `/docs/templates`). Point doc icons at `KnowledgeIcon`.
  - Goal list: title, status, deadline, progress. Row href `/tasks/goals/${id}`. Header breadcrumb `Planning › Goals`. Search filters by title (case-insensitive substring), local state, same input classes as `DocsCanvasHeader`.
  - Goal detail breadcrumb `Planning › Goals › {title}`. Status is a select. Deadline is a date input. Progress text is not an input. Linked task rows are links. Related epics are a separate list under linked tasks; empty when none of the linked tasks have an epic.
  - `doc-editor.tsx` renders only common docs. Goal branch moves out.
- **State & data fetching:** `@tanstack/react-query` keys `["docs", { type: "goal" }]` for the list and `["docs", goalId]` for detail, matching `todexClient.docs`. Invalidate `["docs"]` on create, update, and delete (the task view already does this when `goalId` changes). Workspace tasks for the link picker stay on the existing `["tasks", "workspace"]` query used by `GoalSections`. Epic name and space name come from those tasks (`epicId` plus the space fields already on `Task`). Do not add a goals provider.
- **Styling:** Tailwind on the JSX, `@repo/ui` `Button`, `cn`. No new visual system. Match `docs-sidebar` link classes and `doc-editor` section type.

### Auth & permissions

Workspace membership already enforced by the docs and tasks controllers. No new role checks. Templates is a static page behind the same app shell.

### Error handling & edge cases

- Create or save failure uses the existing toast pattern (`Could not create the doc` / the doc editor's current update error). Leave the draft in place on a failed save.
- `GET /v1/docs/:id` 404 on the goal page shows the same not-found state the doc editor uses today.
- A linked task id that no longer exists is omitted from the list (current `GoalSections` behavior).
- A linked task whose epic or space cannot be resolved is omitted from the epic list and still shows as a task row.
- Goal `folderId` is not displayed and is not wiped.
- Knowledge search must not reveal goals.
- `readGoalDocBody` never throws on a legacy body.

### Testing

- **Unit / integration:**
  - `readGoalDocBody` / `GoalDocBodySchema`: legacy body without status/deadline; invalid status and deadline fall back; valid values round-trip. Extend `apps/todex-api/src/modules/docs/prose.test.ts` or the doc schema tests next to it.
  - `DocsService.list` with `type=goal` returns `goalStatus`, `goalDeadline`, and `progressPercent` from linked task statuses. Common summaries keep the three fields null. Update the docs service tests.
  - `doc-tool-handler.test.ts` still writes goal content into `why`.
  - Web: goal progress helper (0 tasks, all done, mixed, cancelled not counted). Mention tests stay green with the menu label change (`apps/todex-web/src/app/tasks/editor-mentions.test.ts`).
- **E2E:** none.
- **Manual checks:** rail labels and icons; create a goal under Planning; set status and deadline; link a task that belongs to an epic and open both links; confirm an old goal still shows why/criteria/preconditions; Knowledge All/folder/search hide goals; `/docs/goals` and `/docs/:goalId` redirect; Templates empty state; task-view goal picker and execution goal link land on Planning.

### Deployment & ops

- **Env vars:** none.
- **Scripts / commands:** none. No `db:migrate`.
- **Rollout notes:** ship `@repo/api/todex`, `todex-api`, and `todex-web` together. `DocSummary` gains three nullable fields; older web builds would fail the response parse. Redirects are temporary (`permanent: false`).

## UX / UI

Planning sidebar Views: Inbox, Today, Tomorrow, Goals. Spaces stay below.

Goal list rows are text rows, not cards. Status and deadline sit on the row; progress is the percent only.

Goal detail order: title, status + deadline + progress, Description, Success criteria, Preconditions, Linked tasks, Related epics, Delete. Description is the current "Why" section with the label changed. Do not add a second prose field.

Icons, 24 viewBox, stroke 1.75, `currentColor`, same `iconSvgProps` helper:

- Planning (rail): layout-list — two rounded squares stacked on the left, two lines on the right.
- Knowledge (rail and Knowledge doc links): open book.
- Goals (Planning sidebar only): concentric target.

Templates: sidebar link plus one muted sentence. No illustration and no button.

## Dependencies & risks

- Goal list progress depends on the extra `doc_tasks` join in `DocsService.list`. Skip it when the result has no goals so Knowledge `type=common` stays one query.
- `DocSummary` is a flat object for both types. Nullable goal fields keep a single schema. Do not split a second response schema in this iteration.
- Tasks layout always mounts `TaskView`. Goal routes must not match `parseSpacePath` or `getTaskKeyFromPathname`. `/tasks/goals` is a static segment beside `space` and `schedule`, so it does not collide; add a test or a guard if a later pathname helper treats the second segment as a task key.
- Derived epics change when a task's `epicId` changes. That is intended. There is no separate epic membership to migrate.

## Open questions

- None.

## Success criteria

- A member can open Planning, create a goal, set status and deadline, link a task, see progress, and open that task and its epic without leaving the Planning shell.
- Knowledge shows only common documents plus an empty Templates page.
- A goal created before the change opens with its previous content, status Active, and no deadline.
- `/tasks`, `/docs`, and `/docs/:commonDocId` still work. `/docs/goals` and `/docs/:goalId` open the Planning goal UI.

## Implementation checklist

- [ ] Add `GoalStatus` and extend `GoalDocBody`, update schemas, `emptyGoalDocBody`, and `readGoalDocBody` in `packages/api/src/todex`.
- [ ] Extend `DocSummary` and `DocsService.list` with `goalStatus`, `goalDeadline`, and `progressPercent`. Keep PATCH on the existing docs endpoint.
- [ ] Update agent tool descriptions only. Adjust API unit tests (`prose.test.ts`, docs service, `doc-tool-handler.test.ts`).
- [ ] Add Planning, Knowledge, and Goal icons. Update `AppNavRail`, Knowledge breadcrumbs, overview Knowledge section, and the mention menu label.
- [ ] Add the Goals row to `TasksModuleSidebar`. Add `/tasks/goals` and `/tasks/goals/[goalId]` using the existing goal editor sections, plus status, deadline, progress, task links, and derived epic links.
- [ ] Remove Goals from Knowledge sidebar, quick access, New menu, and all Knowledge lists. Redirect `/docs/goals` and goal `/docs/:id`. Point `docs-provider` goal create and execution/task goal hrefs at `/tasks/goals/:id`.
- [ ] Add `/docs/templates` empty page and sidebar link.
- [ ] Run the touched package tests (`@repo/api` todex tests if present, `todex-api` docs tests, `todex-web` editor-mentions and any new progress helper test).
