# Spaces, Sections, Projects, and Epics

| Field           | Value                                                 |
| --------------- | ----------------------------------------------------- |
| Status          | Draft                                                 |
| Scope           | TDX                                                   |
| Apps / packages | `apps/todex-api`, `apps/todex-web`, `@repo/api/todex` |
| Created         | 2026-10-24                                            |

## Problem

Todex tasks live on a board, inside an area. The product already calls boards Spaces in the sidebar, but the database, API, and URLs still say board. There is no way to group tasks into a deliverable (Project) or a body of related work inside that deliverable (Epic). Goals are documents, and `parentTaskId` is subtask decomposition. Neither is a planning container.

## Goals

- The persisted and public name for a task container is Space. Area is Section. Existing rows keep their ids.
- A user can create a Project inside a Space and an Epic inside a Project, and can attach tasks to either without leaving the existing section, schedule, goal, or execution flows.
- Deleting a Project or Epic never deletes tasks. Section changes never change Project or Epic links.

## Non-goals

- Milestones, nested Projects or Epics, Project/Epic dependencies, Gantt charts, roadmap views.
- Changes to Goal docs, `doc_tasks`, or the execution interval engine.
- Renaming Folders, progress-stage templates, or React layout components that use "Section" as page chrome (`OverviewSections`, `SidebarSection`, `HubTaskSection`).
- Dual-running `board` and `area` API fields. In-flight agent tool arguments stored as JSON are not backfilled.
- A workspace-members product beyond the owner picker this feature needs.

## User stories

### Rename the work container

**As a** user, **I want** boards and areas to be Spaces and Sections everywhere I look, **so that** the data model matches the product language.

**Acceptance criteria**

- [ ] Existing `task_boards` rows are the same `spaces` rows (same ids, names, folders, emoji).
- [ ] Existing area rows are the same section rows, including the General default, and tasks still point at them.
- [ ] `/tasks/board/...` redirects to `/tasks/space/...`.
- [ ] API responses no longer contain `boardId`, `taskBoardId`, `areaId`, `areas`, or `boardName`.

### Create a project

**As a** user, **I want** to create a Project inside a Space, **so that** I can track a concrete deliverable separately from sections.

**Acceptance criteria**

- [ ] A Project requires a name and belongs to exactly one Space.
- [ ] Description, status, target date, and owner are optional. Status defaults to `planned`.
- [ ] A new Space has no Projects.
- [ ] The Space view lists Projects with progress, and supports create, edit, and delete.

### Create an epic and assign tasks

**As a** user, **I want** to put tasks on a Project or on an Epic inside that Project, **so that** related work stays grouped without becoming subtasks.

**Acceptance criteria**

- [ ] An Epic belongs to exactly one Project.
- [ ] A task may have no Project and no Epic.
- [ ] Choosing an Epic sets the task's Project to that Epic's Project.
- [ ] Changing Project clears an Epic that is not in the new Project. Clearing Project clears Epic.
- [ ] Moving a task between Sections does not change `projectId` or `epicId`.
- [ ] A task, Project, and Epic in different Spaces cannot be linked.

### See progress and delete safely

**As a** user, **I want** progress from task completion and deletion that leaves my tasks in place, **so that** planning metadata is not the source of truth for execution.

**Acceptance criteria**

- [ ] Progress is `done` tasks divided by all assigned tasks, as an integer 0–100. An empty Project or Epic is 0.
- [ ] `cancelled` tasks count in the total and not in the completed count.
- [ ] Project progress includes tasks assigned directly to the Project and tasks assigned to its Epics. Each task is counted once.
- [ ] Deleting a Project deletes its Epics and clears `projectId` and `epicId` on affected tasks. The tasks remain.
- [ ] Deleting an Epic clears `epicId` and leaves `projectId` and the tasks.
- [ ] Deleting a non-default Section still moves its tasks to General and does not clear Project or Epic.
- [ ] The General section still cannot be deleted.

## Functional requirements

