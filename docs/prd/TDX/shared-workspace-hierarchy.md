# Todex — Shared Workspace Hierarchy & Cross-Space Relations (V1)

| Field           | Value                                                    |
| --------------- | -------------------------------------------------------- |
| Status          | Draft                                                    |
| Scope           | TDX                                                      |
| Apps / packages | `apps/todex-api`, `apps/todex-web`, `@repo/api/todex`    |
| Created         | 2026-11-02                                               |

## 1. Executive Summary

Todex already has one workspace per user, a Planning space tree (`spaces` optionally under `folders.kind = tasks`), and a separate Knowledge folder list (`folders.kind = docs`). Documents have no `spaceId`. Calendar events have no `spaceId`. Mentions persist only from doc and goal prose into `doc_mentions`. Execution rejects a session whose tasks span more than one space.

V1 makes the Planning space tree the only space hierarchy, puts every doc and goal in exactly one space, gives events an optional space, and stores mentions plus two explicit relation kinds in one workspace-scoped table. Navigation stays module-first. There is no Counters work, no nested folders, no cross-workspace links, and no data backfill. Local schema reset is acceptable.

## 2. Problem Statement

Planning and Knowledge both use `folders`, distinguished only by `folder_kind`. A space created in Planning does not appear in Knowledge. A document cannot belong to a space. `folders.parentId` exists with no foreign key and no UI nesting, so the schema allows a tree the product does not want.

`doc_mentions` records doc/goal prose links to a task, doc, or event, with no foreign key on `target_id`. Task and epic descriptions are HTML from the same mention editor and are not written to that table. `useMentionCandidates` loads every workspace task and doc and does not load events. Nothing ranks the active space first.

`ExecutionService.requireSameBoard` throws `Tasks must belong to the same board` when a session contains tasks from two spaces. Calendar filtering is only `events` and `tasks` visibility. Overview aggregates the workspace with no space filter. Authorization is workspace membership via `WorkspaceGuard` (exactly one membership). There is no space ACL and no Counters module.

## 3. Goals & Non-Goals

### Goals

- One hierarchy: Workspace → optional Space Folder → Space → module content.
- Planning and Knowledge show the same spaces and space folders.
- Every doc and every goal (`docs.type = goal`) has a required `spaceId`. Document folders exist only inside one space.
- Events and event templates may have a null `spaceId`. The calendar stays a workspace timeline and can filter by one or more spaces. Deleting a space detaches those rows (`spaceId` null). It does not delete them or their Google sync fields.
- Planning and Knowledge space URLs use the space id. Rename and move do not change those URLs.
- An execution session may contain tasks from multiple spaces. Each task keeps its `spaceId`.
- `@` mentions in existing rich-text editors create `references` edges and backlinks. Explicit `related_to` and task `depends_on` are separate and are not inferred from mentions. `depends_on` cycle checks and inserts are atomic per workspace.
- The system Inbox is `spaces.isInbox`, one per workspace. A user space may also be named Inbox.
- Reads, mention search, backlinks, and agent retrieval stay inside the caller’s workspace.
- Ask and Execute may follow one relation hop from the active task or document without loading that space’s full contents.

### Non-goals

- Nested space folders, nested spaces, or a second space entity per module.
- Cross-workspace mentions or relations.
- A mandatory Space Overview page.
- Copying an entity into another module because it was mentioned.
- Permission inheritance through a mention or relation.
- Redesigning the module sidebar shell, Planning board/DnD behavior, or Calendar grid.
- A general graph editor, multi-hop traversal, or relation types beyond `references`, `related_to`, and `depends_on`.
- Counters or habits. No such module or table exists.
- Migrating or preserving local rows. No dual-write, compatibility view, or backfill.
- Mention editing inside event descriptions. Those stay plain text.
- Space-level ACL, roles beyond the existing `owner` / `member` enum, or multiple workspaces per user.

## 4. Current State Assessment

### Workspace and ownership

`workspaces` plus `workspace_members`. `workspace_members.user_id` is unique. `WorkspaceGuard` loads that single membership, creates an owner workspace when the user has none, and sets `request.workspaceId`. Services then scope queries by that id. `owner` and `member` are stored and not used for space checks.

Preserve the guard and the one-workspace rule. Do not add space membership.

### Planning spaces, folders, DnD

`spaces` belong to a workspace and optionally to `folders` (`on delete set null`). Creating a space also creates a default `space_sections` row named General. Sections and progress stages stay space-owned. Epics belong to a space and a section. Tasks belong to a workspace, a space, and a section, with optional epic, progress stage, and parent task.

`apps/todex-web/src/app/planning/module-sidebar.tsx` renders a pinned space whose name is `Inbox`, then root spaces, then folders of kind `tasks`. DnD moves a space onto a folder or onto the root by calling `spaces.update({ folderId })`. The Inbox space is created in `tasks-provider.tsx` when Planning loads and no space is named Inbox. There is no inbox column. A second space named Inbox would match the same check.

`SpacesService.remove` deletes the space’s tasks, then the space. Epics, sections, and progress stages leave through the space foreign keys. Docs are untouched.

Preserve: space CRUD, default section, sections, progress stages, epics, tasks, Inbox pin, and the existing DnD drop targets. Refactor: stop using `folders.kind = tasks` as the space-folder store. Missing: Knowledge and Calendar do not read this tree.

### Knowledge

`docs` have `workspaceId` and nullable `folderId`. No `spaceId`. `DocsService.requireDocsFolder` rejects a folder whose kind is not `docs`. Mention rows are replaced on doc save via `collectMentions` over the prose body. Goals are docs. `doc_tasks` links a goal doc to tasks and is what `tasks.service` exposes as `goalId` (not a column on `tasks`).

