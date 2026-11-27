# Todex Counters: tech spec

Source: [PRD: Todex Counters](https://claude.ai/artifact/8VRyhsunKqVsWMfdZCKjsa), 2026-11-27, plus the review of the first build the same day. Where the two differ, this spec wins.

## 1. Intent

A Counter tracks how regularly a person does a repeating activity without creating a Task each time. It works like a habit tracker in the Todex style: one click on a day completes it, a day left alone fails, and a skip needs a reason. It lives in Planning, may belong to a space, and can show in Today.

**Not in this change:** a Stats view and best streak, deleting a Counter, custom grouping or per-Counter icons, gamification, a top-level nav item, agent or MCP tools for Counters, editing a Counter's time zone.

## 2. Decisions

Settled with the product owner:

| Question                                                       | Decision                                                                                                                                |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Who sets each status                                           | Completed and Skipped are set by hand (Skipped needs a reason). Failed is the default for an untouched slot and can also be set by hand |
| Which days can be marked                                       | Today and any earlier tracked day, closed periods included. Never the future                                                            |
| Marks per period                                               | Limited to Target. This replaces the PRD's "may exceed Target"                                                                          |
| Marks per day                                                  | `ceil(Target / days in period)`: one per day for most weekly and monthly Counters, up to Target for every-day ones                      |
| Day strip                                                      | The last 7 days ending today, with arrows to earlier weeks. Replaces Monday–Sunday                                                      |
| Extras                                                         | Total completed days and current streak per Counter, a progress ring above each date                                                    |
| Spaces                                                         | A Counter belongs to a space or to none, and can count every Task completed in its space                                                |
| Period that started late (creation, rule change)               | Full Target applies                                                                                                                     |
| Reopen or delete a Task whose completion is in a closed period | Closed history is kept. Only open-period completions are removed                                                                        |

Engineering calls (change if wrong):

| Call                                                                                      | Reason                                                     |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| "Every task in the space" is a switch for the Counter's own space only, subtasks included | A space-free Counter has no space to watch                 |
| Task completions respect the same day and period limits                                   | One rule for every completion                              |
| A Task completion replaces a hand-set Fail or Skip of that day                            | The activity happened                                      |
| A click on a day may remove a Task completion                                             | The grid is the user's record                              |
| Fail or Skip keeps the day's completions if there is still room, otherwise replaces them  | Marks the rest of a partly done day                        |
| Deleting a space leaves its Counters, space-free                                          | History is permanent                                       |
| A hand-set Fail in the open period resets the streak at once                              | The period can no longer be Met                            |
| An archived gap neither breaks nor extends a streak                                       | Archiving is a pause                                       |
| A Task in a live series is linked through the series                                      | PRD default                                                |
| Turning a linked Task into a series moves the link to the series                          | Keeps "series Tasks are linked by series" true             |
| Linking an already Done Task creates nothing                                              | Only the transition to Done counts                         |
| Done → Cancelled behaves like reopen                                                      | The Task is no longer done                                 |
| "Every 2 weeks" blocks start on the Monday of the creation week                           | Counted from creation, still Monday-aligned                |
| A new rule starts the day after the current period ends; that first period may be shorter | No overlap                                                 |
| The time zone is taken from the browser at creation and is immutable                      | Changing it would move day boundaries under existing dates |
| Archiving drops the unfinished period: no snapshot, no Failed                             | Archived Counters open and close nothing                   |
| Restore resumes with the next period, even if archived minutes earlier                    | PRD                                                        |

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

Migrations `0039` and `0040`. Dates are Postgres `date` read as `YYYY-MM-DD` strings.

**`counters`**

| Column                     | Type                              | Notes                                                 |
| -------------------------- | --------------------------------- | ----------------------------------------------------- |
| `id`                       | text PK                           |                                                       |
| `workspace_id`             | text FK, cascade                  |                                                       |
| `space_id`                 | text FK null, set null            | The Counter's space                                   |
| `counts_space_tasks`       | bool                              | Any Task completed in the space counts                |
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

1. Count the hand and Task entries dated inside it: completed, skipped, failed.
2. `default fails = max(0, target − completed − skipped − failed)`.
3. Write the snapshot, `failed` including both kinds. Outcome: `failed` if `failed > 0`, else `met` if `completed ≥ target`, else `excused`.
4. Insert the default fails (`source = system`) on the last days of the period that have no entry. If empty days run out, the remainder goes on the last day.
5. Set `closed_through = end`. Apply `pending_change`; if frequency or interval changed, set `anchor_date = end + 1`.

The loop closes every missed period in order. It runs on a 60-second timer and lazily before any Counter read or write. A failure on one Counter is logged and does not block the others.

### Lifecycle and edits

- **Archive:** close ended periods, then set `archived`. No further closing.
- **Restore:** set `closed_through` to the end of the period containing today under the current rule, apply `pending_change` (re-anchoring at the next day), set `active`. Until the next day after `closed_through`, the Counter has no open period ("Resumes …") and accepts no occurrences.
- **Edit:** name and Show in Today apply at once. Frequency, interval and Target are stored in `pending_change` and apply when the open period closes (or on restore). If the open period has not started, they apply at once. Setting the current values again clears the pending change.

### Marking a day

A day is **tracked** when it falls in the open period or in a closed snapshot. Rejected unless the Counter is active, the day is tracked and `date ≤ today`.

`dayCapacity = ceil(target / days in the period)`; `others` = hand and Task entries of the period on other days. A day is set as a whole:

- `completed, count`: `count ≤ dayCapacity` and `others + count ≤ target`. Existing completions are kept first (Task ones before hand ones); Fail and Skip on the day are removed.
- `failed` / `skipped`: rejected when `others ≥ target`. Completions stay only if there is room beside them; the day's remaining slots get the status. A skip needs a non-blank reason (≤ 500 chars).
- `empty`: removes the day's entries.

A change to a closed period **resettles** it in the same transaction: default Fails are removed and recreated, and the snapshot's counts and outcome are updated.

### Day strip

Seven days ending on `until` (default: today). Per day: `tracked`, `loggable`, `fill`, counts, `canComplete` (another completion fits), `canMark` (Fail or Skip fits) and the day's entries.

`filled`: `completed ≥ dayCapacity`. `partial`: some, fewer than capacity. `empty`: none.

### Stats

- **Total:** days whose completions reached the day capacity.
- **Streak:** consecutive periods ending now. Closed, newest first: Met +1, Excused neutral, Failed ends it. Then the open period: a hand-set Fail makes the streak 0; a reached Target adds 1; otherwise it adds nothing.

## 6. Task integration

`counter-task-sync.ts` takes the caller's transaction.

- `recordTaskCompletion(tx, task, now)`: find active Counters linked to `task.id`, `task.seriesId` or `task.originSeriesId`, plus those of `task.spaceId` that count space Tasks; lock each (ordered by id) and close its ended periods. Skip it if today is before the open period, the Task already has an entry, the day is full or the Target is covered. Otherwise remove today's Fail or Skip and insert a Task completion.
- `revertTaskCompletions(tx, taskIds, now)`: for each Counter holding an entry for those Tasks: lock, close ended periods, delete entries dated in the open period, and set `task_id = null` on the rest.

| Task change                        | Where                                            | Call                         |
| ---------------------------------- | ------------------------------------------------ | ---------------------------- |
| Status → Done                      | `TasksService.commitLifecycle` (update, move)    | record                       |
| Done → To do / In progress         | `TasksService.update`, `TasksService.move`       | revert                       |
| Done → Cancelled                   | `TasksService.commitLifecycle`                   | revert                       |
| Task delete, with subtasks         | `TasksService.commitLifecycle` before the delete | revert                       |
| Space delete                       | `SpacesService` before deleting its Tasks        | revert                       |
| Series stop cancels open instances | `RecurrenceService.stop`                         | none (they were never Done)  |
| Task becomes a series              | `RecurrenceService.createSeries`                 | move its links to the series |

A Task created directly as Done has no links yet, so it needs no call. With space-wide counting, a day holds only what fits: reopening the counted Task clears that day even if another Task of the space was also finished.

## 7. API

Zod contracts in `packages/api/src/todex/counters.ts`. Controller `counters`, behind `WorkspaceGuard`; every id is checked against the caller's workspace.

| Method and path                                     | Body / query                                                                        | Returns         |
| --------------------------------------------------- | ----------------------------------------------------------------------------------- | --------------- |
| `GET /v1/counters`                                  | `status`, `until?`                                                                  | `Counter[]`     |
| `POST /v1/counters`                                 | name, frequency, interval, target, timeZone, showInToday, spaceId, countsSpaceTasks | `CounterDetail` |
| `GET /v1/counters/:id`                              | `until?`                                                                            | `CounterDetail` |
| `PATCH /v1/counters/:id`                            | any of the above except timeZone                                                    | `CounterDetail` |
| `POST /v1/counters/:id/archive`, `/restore`         |                                                                                     | `CounterDetail` |
| `PUT /v1/counters/:id/days/:date`                   | status (`completed` + count, `failed`, `skipped` + skipReason, `empty`)             | `Counter`       |
| `DELETE /v1/counters/:id/occurrences/:occurrenceId` |                                                                                     | `Counter`       |
| `POST /v1/counters/:id/links`                       | taskId                                                                              | `CounterDetail` |
| `DELETE /v1/counters/:id/links/:linkId`             |                                                                                     | `CounterDetail` |

Only the five PRD recurrences validate: (daily, 1), (daily, 2), (weekly, 1), (weekly, 2), (monthly, 1).

`Counter`: id, name, spaceId, countsSpaceTasks, frequency, interval, target, timeZone, showInToday, status, today, `period` (null when archived), `pendingChange`, `stats` (`totalDays`, `streak`), `week` (7 days).
`CounterDetail` adds `links` and `history` (all entries, newest first, each with `deletable`: not a default Fail and still markable).

The server computes periods, limits, progress and stats. The web renders them.

## 8. Web

- Sidebar: a **Counters** row in Planning → Views, before Goals.
- `/planning/counters`: Active / Archived, New counter, arrows to move the 7-day strip, date columns with progress rings, and rows grouped under collapsible space headers ("No space" last). A row shows the space-tinted initial, name, total days, streak, `X / N`, and the seven day circles. Archived rows offer Restore.
- `/planning/counters/[counterId]`: settings, the same strip, linked Tasks plus the "any task in this space" switch, history.
- Today: the same rows and date columns in a **Counters** block above the Task list.
- Day circle: **click** completes (every-day Counters with Target 2+ add one per click); clicking a full day clears it. **Right-click** (or two-finger click, long press) offers Fail, Skip… and Clear. Marks: check, partial ring, red cross, dashed amber dash, plain grey; untracked, future and already covered days are dim.
- There are no separate Completed or Skip buttons.
- Task status, move and delete mutations also invalidate the `counters` query.

## 9. Testing

- Unit (`counter-periods.test.ts`): rules, month ends, DST dates, default Fail placement, outcomes, day capacity and limits, streak and total, contracts.
- Database (`counters.db.test.ts`, `counter-task-sync.db.test.ts`; run when `COUNTERS_TEST_DATABASE_URL` is set): marking days, limits, closing and resettling, edits, archive/restore, spaces, links, Task completion, reopen and delete.
- Web: helper tests; manual pass of the list, detail and Today flows.

## 10. Later

A Stats view and best streak read `counter_periods` plus the open period; no new tables or backfill.