1. Hierarchy is Workspace → Space → Section, and Workspace → Space → Project → Epic. A task has exactly one Space and exactly one Section. Project and Epic are optional. A task may have a Section and a Project or Epic at the same time.
2. Section and Project/Epic are independent. Section move does not write `projectId` or `epicId`.
3. Assigning `epicId` sets `projectId` to that epic's project. The epic's project must be on the task's Space.
4. A `projectId` that does not own the current epic clears `epicId`. `projectId: null` clears `epicId`.
5. Cross-Space assignment is rejected with the same `ForbiddenException` used today when a board is outside the workspace.
6. Project and Epic status is `planned | in_progress | completed | canceled`. This is not task status. Task completion for progress is task status `done` only.
7. Project and Epic names are required, trimmed, 1–80 characters, unique per parent ignoring case (same rule sections use today).
8. Description defaults to `""`. Target date is an optional ISO timestamp. Owner is an optional workspace member user id.
9. Progress is derived on read and not stored. Direct tasks of a Project are those with that `projectId` and `epicId` null.
10. Deleting a Space still deletes its tasks (current board delete behavior). Deleting a Project or Epic must not.
11. Scheduling, recurrence, goals, execution queue, and execution sessions keep their current behavior aside from renamed fields.
12. Do not create default Projects or Epics. Keep creating the General section when a Space is created.

## Technical requirements

### Architecture

- **Apps / packages:** `apps/todex-api`, `apps/todex-web`, `packages/api/src/todex`.
- **Reuse (required):**
  - `apps/todex-api/src/modules/boards/boards.service.ts` — section CRUD, default-section reassignment, `WorkspaceGuard`, `zodPipe`. Move this module to `modules/spaces/` and rename types; do not rewrite the ordering logic.
  - `apps/todex-api/src/modules/tasks/task-placement.ts` — section placement on create/move. Extend it; keep section changes from touching project/epic.
  - `apps/todex-api/src/modules/tasks/tasks.service.ts` — create/update/list. Add project/epic resolution here.
  - `apps/todex-web/src/app/tasks/tasks-provider.tsx`, `task-view.tsx` (goal `<Select>`), `module-sidebar.tsx`, `space-dialogs.tsx`, `components/create-menu.tsx`, `lib/todex-client.ts`.
  - `apps/todex-web/src/helpers/tasks-url.helper.ts` — path parsing. Reserve the `projects` segment so it is not a task key.
- **New modules:**
  - `packages/api/src/todex/section.ts` (replaces `area.ts`), `space.ts` (replaces `board.ts`), `project.ts`, `epic.ts`.
  - `apps/todex-api/src/modules/spaces/` (replaces `modules/boards/`).
  - `apps/todex-api/src/modules/projects/projects.service.ts`, `projects.controller.ts`, `projects.module.ts`. Epics live in this module. Register `ProjectsModule` in `app.module.ts`.
  - `apps/todex-api/src/modules/projects/task-project-link.ts` — pure function for rules 3–4. Unit test it the way `task-placement.ts` is tested.
  - `apps/todex-api/src/modules/projects/progress.ts` — pure `completedTasks / totalTasks` function.
  - Web: `apps/todex-web/src/app/tasks/space/[...spacePath]/page.tsx` replaces `tasks/board/[...boardPath]/page.tsx`. Project and epic views are branches of that path, not a second task renderer.
- **Import boundaries:** Zod contracts only in `@repo/api/todex`. Apps do not import each other. No new package.

### Data layer