The Knowledge sidebar (`docs-sidebar.tsx`) has views All (`/knowledge`), General (`/knowledge/general`, common docs), and Templates (placeholder copy only), then a flat docs-folder list. No DnD.

Preserve those three views and doc editing. Refactor folder storage so a document folder cannot be confused with a space folder. Add required space ownership. General is a type filter, not a folder, and stays that way.

### Calendar

`calendar_events` and `calendar_event_templates` are workspace-scoped. Events have `taskScope: string[]`, recurrence, and Google sync fields. The sidebar shows a month picker, templates, unscheduled-task search, and visibility toggles `{ events, tasks }`. Scheduled tasks appear because `tasks.scheduleDate` is set. No space control.

Preserve the grid, templates, Google fields, task scheduling, and the two visibility toggles. Add optional `spaceId` and a multi-select filter. Do not copy the Planning tree into this sidebar.

### Execution, Overview, Counters

Execution sessions and the queue are workspace-scoped. `execute` calls `requireSameBoard`. Activity grouping in `execution-activity.ts` already buckets by `spaceId` and can filter to one space.

Overview (`overview-sections.tsx`) loads today’s scheduled tasks, events, execution state, upcoming tasks, tasks needing organizing, and recent docs. No space filter.

Counters: nothing in `apps/todex-api` or `apps/todex-web`. Out of scope.

Preserve human and AI execution, queue, results, and overview chapters. Remove the same-space session restriction. Add an optional overview space filter on the existing queries.

### Mentions and relations

`DocMentionTarget` is `task | doc | event`. Goals are docs, and the mention menu labels `type === goal` as Goal. Doc save rewrites `doc_mentions` for that doc. Task and epic descriptions are HTML strings (`data-target-type`, `data-target-id`) and are not indexed. Event descriptions are plain text. There is no backlinks UI and no `related_to` or `depends_on` table.

`useMentionCandidates` lists every task (one request per space) and every doc. It does not list events, even though `@event` is a scope token in `editor-mentions.ts`.

Preserve the editor, mention node, doc hrefs (`/knowledge/:id`), event hrefs (`/calendar/events/:id`), and prose `collectMentions`. Planning board hrefs move from space name + task key to space id + task key. Extend persistence to task and epic HTML. Add events to the menu. Add backlinks and explicit relations. `references` rows stay mention-derived only.

### Agent and MCP

`ContextService.assemble` embeds the latest user text and searches chunks in the workspace, limit 8, then trims to `maxTokens`. Modes keep the existing system lines: Ask cannot write, Execute waits for write confirmation, web research is a separate capability.

`get_task_context` loads the task, the goal doc when `goalId` is set, up to 10 docs that mention the task, epic, parent, recent execution results, and retrieved chunks. Caps are 8,000 characters per doc and 24,000 for the context. MCP tools already take `caller.workspaceId` and reject a client-supplied `workspaceId`. Document tools accept `folderId` and not `spaceId`.

Preserve tool names, Ask / Execute / research / write-approval, chunk retrieval, and the context caps. One shared hop loader serves `get_task_context`, `get_document`, and `ContextService` when a run already has a focal task or doc. Add `spaceId` on document create/update.

## 5. Target Architecture

Keep module navigation: app sidebar → module sidebar → content. Spaces are rows in `spaces`. Space folders are rows in a new `space_folders` table. Document folders are rows in `doc_folders` and always have a `spaceId`. Modules do not own a copy of the tree.

Write path for spaces and space folders stays `SpacesService` and a narrowed folder service. Planning and Knowledge both call it. Calendar only reads spaces to filter.

Mentions and explicit links share `entity_relations`. In V1 every `references` row has `origin = mention`, and mention saves replace only that set for the source. `related_to` and `depends_on` are `origin = explicit` and are not rewritten by mention sync. `related_to` is stored once per unordered pair by writing the endpoints in a fixed order.

Space navigation uses ids in both modules. `tasksUrlHelper` and `mentionHref` build Planning URLs from `spaceId`, not the space name. Calendar rows survive space delete because `spaceId` is `ON DELETE SET NULL`.

Agent retrieval does not change mode semantics. Ask and Execute both call the same hop loader when the job has a focal task or doc. The hop stays inside the workspace, one level, and inside the existing character caps. `depends_on` writes take a workspace advisory lock for the check and the insert. The system Inbox is a boolean on `spaces`, not a name.

Import boundary: shapes and Zod enums live in `@repo/api/todex`. Services stay in `apps/todex-api`. UI stays in `apps/todex-web`. No app-to-app imports.

## 6. Workspace & Space Hierarchy

