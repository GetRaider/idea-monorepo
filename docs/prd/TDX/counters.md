# Todex Counters: tech spec

Source: [PRD: Todex Counters](https://claude.ai/artifact/8VRyhsunKqVsWMfdZCKjsa), 2026-11-27. Scope here is the PRD's MVP.

## 1. Intent

A Counter tracks how regularly a person does a repeating activity without creating a Task each time. It lives in Planning, is logged by hand in one action or by completing a linked Task, and can show in Today.

**Not in this change:** streaks and Stats (phase 2), deleting a Counter, sections or grouping, gamification, a top-level nav item, agent or MCP tools for Counters, editing a Counter's time zone.

## 2. Decisions

Settled with the product owner (PRD gaps):

| Question                                                       | Decision                                                         |
| -------------------------------------------------------------- | ---------------------------------------------------------------- |
| Period that started late (creation, rule change)               | Full Target applies. `Failed = Target − Completed − Skipped`     |
| Reopen or delete a Task whose completion is in a closed period | Closed history is kept. Only open-period completions are removed |
| Per-day cap                                                    | None                                                             |

Engineering calls (change if wrong):

| Call                                                                                                                      | Reason                                                     |
| ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| A Task in a live series is linked through the series                                                                      | PRD default                                                |
| Turning a linked Task into a series moves the link to the series                                                          | Keeps "series Tasks are linked by series" true             |
| Linking an already Done Task creates nothing                                                                              | Only the transition to Done counts                         |
| Done → Cancelled behaves like reopen                                                                                      | The Task is no longer done                                 |
| "Every 2 weeks" blocks start on the Monday of the creation week                                                           | Counted from creation, still Monday-aligned                |
| A new rule starts the day after the current period ends; if that is mid-week or mid-month the first new period is shorter | No overlap, no recalculation                               |
| Occurrences can be deleted only while their period is open                                                                | "Closed periods are not editable"                          |
| The time zone is taken from the browser at creation and is immutable                                                      | Changing it would move day boundaries under existing dates |
| Archiving drops the unfinished period: no snapshot, no Failed                                                             | PRD: archived Counters open and close nothing              |
| Restore resumes at the first day after the period containing the restore day, even if archived minutes earlier            | PRD: "resumes with the next period"                        |

## 3. Approaches

**Period state**

- **Cursor only (chosen).** `closed_through` is the single cursor. The open period starts the next day and ends where the rule says. Nothing about the open period is stored twice.
- Materialized open-period row. Simpler reads, but a second writer and a row that must be rewritten on archive, restore and edit. The PRD defines `counter_periods` as close-time snapshots.
- Derive everything from occurrences on read. Breaks after a Target or Recurrence change.

**Task integration**

- **Explicit calls inside the Task transaction (chosen).** Same pattern as `task-lifecycle.ts`; completion and occurrence commit together.
- Postgres trigger on `tasks`. Catches every writer, but puts time zone and period logic in SQL, which the repo does not use.
- Async event after commit. Needs retries and can leave the two out of sync.

## 4. Data model

Migration `0039`. Dates are Postgres `date` read as `YYYY-MM-DD` strings.

**`counters`**

| Column                     | Type                              | Notes                                                 |
| -------------------------- | --------------------------------- | ----------------------------------------------------- |
| `id`                       | text PK                           |                                                       |
| `workspace_id`             | text FK, cascade                  |                                                       |
| `name`                     | text                              |                                                       |
| `frequency`                | enum `daily`, `weekly`, `monthly` |                                                       |
| `interval`                 | int                               | 1 or 2; monthly is 1                                  |
| `target`                   | int                               | 1–999                                                 |
| `time_zone`                | text                              | IANA                                                  |
| `anchor_date`              | date                              | Origin for "every N" blocks                           |
| `show_in_today`            | bool                              |                                                       |
| `status`                   | enum `active`, `archived`         |                                                       |
| `closed_through`           | date                              | Last day that is closed or untracked                  |
| `pending_change`           | jsonb null                        | `{ frequency, interval, target }` for the next period |
| `created_at`, `updated_at` | timestamp                         |                                                       |

**`counter_links`**: `id`, `counter_id` (cascade), `task_id` (FK tasks, cascade) or `series_id` (no FK, so it survives series deletion), exactly one set (check). Unique per `(counter_id, task_id)` and `(counter_id, series_id)`.

**`counter_occurrences`**: `id`, `counter_id` (cascade), `local_date`, `status` (`completed`, `skipped`, `failed`), `skip_reason`, `source` (`manual`, `task`, `system`), `task_id` (FK tasks, **set null**), `created_at`. Unique `(counter_id, task_id)` where `task_id` is not null. Index `(counter_id, local_date)`.

**`counter_periods`**: `id`, `counter_id` (cascade), `start_date`, `end_date`, `target`, `completed`, `skipped`, `failed`, `outcome` (`met`, `excused`, `failed`), `created_at`. Unique `(counter_id, start_date)`.

## 5. Domain rules

Pure functions in `apps/todex-api/src/modules/counters/counter-periods.ts`. All date math is on local date strings; `today` is the date of `now` in the Counter's time zone.

### Periods

`periodContaining(rule, anchor, date)`:

| Rule      | Start                                            | End                  |
| --------- | ------------------------------------------------ | -------------------- |
| daily, N  | `anchor + floor((date − anchor) / N) × N` days   | start + N − 1        |
| weekly, N | N-week block counted from the Monday of `anchor` | block start + 7N − 1 |
| monthly   | 1st of the month                                 | last of the month    |

Open period = `{ start: closed_through + 1, end: periodContaining(rule, anchor, closed_through + 1).end }`. Creation sets `anchor = today` and `closed_through = periodContaining(today).start − 1`, so the first period is the whole calendar period and can be backdated to its start.

### Closing

A period closes when `today > end`. In one transaction holding `FOR UPDATE` on the Counter row, while the open period has ended:

1. Count Completed and Skipped dated inside it.
2. `failed = max(0, target − completed − skipped)`.
3. Insert the snapshot. Outcome: `failed` if `failed > 0`, else `met` if `completed ≥ target`, else `excused`.
4. Insert `failed` occurrences (`source = system`) on the last days of the period that have no Completed or Skipped. If empty days run out, the remainder goes on the last day.
5. Set `closed_through = end`. Apply `pending_change`; if frequency or interval changed, set `anchor_date = end + 1`.

The loop closes every missed period in order. It runs on a 60-second timer and lazily before any Counter read or write. A failure on one Counter is logged and does not block the others.

### Lifecycle and edits

- **Archive:** close ended periods, then set `archived`. No further closing.
- **Restore:** set `closed_through` to the end of the period containing today under the current rule, apply `pending_change` (re-anchoring at the next day), set `active`. Until the next day after `closed_through`, the Counter has no open period ("Resumes …") and accepts no occurrences.
- **Edit:** name and Show in Today apply at once. Frequency, interval and Target are stored in `pending_change` and apply when the open period closes (or on restore). If the open period has not started, they apply at once. Setting the current values again clears the pending change.

### Logging

Rejected unless the Counter is active, and `max(start) ≤ date ≤ min(today, end)`. `date` defaults to today.

- Completed: always accepted.
- Skipped: needs a non-blank reason (≤ 500 chars). Rejected when `completed + skipped ≥ target` for the open period.
- Delete: only `source = manual`, only dated in the open period of an active Counter.
- Failed cannot be created or deleted through the API.

### Day indicators

Seven days, Monday to Sunday, of the week containing today. Per day: counts, `fill` and the day's occurrences.

- `partial`: Every day (daily, interval 1), Target ≥ 2, `0 < completed < dayTarget`.
- `filled`: `completed ≥ dayTarget`; for any longer period `dayTarget` is 1.
- `empty`: no Completed.

Closed days use the Target in their snapshot. Skipped and Failed are separate marks and never add to progress.

## 6. Task integration

`counter-task-sync.ts` exports two functions that take the caller's transaction.

- `recordTaskCompletion(tx, task, now)`: find active Counters linked to `task.id`, `task.seriesId` or `task.originSeriesId`; lock each (ordered by id), close its ended periods, skip it if today is before the open period, then insert `{ status: completed, source: task, task_id }` dated today, ignoring a unique conflict.
- `revertTaskCompletions(tx, taskIds, now)`: for each Counter holding an occurrence for those Tasks: lock, close ended periods, delete occurrences dated in the open period, and set `task_id = null` on the rest so history stays and a new completion can be recorded. Archived Counters keep every occurrence (detached).

| Task change                        | Where                                            | Call                         |
| ---------------------------------- | ------------------------------------------------ | ---------------------------- |
| Status → Done                      | `TasksService.commitLifecycle` (update, move)    | record                       |
| Done → To do / In progress         | `TasksService.update`, `TasksService.move`       | revert                       |
| Done → Cancelled                   | `TasksService.commitLifecycle`                   | revert                       |
| Task delete, with subtasks         | `TasksService.commitLifecycle` before the delete | revert                       |
| Space delete                       | `SpacesService` before deleting its Tasks        | revert                       |
| Series stop cancels open instances | `RecurrenceService.stop`                         | none (they were never Done)  |
| Task becomes a series              | `RecurrenceService.createSeries`                 | move its links to the series |

A Task created directly as Done has no links yet, so it needs no call.

## 7. API

Zod contracts in `packages/api/src/todex/counters.ts`. Controller `counters`, behind `WorkspaceGuard`; every id is checked against the caller's workspace.

| Method and path                                     | Body / query                                             | Returns                     |
| --------------------------------------------------- | -------------------------------------------------------- | --------------------------- |
| `GET /v1/counters`                                  | `status=active\|archived`                                | `Counter[]`                 |
| `POST /v1/counters`                                 | name, frequency, interval, target, timeZone, showInToday | `CounterDetail`             |
| `GET /v1/counters/:id`                              |                                                          | `CounterDetail`             |
| `PATCH /v1/counters/:id`                            | name?, frequency?, interval?, target?, showInToday?      | `CounterDetail`             |
| `POST /v1/counters/:id/archive`                     |                                                          | `CounterDetail`             |
| `POST /v1/counters/:id/restore`                     |                                                          | `CounterDetail`             |
| `POST /v1/counters/:id/occurrences`                 | status, date?, skipReason?                               | `{ counter, occurrenceId }` |
| `DELETE /v1/counters/:id/occurrences/:occurrenceId` |                                                          | `Counter`                   |
| `POST /v1/counters/:id/links`                       | taskId                                                   | `CounterDetail`             |
| `DELETE /v1/counters/:id/links/:linkId`             |                                                          | `CounterDetail`             |

Only the five PRD recurrences validate: (daily, 1), (daily, 2), (weekly, 1), (weekly, 2), (monthly, 1).

`Counter`: id, name, frequency, interval, target, timeZone, showInToday, status, today, `period` (`{ start, end, completed, skipped, failed, isOpen }`, null when archived), `pendingChange` (with `effectiveDate`), `week` (7 days).
`CounterDetail` adds `links` (`kind`, `taskId`/`seriesId`, title, taskKey) and `history` (all occurrences, newest first, each with `deletable`).

The server computes periods, progress and indicators. The web renders them.

## 8. Web

- Sidebar: a **Counters** row in Planning → Views, before Goals.
- `/planning/counters`: Active / Archived toggle, New counter, one row per Counter (name, rule, `X / N` with period suffix, seven indicators, Skip). Archived rows offer Restore.
- `/planning/counters/[counterId]`: settings (edit, Show in Today, archive/restore), pending-change note, linked Tasks (add and remove), occurrence history.
- Today (`/planning/schedule/today`): a bordered **Counters** block above the Task list, only active Counters with Show in Today. Each has name, progress, indicators, **Completed** and **Skip** for today.
- Indicators: click adds Completed for that day, with an Undo toast. The context menu has Add completed, Skip…, and Remove for each deletable occurrence. Marks: filled disc, half disc, empty ring, dashed amber ring (skipped), red cross (failed); today is outlined. Non-loggable days are disabled and keep a tooltip.
- Task status, move and delete mutations also invalidate the `counters` query.

## 9. Testing

- Unit (`counter-periods.test.ts`): all five rules, month ends, DST dates, failed placement, outcomes, indicators.
- Database (`counters.db.test.ts`, `counter-task-sync.db.test.ts`; run when `COUNTERS_TEST_DATABASE_URL` is set): create, log, skip limits, close with catch-up, rerun idempotency, edit-next-period, archive/restore, links, complete/reopen/delete a Task, closed-history retention.
- Contracts (in `counter-periods.test.ts`): recurrence pairs, skip reason.
- Web: label helpers; manual pass of the list, detail and Today flows.

## 10. Phase 2 readiness

Streaks and Stats read `counter_periods` plus the open period; no new tables or backfill.