- **Schema changes:** two new migrations after `0024_conversation_title`. Do not edit applied SQL. Preserve ids with `RENAME`, not drop-and-recreate.
- **Migration `0025_spaces_and_sections.sql`:**
  - `task_boards` → `spaces`. Columns stay `id`, `workspace_id`, `folder_id`, `name`, `emoji`, `created_at`, `updated_at`.
  - `tasks.task_board_id` → `tasks.space_id`, still `NOT NULL`, `ON DELETE CASCADE` from `spaces`.
  - `board_areas` → `space_sections`. `board_id` → `space_id`. Unique indexes for `(space_id, position)`, `(space_id, lower(name))`, and one default per space stay.
  - `tasks.area_id` → `tasks.section_id`, still `NOT NULL`, `ON DELETE RESTRICT`.
  - `board_progress_stages` → `space_progress_stages`. `board_id` → `space_id`.
  - Rename indexes and foreign-key constraints to match. No data copy. General rows stay General.
- **Migration `0026_projects_and_epics.sql`:**
  - Enum `planning_status`: `planned`, `in_progress`, `completed`, `canceled`.
  - `projects`: `id` text PK, `space_id` → `spaces.id` `ON DELETE CASCADE`, `name` text not null, `description` text not null default `''`, `status` not null default `planned`, `target_date` timestamp null, `owner_user_id` text null → `user.id` `ON DELETE SET NULL`, `created_at`, `updated_at`. Unique `(space_id, lower(name))`. Index `space_id`.
  - `epics`: same columns with `project_id` → `projects.id` `ON DELETE CASCADE`. Unique `(project_id, lower(name))`. Index `project_id`.
  - `tasks.project_id` nullable → `projects.id` `ON DELETE SET NULL`. `tasks.epic_id` nullable → `epics.id` `ON DELETE SET NULL`. Indexes on both.
  - No backfill. No seed projects.
- **Queries / persistence:** Drizzle definitions in `apps/todex-api/src/db/schema.ts` match the renamed tables. Mappers in `db/mappers.ts` emit `spaceId` and `sectionId`. Progress is a count query grouped by project and epic, not a stored column. Owner writes check `workspace_members` for `(workspaceId, ownerUserId)` inside the same request. A missing member is `400`.

### API & contracts

All routes stay behind `WorkspaceGuard`. There is no `/boards` or `/areas` alias.

- `GET/POST /v1/spaces`, `GET/PATCH/DELETE /v1/spaces/:id`. Bodies match today's board create/update (`name`, `folderId`, `emoji`). Detail includes `sections` and `progressStages` instead of `areas`.
- `POST /v1/spaces/:id/sections`, `PATCH/DELETE /v1/spaces/:id/sections/:sectionId`. Delete of the default section returns `400` with message `The default section cannot be deleted`. Delete of any other section moves its tasks to the default section and does not change `projectId` or `epicId`.
- `PUT /v1/spaces/:id/progress-stages` and `POST /v1/spaces/:id/progress-stages/apply` keep today's behavior under the new path.
- `GET/POST /v1/spaces/:spaceId/projects`. List and detail include `totalTasks`, `completedTasks`, `progressPercent`.
- `GET/PATCH/DELETE /v1/projects/:id`. GET returns the project, `progress`, `epics` (each with progress), and `tasks` (direct tasks only).
- `GET/POST /v1/projects/:projectId/epics`.
- `GET/PATCH/DELETE /v1/epics/:id`. GET returns the epic, `{ id, name }` of the parent project, `progress`, and `tasks`.
- Task create/update: `spaceId` replaces `taskBoardId`. `sectionId` replaces `areaId`. Add optional nullable `projectId` and `epicId`.
- `ListTasksQuery`: `spaceId` replaces `boardId`. Add optional `projectId` and `epicId`. Still mutually exclusive with a schedule range. `projectId` and `epicId` may be combined with `spaceId` only when they belong to that space; otherwise `400`.
- Execution DTOs: `boardId` → `spaceId`, `boardName` → `spaceName`, `areaId` → `sectionId`, `areaName` → `sectionName`, `isDefaultArea` → `isDefaultSection`. Activity bucket ids are computed at read time (`spaceId` or `spaceId:sectionId`); nothing stored needs a rewrite.
- `GET /v1/workspaces/members` returns `{ id, name, image }[]` for the current workspace so the owner control has options. Do not add member management.
- Agent tools in `task-tool-handler.ts`: parameters `boardId` and `taskBoardId` become `spaceId`.
- **Shared types:** replace `BoardArea*` and `TaskBoard*` exports. Add `PlanningStatus`, `Project`, `Epic`, create/update bodies, and `PlanningProgress`. `DEFAULT_AREA_NAME` becomes `DEFAULT_SECTION_NAME` (`"General"`). Update `packages/api/src/todex/index.ts`.
- **Validation:** Zod at the controller pipe, same as tasks. Service enforces Space membership after the pipe. Name uniqueness is a `400`.