- A workspace has many space folders and many spaces.
- A space folder has `workspaceId`, `name`, and optional `emoji`. It has no parent. It contains only spaces.
- A space has `workspaceId` and nullable `spaceFolderId`. It has no child spaces.
- Reject a space folder parent, a space whose folder is in another workspace, and any write that would set `folders.kind`.
- Deleting a space folder sets `spaces.spaceFolderId` to null. Spaces and their content remain.
- Deleting a space is a confirmed action. The confirm step shows how many tasks, goals, documents, epics, and document folders will be deleted. It does not list calendar events or templates as deletions.
- Confirming deletes, in one transaction: relation rows whose source or target is the space or any owned task, epic, doc, or doc folder; tasks; the space. Epics, sections, and progress stages cascade from `spaces.id`. Doc folders and docs cascade from `docs.spaceId` / `doc_folders.spaceId`. Goals are docs, so they go with that cascade.
- `calendar_events.spaceId` and `calendar_event_templates.spaceId` use `ON DELETE SET NULL`. The event row, `googleEventId`, etag, recurrence, and sync token behavior stay. Google sync must not treat the detached event as deleted in Google.
- Renaming or moving a space updates `spaces.name` or `spaceFolderId` only. URLs, mention nodes, and backlinks address the space and its entities by id, so they keep working.
- `spaces.isInbox` is a boolean, default false. A partial unique index on `workspaceId` where `isInbox` is true allows one system Inbox per workspace. User-created spaces always set `isInbox` false, including a space named Inbox.
- The existing Planning effect creates the system Inbox only when no `isInbox` row exists. It sets `isInbox` true, `spaceFolderId` null, and the display name Inbox. A second concurrent create hits the unique index, refetches, and does not insert another system Inbox.
- The Planning pin, the DnD exclusion, and goal-create’s default space read `isInbox`. They do not compare `name`. The pin label stays Inbox. Knowledge lists the system Inbox like any other space.
- `spaces.update` rejects a non-null `spaceFolderId` when `isInbox` is true. `spaces.remove` rejects that row before the confirm delete runs. The UI does not offer delete or folder drop for it. Rename of the system Inbox is allowed and does not clear `isInbox` or move the pin.
- Space names stay non-unique. Navigation never resolves a space by name.

## 7. Module Integration & Navigation

### Planning

Keep `module-sidebar.tsx` behavior: system Inbox pin, root drop, folder drop, and create/rename dialogs in `space-dialogs.tsx`. The pin is the `isInbox` row. Other spaces named Inbox use the normal rows and can be filed in a folder. Replace `/planning/space/[...spacePath]` with `/planning/space/:spaceId` and `/planning/space/:spaceId/:taskKey`. Update `tasksUrlHelper.routing.buildBoardUrl` and every caller, including mention hrefs, to pass `spaceId`. Two spaces with the same name are two routes. Point folder membership at `space_folders`. Creating, renaming, moving, or deleting a space or space folder invalidates the shared space query used by Knowledge and Calendar.

Delete uses the confirm step in section 6. Cancelling leaves the space and its contents.

Goals remain docs. `POST` create requires `spaceId`. `/planning/goals` stays a workspace list and shows each goal’s space name. The create action uses the workspace’s `isInbox` space when it exists; otherwise the user picks a space. Do not create the system Inbox from the goals page. Do not pick a space by display name.

Tasks, epics, sections, and progress stages are unchanged aside from mention persistence on task and epic HTML.

### Knowledge

Sidebar order: existing views (All, General, Templates), then the shared space tree. All and General stay workspace-wide aggregates. They are not spaces, space folders, or document folders. All lists every common doc. General keeps the current common-doc list. Templates stay the placeholder.

Creating a document from All or General requires a space. If the user has explicitly selected a space in that view, use it. Otherwise the create action asks for one. The API still rejects a doc or goal with no `spaceId`. Creating from an open space uses that space and does not ask again.

Inside a space, show that space’s document folders and documents. A space with no docs and no doc folders renders the existing empty copy pattern: “No docs yet.” Document folders are optional, created from the space view, and always belong to that one space. A document folder cannot move to another space in V1. A document can move to another folder in the same space, or to the space root (`folderId` null), and can move to another space in the same workspace; moving spaces clears `folderId` when the folder is not in the destination.

Reuse the Planning tree’s data, not a second fetch model: same `spaces.list` and space-folder list. DnD for spaces stays the Planning interaction. Knowledge may reuse the same move call (`folderId` update) if the extracted row component is shared. Do not put document-folder drags on the space collision detector.

New routes use ids: `/knowledge/space/:spaceId` and `/knowledge/space/:spaceId/folder/:folderId`. Doc URLs stay `/knowledge/:docId`.

### Calendar

Keep the sidebar’s month picker, templates, unscheduled task search, and Events/Tasks checkboxes. Add a Spaces group: one checkbox per space, multi-select, no folder DnD and no create button.

No selection shows every event and every scheduled task, as today. A non-empty selection shows events whose `spaceId` is selected and scheduled tasks whose `spaceId` is selected. Events and templates with null `spaceId` are hidden while any space is selected. They remain visible when the selection is empty.

Creating an event may set `spaceId` or leave it null. `taskScope` stays a list of task ids and is not a space filter. Do not duplicate events per space. After the parent space is deleted, the event and its template stay on the calendar with `spaceId` null, including `googleEventId` and the rest of the Google sync columns. They show up when no space filter is selected and drop out of a space filter.

### Execution

Delete the `requireSameBoard` check in `execute`. Reject only tasks that are missing or outside the workspace. Session rows do not gain a `spaceId`. Task rows are not rewritten. Activity’s existing per-space slice stays.

### Overview

Keep Today, Continue work, Upcoming, Needs organizing, and Recent docs. Add an optional space multi-select that filters those task, event, and doc queries. Empty selection keeps the current workspace aggregate.

## 8. Cross-Space Mentions & Structured Relations

### Mentions

Authoring stays in `TaskDescriptionEditor` for docs, goals, tasks, and epics. The menu still supports unscoped search and `@task`, `@doc`, and `@event` prefixes. Results come from the whole workspace. Sort matches in the editor’s current space before other spaces. Show type, title, and space name. Store `targetType` and `targetId` on the node, which the mention node already does. Do not key links by title or path.

On save:

