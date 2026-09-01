# Todex — Data model

| Field   | Value      |
| ------- | ---------- |
| Status  | Draft      |
| Scope   | TDX        |
| Created | 2026-08-31 |

Postgres + Drizzle. Strong consistency inside one transaction for domain CRUD.

**Rule:** domain rows carry `workspaceId`. Access = `WorkspaceMember` (v0: the user’s sole membership).

**v0 persists:** Better Auth tables, Workspace (`taskSeq`), WorkspaceMember, Folder (`kind=tasks`), TaskBoard, Task.  
**Later:** Label/TaskLabel, Calendar\*, Doc, EntityLink, GoogleCalendarConnection, Folder `kind=docs`.

```
User ── Account (google)
  │
  └── Session
         │
User ──── WorkspaceMember ──── Workspace (taskSeq)
                                  │
                    Folder(kind=tasks)     [later: Calendar, Folder(kind=docs), Label]
                          │
                      TaskBoard
                          │
                        Task ── parentTaskId (deeper trees ok)
                              └── taskKey T-{n} (stable)
```

**Pages:** `/overview` empty; `/tasks` **list** uses task-folders + boards. Calendar/Docs/Kanban/labels deferred.

## Better Auth (user-scoped)

| Entity  | Fields (min)                            |
| ------- | --------------------------------------- |
| User    | id, email, name, image                  |
| Account | userId, provider = google, refreshToken |
| Session | userId, token, expiresAt                |

## Tenancy

| Entity          | Key FKs             | Notes                                                                            |
| --------------- | ------------------- | -------------------------------------------------------------------------------- |
| Workspace       | —                   | Created on first Google signup (dev) / allowed signup. `taskSeq` int, default 0. |
| WorkspaceMember | workspaceId, userId | `owner \| member`. v0: one membership per user.                                  |

## Tasks (v0)

| Entity    | Key FKs                                       | Notes                                |
| --------- | --------------------------------------------- | ------------------------------------ |
| Folder    | workspaceId, parentId?, `kind: tasks \| docs` | v0 uses `kind=tasks` only            |
| TaskBoard | workspaceId, folderId?                        | `folderId` nullable — root boards ok |
| Task      | workspaceId, boardId, parentTaskId?           | See fields                           |

**Not in v0:** Label / TaskLabel.

**Task fields:** `id`, `taskBoardId`, `taskKey` (required, unique per workspace), `summary`, `description` (**plain string** v0), `status`, `priority`, `dueDate?`, `scheduleDate?` (column for future calendar overlay; **not in UI**), `estimation?` (integer **minutes**), `parentTaskId?`, `workspaceId`, `createdAt`, `updatedAt`.

- **`taskKey`:** `T-{n}` from `workspace.taskSeq` incremented in the same insert txn. Client cannot set it. **Never rewrite** on move/reparent. Depth is `parentTaskId`, not the key.
- Subtasks: **`parentTaskId` only**; **deeper trees allowed**. Cycle (self or ancestor) is a 400.
- Drop TAD `userId`, `isPublic`, board-prefix keys. Wire `estimation` is integer minutes. UI parses duration text (`1h`, `30m`, `2d`) via `parseEstimation`; display via `formatEstimation`. Do not store the original phrase.
- Status: `todo \| in_progress \| done`.

**Wire (`@repo/api/todex`):** ISO date strings; map Drizzle → DTO once on API; flat list (no nested `subtasks[]`).

## Calendar (later — not v0)

| UI filter        | Storage                                                    |
| ---------------- | ---------------------------------------------------------- |
| Common           | `CalendarEvent.kind = common`                              |
| Time block       | `kind = timeBlock` + `CalendarEventTask`                   |
| Task on calendar | `Task.scheduleDate` overlay (duration / `scheduleEnd` TBD) |

Bidirectional Google sync later. Guests (when shipped): local events only; no GCal.

## Docs (later — not v0)

TipTap JSONB `content` + `contentText`. Folder `kind=docs`.

## Mentions / AI (later — not v0)

`EntityLink` graph + `contentText`. No EntityLink rows in v0.

## Labels (later — not v0)

`Label` + `TaskLabel` M:N. Add via migration when the UI needs them.