### Frontend (if applicable)

- **Routes / pages:**
  - `/tasks/space/:spaceName` — current board page (sections and tasks) plus a Projects list.
  - `/tasks/space/:spaceName/:taskKey` — current task page.
  - `/tasks/space/:spaceName/projects/:projectId` — project view.
  - `/tasks/space/:spaceName/projects/:projectId/epics/:epicId` — epic view.
  - `tasksUrlHelper.routing.parseSpacePath` must treat `projects` as a reserved segment, not a task key. Update `getTaskKeyFromPathname` and `getActiveViewFromPathname` the same way.
  - `next.config.ts` redirects `/tasks/board/:path*` to `/tasks/space/:path*` with a permanent redirect.
- **Components:**
  - Extend `module-sidebar.tsx` and `space-dialogs.tsx` only where copy still says Board.
  - Space page: project list (name, status, progress, target date), create, edit, delete, empty state `No projects yet.`
  - Project view: name, description, status, target date, owner, progress, epic list, direct tasks. Actions: create epic, create task (pre-fills `projectId`), edit, delete.
  - Epic view: name, description, status, target date, owner, parent project link, progress, tasks. Assign an existing task from the Space or remove it (sets `epicId` null, leaves `projectId`).
  - `task-view.tsx` and `create-menu.tsx`: optional Project and Epic selects beside the existing section and goal controls. Epic options are the selected project's epics. Selecting an epic sets the project. Changing or clearing the project clears an incompatible epic. Section stays independent. Null project and epic stay valid.
  - Replace user-visible "Board" with "Space" and "Area" with "Section", including execution suggestion labels in `execution-suggestions-panel.tsx`, `execution-queue-list.tsx`, and `execution/current/page.tsx`.
  - Reuse the existing task row. Do not add a second card.
- **State & data fetching:** TanStack Query through `todex-client.ts`. Rename the `boards` client to `spaces`. Invalidate space, project, and task queries after assign, create, and delete.
- **Styling:** Tailwind + existing `@repo/ui` Select, DropdownMenu, Button, Dialog. No new visual system.

### Auth & permissions

- Every Space, Section, Project, Epic, and Task read or write checks `workspaceId` from `WorkspaceGuard` before using the id.
- `ownerUserId` must be a member of that workspace.
- A Project's `spaceId`, an Epic's project, and a Task's `spaceId` must be the same Space. Otherwise `ForbiddenException`.

### Error handling & edge cases

- Unknown id in another workspace: `403` (current board behavior), not `404`.
- Default section delete: `400`.
- Duplicate name: `400`.
- Epic id with no project, or epic from another project: `400` on the task write, after the service has tried to align the project.
- Deleting a Project that still has epics: one transaction. Delete epics (cascade), null task links (`ON DELETE SET NULL`), do not delete tasks.
- Moving a task to another Space: section resets through existing placement rules. Clear `projectId` and `epicId` because they cannot cross Spaces.
- Empty project list, empty epic list, and empty task list each render a one-line empty state. Failed queries use the existing task-page error pattern.
- User-facing "Board" and "Area" strings in the tasks and execution UI are gone. Layout components named Section stay.

### Testing