- Docs and goals: keep `collectMentions` on the prose body.
- Tasks and epics: parse `data-target-type` and `data-target-id` from the stored HTML. Invalid or empty ids are dropped.
- Replace that source’s `kind = references` rows with the parsed set. Every inserted row has `origin = mention`.
- V1 has no other writer for `references`. A row with `kind = references` and `origin = explicit` is invalid.
- Do not delete or rewrite `related_to` or `depends_on` rows for that source.

Mention targets: `task`, `doc` (a goal is a doc), `epic`, `event`. Add `epic` to `DocMentionTarget`. A mention whose target is in another workspace is rejected. A mention to a missing id is dropped on save. Self-mentions are dropped.

Removing the mention and saving removes that reference edge only. Navigation uses `mentionHref`, which builds Planning links from `spaceId` and `taskKey`, not the space name. If the target 404s or is outside the workspace, the chip renders the stored label and does not navigate. Backlinks are incoming `references` plus the single `related_to` row for that pair. Renaming or moving a space does not change stored target ids or these URLs.

### Structured relations

Table `entity_relations`:

- `id`, `workspaceId`
- `sourceType`, `sourceId`, `targetType`, `targetId`
- `kind`: `references | related_to | depends_on`
- `origin`: `mention | explicit`
- Unique on `(workspaceId, sourceType, sourceId, targetType, targetId, kind)`
- Check: `kind = references` if and only if `origin = mention`
- Check: `kind` in (`related_to`, `depends_on`) if and only if `origin = explicit`
- Check for `related_to`: `(sourceType, sourceId) < (targetType, targetId)` lexicographically, so only one direction can be stored

`references` rows are written only by mention sync. The UI does not offer a manual “references” action. Inserting a `references` row with `origin = explicit` fails the check.

`related_to` is explicit and shown on both entities. Allowed endpoints: task, doc, epic, event, in the same workspace, not the same row. Before insert, order the two endpoints so the lesser `(type, id)` is the source and the greater is the target. Both “A related to B” and “B related to A” produce that one tuple. Insert is idempotent: `ON CONFLICT DO NOTHING` on the unique key, then return the existing row. Concurrent writers canonicalize to the same key, so one insert commits and the other hits the conflict and returns the same row. `depends_on` is not reordered. It stays directed.

`depends_on` is explicit, task to task only, same workspace, no self-link. Direction is preserved. Mentions never insert `depends_on`.

Cycle check and insert run in one database transaction. The transaction takes a transaction-scoped advisory lock keyed by `workspaceId` before reading `depends_on` rows (`pg_advisory_xact_lock`). Row locks are not enough: two opposite inserts on an empty graph would both see no edges. After the lock:

- If the same source and target row already exists, return it. That insert is idempotent and is not a new cycle.
- Walk `depends_on` edges in this workspace from the target. If the source is reachable, including a direct B→A when inserting A→B, roll back and reject.
- Otherwise insert. The unique key still makes an exact duplicate a no-op if another statement in the same locked transaction already wrote it.

The lock is held until commit or rollback, so concurrent A→B and B→A, and concurrent writes that would close a longer cycle, cannot both commit. `related_to` and mention sync do not take this lock.

There is no separate graph page. Relation controls sit on the existing task, epic, doc, goal, and event views: a list of backlinks and explicit relations, plus an add control that uses the same entity search as mentions.

Deleting an entity deletes relation rows where it is source or target, in that same transaction, before the row delete. Polymorphic ids cannot reference every table with one foreign key. Integrity is the delete transaction plus tests per entity type, which matches today’s `doc_mentions.target_id` and closes the leak by covering every remove path.

## 9. Permissions & Security

V1 authorization is the current workspace boundary. `WorkspaceGuard` and MCP `caller.workspaceId` stay mandatory on every read and write. Mention search, previews, backlinks, navigation, and relation writes load entities with the same workspace predicate already used in `requireInWorkspace`. A relation does not add a grant. If the user cannot load the target, it is omitted from search and backlinks.

Cross-workspace ids fail the workspace predicate and return the existing forbidden or not-found response. Do not add space roles. `owner` and `member` stay as stored today; this work does not invent a permission difference between them.

## 10. AI Agent & MCP Integration

Preserve `ContextService` chunk search (workspace, limit 8), transcript trimming, Ask, Execute confirmation, and web-research lines. Do not add a mode or a second orchestrator.

Add one helper next to `ContextService`, used by MCP and by `assemble`. It loads `entity_relations` where the focal task or doc is source or target, one hop, same workspace. It dedupes ids already present in the payload, drops a neighbor the workspace-scoped getter cannot load, and stops at `MENTION_LIMIT` (10) extra documents and `CONTEXT_CAP` (24,000). It does not select every entity in the focal space. A relation is a relevance hint, not a grant.

`get_task_context` keeps the goal doc, epic, parent, and execution results, then adds the hop for that task. `get_document` returns the document plus the same hop for that doc. Both tools stay read-scoped to `caller.workspaceId`.

`jobs` gain nullable `focalType` (`task` or `doc`) and `focalId`. The existing job create path sets them when Ask or Execute is started from a task or a document. `agent-orchestrator` passes those fields into `assemble`. `assemble` appends the hop for that entity in either mode, then the existing trim drops neighbors the same way it drops chunks. A job with no focal entity stays chunk search only. Ask still cannot write. Execute still waits for write confirmation.

`create_document` and `update_document` take `spaceId`. `folderId`, when set, must be a doc folder in that space and workspace. `create_task` already requires a space. Tool registry names stay. Reject `workspaceId` in tool args as today.

## 11. Data Model & Refactoring

