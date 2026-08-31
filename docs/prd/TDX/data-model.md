# Todex — Data model

| Field   | Value      |
| ------- | ---------- |
| Status  | Draft      |
| Scope   | TDX        |
| Created | 2026-08-31 |

Postgres + Drizzle. Strong consistency inside one transaction for domain CRUD.

**Rule:** domain rows carry `workspaceId`. Access = `WorkspaceMember`.

**v0 persists:** Better Auth tables, Workspace, WorkspaceMember, Folder (`kind=tasks`), TaskBoard, Task, Label/TaskLabel.  
**Later:** Calendar\*, Doc, EntityLink, GoogleCalendarConnection, Folder `kind=docs`.

```
User ── Account (google)
  │
  └── Session
         │
User ──── WorkspaceMember ──── Workspace
                                  │
                    Folder(kind=tasks)     [later: Calendar, Folder(kind=docs)]
                          │
                      TaskBoard
                          │
                        Task ── parentTaskId (deeper trees ok)
```

**Pages:** `/overview` empty; `/tasks` uses task-folders + boards. Calendar/Docs deferred.

## Better Auth (user-scoped)

| Entity  | Fields (min)                            |
| ------- | --------------------------------------- |
| User    | id, email, name, image                  |
| Account | userId, provider = google, refreshToken |
| Session | userId, token, expiresAt                |

## Tenancy

| Entity          | Key FKs             | Notes                                                 |
| --------------- | ------------------- | ----------------------------------------------------- |
| Workspace       | —                   | Created on first Google signup (dev) / allowed signup |
| WorkspaceMember | workspaceId, userId | `owner \| member`                                     |

## Tasks (v0)

| Entity            | Key FKs                                       | Notes                                |
| ----------------- | --------------------------------------------- | ------------------------------------ |
| Folder            | workspaceId, parentId?, `kind: tasks \| docs` | v0 uses `kind=tasks` only            |
| TaskBoard         | workspaceId, folderId?                        | `folderId` nullable — root boards ok |
| Task              | workspaceId, boardId, parentTaskId?           | See fields                           |
| Label / TaskLabel | workspace, task M:N                           |                                      |

**Task fields:** `id`, `taskBoardId`, `taskKey?` (unique per workspace), `summary`, `description` (**plain string** v0), `status`, `priority`, `dueDate?`, `scheduleDate?` (for future calendar overlay), `estimationDays?` (allow `0.5`), `parentTaskId?`, `workspaceId`, `createdAt`, `updatedAt`.

- Subtasks: **`parentTaskId` only**; **deeper trees allowed**.
- Drop TAD `userId`, `isPublic`, unitless `estimation`.
- Status: `todo \| in_progress \| done`.

**Wire (`@repo/api/todex`):** ISO date strings; map Drizzle → DTO once on API.

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