- **Unit / integration:**
  - `task-project-link.test.ts`: epic sets project, project change drops a foreign epic, null project drops epic, section input is ignored.
  - `progress.test.ts`: empty is 0; `done` and `cancelled` mix; a task on an epic is not double-counted on the project; integer rounding.
  - Update `task-placement.test.ts` for `sectionId`. Assert a section change does not receive project fields.
  - Update `execution-activity.test.ts`, `execution-suggestions.test.ts`, `task-helpers.test.ts`, `task-tool-handler.test.ts`, and `overview-day.test.ts` for the renamed fields.
  - Service-level test for section delete: tasks move to General and keep `projectId` and `epicId`. Follow the existing Vitest style next to the service. Do not add a Postgres harness. The rename migration is reviewed as `RENAME` only.
- **E2E:** none. `apps/todex-api/test/tasks.e2e-spec.ts` is a mocked smoke test; update it only if a route it calls was renamed.
- **Manual checks:** open an existing Space and confirm General and current tasks are intact; create a project and an epic; assign a task both ways; change section and confirm the epic remains; delete the epic and then the project and confirm the task still exists; schedule and execution still open that task; `/tasks/board/<name>` lands on `/tasks/space/<name>`.

### Deployment & ops

- **Env vars:** none.
- **Scripts / commands:** `pnpm --filter todex-api db:migrate` (whatever the app's existing drizzle migrate script is) before booting the API. Then `pnpm --filter todex-api test` and `pnpm --filter todex-web test`.
- **Rollout notes:** one breaking rename for the single in-repo client. Old `/v1/boards` clients get 404. Browser bookmarks under `/tasks/board` redirect. No feature flag.

## UX / UI

Space page keeps today's section columns or list. Projects are a list on that page, not a replacement for sections. Opening a project shows epics and direct tasks. Opening an epic shows its tasks and a link back to the project. Task create and task detail grow two optional selects. Loading uses the existing `Spinner`. Errors stay inline. Empty copy is `No projects yet.` and `No epics yet.`

## Dependencies & risks

- The board/area rename touches tasks, execution, progress stages, the web client, and the agent task tool. Ship it as one change so the client and API do not disagree.
- `ON DELETE SET NULL` on `epic_id` plus `ON DELETE CASCADE` from project to epic is what makes project delete clear both links. Do not use `ON DELETE CASCADE` from project or epic to tasks.
- `parseSpacePath` must reserve `projects` before any project route ships, or a task key named `projects` becomes unreachable. Document that reserved word. Existing task keys are `T-{n}`, so no data collision.
- Owner has no members API today. The new `GET /v1/workspaces/members` is only a read of `workspace_members` joined to `user`.

## Open questions

- None.

## Success criteria

- Existing spaces, sections, and task links survive the rename with the same ids.
- A user can create a Project, create an Epic under it, assign tasks directly or through the Epic, and see integer progress.
- Tasks still work with no Project and no Epic. Scheduling, execution, and Goals still open those tasks.
- Cross-Space links are rejected. Deleting a Project or Epic does not delete tasks.

## Implementation checklist

- [ ] Add `0025_spaces_and_sections.sql` and update `schema.ts`, mappers, Zod (`space.ts`, `section.ts`), and `index.ts`. Delete `area.ts` and `board.ts` exports.
- [ ] Move `modules/boards` to `modules/spaces`. Rename controller paths, service methods, and the web `todex-client` `boards` group. Update execution DTOs and the agent task tool.
- [ ] Rename web routes to `/tasks/space/...`, update `tasks-url.helper.ts`, and add the `/tasks/board/:path*` redirect. Replace user-facing Board/Area copy.
- [ ] Add `0026_projects_and_epics.sql`, `project.ts`, `epic.ts`, and `modules/projects` with CRUD, link rules, and progress.
- [ ] Add `GET /v1/workspaces/members` and optional `projectId` / `epicId` on task create and update. Clearing rules live in `task-project-link.ts`. Moving a task across spaces clears both ids.
- [ ] Add the Space project list, project view, epic view, and the task/create-menu selectors.
- [ ] Add the unit tests listed above and run `todex-api` and `todex-web` tests.