### Schema

Drop `folder_kind` and the shared `folders` table. Replace with:

`space_folders`: `id`, `workspaceId` (cascade), `name`, `emoji`, timestamps. Index `(workspaceId)`.

`spaces.spaceFolderId` → `space_folders.id` on delete set null. `spaces.isInbox` boolean not null default false. Partial unique index on `workspaceId` where `isInbox` is true. Index `(workspaceId, spaceFolderId)`.

`doc_folders`: `id`, `workspaceId` (cascade), `spaceId` (cascade), `name`, timestamps. Index `(spaceId)`. No parent column.

`docs.spaceId` not null → `spaces.id` on delete cascade. `docs.folderId` nullable → `doc_folders.id` on delete set null. Check, in the service, that a non-null folder’s `spaceId` equals the doc’s `spaceId`. Indexes `(spaceId)` and `(folderId)`.

`calendar_events.spaceId` and `calendar_event_templates.spaceId` nullable → `spaces.id` on delete set null. Do not cascade-delete these rows. Index events `(workspaceId, spaceId, start)`. Google columns (`googleEventId`, `googleEtag`, `googleUpdatedAt`, recurrence, sync metadata) are unchanged.

`entity_relations` as in section 8, including the `references` / `origin` checks and the `related_to` endpoint-order check. Indexes `(workspaceId, targetType, targetId)` and `(workspaceId, sourceType, sourceId)`. The unique key is what makes canonical `related_to` inserts idempotent under concurrent writers.

Remove `doc_mentions` once mention sync writes `entity_relations`. Keep `doc_tasks` as the goal-to-task progress link. It is not a mention and not `depends_on`.

No change to `space_sections`, `space_progress_stages`, task placement, estimation checks, Google calendar columns, or execution session tables.

### Services and API

- `SpacesService` folder argument reads `space_folders`. User creates set `isInbox` false. The ensure path is the only writer of `isInbox` true. `update` rejects a folder assignment when `isInbox` is true. `remove` rejects `isInbox` before any delete. For every other space, `remove` runs only after the client confirm. It deletes relation rows for the space and its tasks, epics, docs, and doc folders, then tasks, then the space. It does not delete calendar events or templates. The database sets their `spaceId` to null.
- `depends_on` insert uses the locked transaction in section 8. `jobs.focalType` and `jobs.focalId` are optional and nullable.
- Folder HTTP: split the current `folders` controller so space-folder routes and doc-folder routes do not take `kind`. Doc-folder create requires `spaceId`.
- `DocsService.create` requires `spaceId`. List accepts optional `spaceId`. Mention sync writes relations. Goal create requires `spaceId`. `linkedTaskIds` still must be tasks in the workspace; they may be in another space.
- Task and epic update parses HTML mentions into relations.
- Calendar event and template DTOs gain optional nullable `spaceId`. List accepts `spaceId` repeated or an array. The web filter may also filter client-side from the existing range query if the payload for the visible range already includes `spaceId`. Prefer filtering in the existing list query so Overview and Calendar share it.
- `ExecutionService.execute` drops `requireSameBoard`.
- Shared Zod in `@repo/api/todex`: `DocMentionTarget` includes `epic`. Relation kind and origin enums. Doc create body requires `spaceId`.

### Client

- Planning sidebar and `tasks-provider` folder calls use space-folder endpoints. Query key `["boards"]` remains the space list so current invalidation keeps working.
- Knowledge `docs-provider` loads spaces plus doc folders for the open space, not `FolderKind.DOCS`.
- Mention candidates include events and epics, and sort by current space id when the editor is given one.
- `tasksUrlHelper` and `mentionHref` take `spaceId`. Drop name-based board paths. Old `/planning/space/:spaceName/...` links are not rewritten; there is no local data to keep.
- Backlink section on task, epic, doc, goal, and event views.

### Migration

Generate one Drizzle migration via the existing `db:generate` path. It may drop `folders` and `doc_mentions`. It must not backfill. Apply with `db:migrate` or `db:push` against the local database. Reset local data if the generated SQL cannot alter in place. Do not add a compatibility schema.

### Deletion and restore

There is no restore flow today. Do not add one. After delete, mention chips that still contain a stored id fail the workspace load and render as unavailable until the source is saved, which drops them.

## 12. UX & User Flows

1. **Create space or space folder.** Planning create control stays. The same dialogs call the same APIs from Knowledge. New space appears in both sidebars and in the Calendar checkbox list, with no documents and no events. Its Planning URL is `/planning/space/:spaceId`.
2. **Move or rename a space.** Planning DnD onto a folder or the root updates `spaceFolderId`. Rename updates `name`. The open URL, mention hrefs, and backlinks stay on the same id. Knowledge’s tree shows the new parent and name on the next space query. The system Inbox cannot be dropped into a folder. A user space named Inbox can.
3. **Delete a space.** The confirm dialog lists counts for tasks, goals, documents, epics, and document folders. It states that calendar events and templates stay and lose their space. Cancel does nothing. Confirm runs the delete in section 6. Google-linked events remain in Todex and in the sync mapping. The system Inbox has no delete action, and the API rejects it.
4. **Open the tree.** Planning and Knowledge both open `/…/space/:spaceId`. Duplicate names are two entries and two ids. All and General stay above the tree and do not open a space.
5. **Empty space.** Knowledge shows the space header and “No docs yet.” Planning shows the existing empty board.
6. **Create a doc from All or General.** The user picks a space, or the view already has one selected. The new doc is stored on that space. It does not live on the All or General view itself.
7. **Filter calendar.** Checking spaces hides events and scheduled tasks outside that set, and hides null-space events, including events detached by a space delete. Clearing checks restores the full timeline. Events and Tasks visibility toggles still apply.
8. **Cross-space calendar.** With no space checked, events from every space and unscoped events stay on one grid. Nothing is cloned per space.
9. **Mention.** In a doc, goal, task, or epic, `@` searches the workspace, current space first, label includes type and space. Insert stores ids. The chip’s Planning href uses the task’s `spaceId`.
10. **Pick a relation.** The add-relation control uses that search. The user chooses `related_to`, or `depends_on` when both endpoints are tasks. Saving `related_to` from either side stores one canonical row.
11. **Backlink.** Opening the target shows the source in its backlink list. Activating it uses the id href. The link still works after the source’s space is renamed or moved.
12. **Broken target.** Deleted or forbidden targets show the label and do not navigate. The edge is gone after the source is saved, and is gone immediately when the target delete transaction ran. Detaching an event’s space does not remove the event or its relations.
13. **Execute across spaces.** Queue or start tasks from two spaces. The session runs. Each task’s board link still opens its own space by id. The API no longer returns “Tasks must belong to the same board.”
14. **Agent.** Executing a task in one space can include a doc in another space when a relation or mention connects them and the doc is in the workspace. The prompt does not include every doc from either space.

Design system stays Tailwind, Radix, and existing `@repo/ui` controls. No new visual language.

## 13. Functional Requirements

1. Space folders and spaces are workspace-scoped. A space has at most one space folder. Space folders have no children except spaces. Spaces have no child spaces or space folders.
2. Creating, renaming, moving, and deleting a space or space folder is visible to Planning, Knowledge, and the Calendar space filter after the shared space query refreshes.
3. Planning pins the `isInbox` space, keeps root and folder DnD for every other space, and still persists those moves through space update. The API rejects deleting the system Inbox or setting its folder. A space named Inbox with `isInbox` false is a normal space. Board and task URLs use `spaceId`. Renaming or moving a space does not change them.
4. Every doc and goal insert includes `spaceId` in the same workspace. A doc folder’s space matches the doc’s space. Docs may sit on the space with a null folder. All and General cannot store a doc without a chosen space.
5. Knowledge All, General, and Templates routes remain as aggregates. Templates still do not create documents.
6. Space delete requires confirmation that shows task, goal, document, epic, and document-folder counts. Confirming removes those owned records and their sections and progress stages. It sets `spaceId` null on events and templates and leaves Google sync columns in place.
7. Space-folder delete nulls `spaceFolderId` and does not delete spaces.
8. Events and templates accept a null or in-workspace `spaceId`. Null is also the result of deleting the previous space.
9. Calendar with an empty space selection shows the current workspace timeline. A non-empty selection shows only events and scheduled tasks in the selected spaces.
10. Mention save on a doc, goal, task, or epic replaces only that source’s `references` rows, all with `origin = mention`. No API writes `references` with `origin = explicit`.
11. Mention search returns tasks, docs, goals, epics, and events in the caller’s workspace, current space first, and does not return other workspaces. Planning mention hrefs use `spaceId`.
12. `related_to` can be created between task, doc, epic, and event in the workspace without a mention. Both directions persist as one row ordered by `(type, id)`. A concurrent opposite insert returns that row. `depends_on` stays directed and task-to-task. Its cycle check and insert share a workspace advisory lock, so concurrent A→B and B→A and longer cycles cannot both commit. An exact duplicate returns the existing row. Mention sync does not change either explicit kind.
13. Backlinks list incoming `references` and either-direction `related_to` for entities the caller can load.
14. Execution accepts tasks from multiple spaces in one workspace and does not change their `spaceId`.
15. `get_task_context`, `get_document`, and Ask or Execute jobs that carry a focal task or doc add one hop of relation neighbors inside the existing document and character caps. A job with no focal entity does not. Neighbors the workspace getter cannot load are skipped. The hop does not load an entire space.
16. Document MCP create/update requires `spaceId` and validates `folderId` against that space.
17. Overview with no space filter matches today’s sections. With a filter, those sections only include entities in the selected spaces.

## 14. Non-Functional Requirements

- Schema is the final shape. One generated Drizzle migration, no backfill.
- Authorization checks stay in API services and MCP handlers, not only in the client.
- Mention ranking is a sort over the lists the editor already loads. Do not add a search service in V1.
- Relation expansion is one hop and capped by the existing `MENTION_LIMIT` and `CONTEXT_CAP`.
- Planning DnD continues to move only spaces, using the current drop ids (`space-folder:*`, `space-root`, `space-board:*`).

## 15. Acceptance Criteria

- After creating “Magnus” under a space folder in Planning, Knowledge’s tree shows Magnus in that folder without a second create.
- Renaming Magnus renames the Planning row, the Knowledge row, and the Calendar checkbox. The open Planning URL `/planning/space/:spaceId` stays the same, and existing mention and backlink targets still open.
- Two spaces named Magnus have two ids and two URLs. Opening one does not open the other.
- Dragging Magnus to root clears its folder. Dragging it onto a space folder sets that folder. It cannot be dropped onto another space. The URL does not change.
- Deleting Magnus asks for confirmation and shows the task, goal, document, epic, and document-folder counts. After confirm, those records are gone. Events and templates that pointed at Magnus still exist, with `spaceId` null, and a Google-linked event still has its `googleEventId`. Cancelling the confirm deletes nothing.
- A space folder cannot be created inside another space folder. The API rejects a parent.
- A new doc cannot be saved without `spaceId`. Creating from All or General without a selected space prompts for one and does not create a workspace-root doc. A doc folder in space A cannot be attached to a doc in space B.
- Knowledge opens a space that has no docs and shows an empty state, not a missing space.
- Calendar with no spaces checked still shows events from all spaces and events with null `spaceId`, plus scheduled tasks.
- Checking Magnus and Todex shows only those spaces’ events and scheduled tasks, and hides null-space events.
- A goal in Magnus can mention a task and a doc in Todex. Saving creates `references`. The task and the doc show the goal as a backlink.
- Deleting the mention and saving removes that `references` row and leaves an explicit `related_to` between the same pair. The stored `related_to` row is the canonical endpoint order, whether the user added it from the goal or from the task.
- Two concurrent `related_to` writes of that pair, in opposite directions, leave one row.
- `depends_on` from task A to task B succeeds. A later `depends_on` from B to A fails. Concurrent A→B and B→A leave one row. Concurrent inserts that would close a cycle through a third task leave the graph acyclic. Repeating A→B returns the same row. A mention of B from A does not create `depends_on`. A `references` insert with `origin = explicit` fails.
- Deleting a task removes relation rows that point at it. The other entity’s chip no longer navigates.
- Starting execution with one Magnus task and one Todex task succeeds. Both tasks still open on their own boards.
- `get_task_context` for the Magnus task includes a Todex doc linked by a relation, and does not include an unrelated Todex doc. `get_document` on that Todex doc includes the Magnus task the same way. An Ask job and an Execute job started from that task both receive the linked doc, and neither receives the rest of the Todex space. A job with no focal entity does not add relation neighbors. Ask still cannot write.
- An MCP document create without `spaceId` fails validation. With a folder from another space, it fails.
- A target id from a different workspace is not returned by mention search and is not stored.
- Existing Planning board sections, epic move, task schedule onto the calendar, Google event fields, Ask vs Execute, and Overview chapters still behave as they do now when no space filter is set.
- Goals list still loads goals across spaces and shows the space name.
- The system Inbox stays pinned in Planning. It cannot be deleted or filed into a folder. A different space named Inbox can be filed, deleted, and opened on its own id. Goal create defaults to the `isInbox` space, not to a space chosen by name.

## 16. Edge Cases & Failure Handling

- **Duplicate space names.** Allowed. Planning and Knowledge routes both use `spaceId`. The pin reads `isInbox`. Another space named Inbox is not pinned and is not protected.
- **Two system Inbox creates.** The partial unique index rejects the second `isInbox` insert. The client refetches the winner.
- **Inbox missing on the goals page.** Create asks for a space. It does not insert an `isInbox` row.
- **System Inbox delete or move.** The API rejects both. Rename does not clear the flag.
- **Last space deleted.** Goal and doc create fail until a space exists. Calendar filter list is empty and the timeline shows only null-space events.
- **Doc folder deleted.** Docs in it keep their `spaceId` and get `folderId` null.
- **Mention target deleted between search and save.** Save drops that mention edge. The editor label can remain until the next load strips unknown nodes the way prose mention cleanup already drops unknown targets.
- **Cycle in depends_on.** Direct opposite edges and longer paths both fail inside the locked transaction. The losing concurrent request sees the winner’s row. An exact replay returns the existing edge and does not reverse it.
- **Duplicate `related_to`.** Callers may send either direction. The service orders endpoints, then `ON CONFLICT DO NOTHING` returns the existing row, including when two requests commit together.
- **`references` origin.** Mention sync is the only writer. A manual or explicit `references` insert fails the check constraint. Removing a mention does not delete `related_to` or `depends_on`.
- **Event description `@`.** Not parsed. Users relate events through the event view’s relation control or by mentioning the event from a doc, goal, task, or epic.
- **Same-space execution.** Still valid after `requireSameBoard` is removed.
- **Agent over cap.** Drop extra relation documents the same way chunk messages are dropped in `filterTranscript`, after the focal task payload.
- **Google events.** Null `spaceId` is valid on create and after space delete. Sync must not require a space and must not delete the Google event because the Todex space was deleted.

## 17. Risks & Open Technical Decisions

### Risks

- **Permission leakage.** Backlinks and agent hops must use the workspace-scoped getters. A raw relation id lookup would leak across workspaces if that predicate were skipped.
- **Dangling mentions.** `target_id` cannot have one foreign key. A delete path that skips relation cleanup leaves rows. Tests have to cover task, epic, doc, event, and space delete.
- **Duplicate goal links.** `doc_tasks` and a mention `references` row can both connect a goal and a task. That is intentional. UI should not draw two identical “link” rows without showing kind (`goal link` vs `mention`).
- **Mention search cost.** The client already lists every space’s tasks. Sorting does not fix that N+1. Leave it unless the menu becomes unusable.
- **Token use.** One hop plus the current caps is the bound for tasks and docs, in Ask and Execute. Do not raise `CONTEXT_CAP` in this work. A missing workspace load skips that neighbor instead of widening the query.
- **Dependency lock.** The advisory lock serializes `depends_on` writes inside one workspace. That is the race fix. Do not hold it across `related_to` or mention sync.
- **Calendar filter.** Hiding null-space events while a filter is on will look like data loss if most events stay unscoped, and again after a space delete detaches its events. The checkbox list should show that unscoped events return when checks are cleared. The confirm dialog has to say events are kept, not deleted.
- **Shared tree state.** Planning optimistic `["boards"]` updates must stay the source Knowledge and Calendar read, or those sidebars will lag.
- **Regressions.** Inbox creation, section defaults, epic section moves, doc mention rewrite, and name-based `buildBoardUrl` callers are easy to break while splitting folders and switching routes. A missed caller still links to a name path that no longer resolves.

### Decisions already made

- Docs and goals require one space. Document folders are optional and space-local.
- Events use optional `spaceId`. Empty calendar filter shows everything. A non-empty filter hides null-space events. Space delete sets event and template `spaceId` to null and keeps Google sync fields.
- Space delete is confirmed, then cascades tasks, goals, docs, epics, sections, progress stages, and doc folders.
- Planning routes are `/planning/space/:spaceId` and `/planning/space/:spaceId/:taskKey`.
- All and General are aggregates. Doc create from those views uses a selected space.
- `references` are mention-only (`origin = mention`). `related_to` is stored once in canonical endpoint order. `depends_on` stays directed. Cycle check and insert take a workspace advisory lock.
- The system Inbox is `spaces.isInbox`, at most one per workspace. Name is not the identity.
- Ask and Execute share one relation hop for a focal task or doc. MCP `get_task_context` and `get_document` use that same helper.
- Counters are out of scope.
- No data migration.

### Open technical decisions

- **Shared DnD component.** Knowledge can call the same space-move API with a read-only tree, or share the Planning drag rows. Either meets the product rule. Prefer sharing only if the Planning collision behavior stays intact. Do not block the schema on that extraction.
- **HTML mention parser location.** Parse task and epic mention attributes in the API on save, not in the client, so MCP updates that send HTML get the same edges. The exact parser belongs next to `collectMentions` and should accept the attributes the mention node already renders.
- **Overview control placement.** A space multi-select on the overview page is enough. Which existing header it sits in is an implementation detail.
- **Relation delete implementation.** Application transaction versus a database trigger. Use the transaction in the owning service unless a test shows a delete path bypasses the service.

## 18. Implementation Phases

### Phase 1 — Schema and space-folder split

Reuse `SpacesService`, `WorkspaceGuard`, and Planning space DTOs. Replace `folders` with `space_folders` and `doc_folders`. Add `docs.spaceId`, `spaces.isInbox` with the partial unique index, nullable event `spaceId` with `ON DELETE SET NULL`, and `entity_relations` with the origin and `related_to` order checks. Add nullable `jobs.focalType` and `jobs.focalId`. Generate one migration and reset local data.

Done when space CRUD still creates a default section, space-folder move updates `spaceFolderId`, a second `isInbox` insert fails, doc insert requires a space in that workspace, and deleting a space nulls event `spaceId` without deleting the event or `googleEventId`.

### Phase 2 — Planning

Reuse `module-sidebar.tsx`, `space-dialogs.tsx`, and `tasks-provider.tsx`. Repoint folder calls. Ensure and pin the system Inbox with `isInbox`. Leave user spaces named Inbox on the normal DnD path. Reject system Inbox delete and folder moves in the service and hide those actions. Switch board routes and `tasksUrlHelper` to `spaceId`. Delete confirmation shows the owned-entity counts and does not imply event deletion. Goal create sends the `isInbox` id or an explicit space id. Task and epic save sync mention relations.

Done when existing DnD tests still describe root and folder drops, the system Inbox cannot be filed or deleted, a user space named Inbox can, a goal cannot be created without a space, renaming a space leaves `/planning/space/:spaceId` valid, and two spaces with the same name open separately.

### Phase 3 — Knowledge

Reuse doc editor, All / General / Templates, and prose mention collection. Sidebar lists shared spaces. All and General stay aggregates. Their create action requires a selected space. Doc folders and docs are space-scoped. Empty space state exists.

Done when a space created in Planning appears here, a doc folder cannot be saved onto another space, and creating from All or General without a space does not insert a doc.

### Phase 4 — Calendar, execution, overview

Reuse calendar visibility, event editor, execution sessions, and overview sections. Add space filter, optional event `spaceId`, and remove `requireSameBoard`.

Done when an unfiltered calendar matches current items, a filtered calendar hides other spaces and detached events, a deleted space’s Google event is still listed with null `spaceId`, and a two-space execute call succeeds.

### Phase 5 — Relations UI

Reuse the mention menu. Persist mentions for docs, goals, tasks, and epics. Add events and epics as targets. Add backlinks, `related_to`, and `depends_on`.

Done when the mention-removal case keeps one canonical `related_to` row, an opposite-direction `related_to` insert does not add a second row, a `references` row with `origin = explicit` is rejected, and concurrent `depends_on` inserts cannot commit a two-node or longer cycle.

### Phase 6 — Agent and MCP

Reuse `get_task_context`, `get_document`, `ContextService.assemble`, chunk search, and tool auth. Add the shared one-hop helper. Pass `jobs.focalType` and `jobs.focalId` from the existing orchestrator. Require `spaceId` on document tools.

Done when a cross-space related doc is included for a task and the reverse task is included for that doc, an unrelated doc in that space is not, Ask and Execute both see the hop only when a focal entity is set, and a document create without `spaceId` fails.

### Phase 7 — Regression

Run todex-api and todex-web unit tests covering spaces, docs mentions, execution, calendar blocks, and mention menu sorting. Manually walk Planning DnD, Knowledge empty space, calendar filter, cross-space execute, and a mention backlink.

No timeline. Phases 2 and 3 depend on phase 1. Phase 5 depends on the relations table from phase 1 and the editors from phases 2 and 3. Phase 6 depends on phase 5’s rows. Phase 4 can follow phase 1 in parallel with phase 5.
