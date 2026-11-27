# Todex Counters: tech spec

Source: [PRD: Todex Counters](https://claude.ai/artifact/8VRyhsunKqVsWMfdZCKjsa), 2026-11-27, plus reviews of the build the same day. Where they differ, this spec wins.

## 1. Intent

A Counter tracks how regularly a person does a repeating activity without creating a Task each time. It works like a habit tracker in the Todex style. A Counter has a repeat schedule and a goal of completions per scheduled day: one click on a day completes it, a day left alone fails, and a skip needs a reason. It lives in Planning, sits in one of the user's own sections or none, can be completed by Tasks of linked spaces, and can show in Today and Tomorrow.

Examples: Software Growth, every day, 1 per day. Sport Training, Mon, Wed, Fri, 1 per day. Drink Water, every day, 3 per day.

**Not in this change:** goals spread over a week or month ("3 times a week, any days"), a Stats view and best streak, deleting a Counter, per-Counter icons, gamification, a top-level nav item, agent or MCP tools for Counters, editing a Counter's time zone.

## 2. Decisions

Settled with the product owner:

| Question                 | Decision                                                                                                                                                                                                          |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Goal                     | A count per scheduled day, 1 by default. Replaces the PRD's Target per period                                                                                                                                     |
| Repeat                   | Every N days, chosen weekdays (every week or every 2 weeks), or monthly on one day of the month                                                                                                                   |
| Who sets each status     | Completed and Skipped are set by hand (Skipped needs a reason). Failed is the default for an untouched slot and can also be set by hand                                                                           |
| Which days can be marked | Every scheduled day up to today, including days before the Counter existed. Marking one day never locks another. Never the future                                                                                 |
| Days before the Counter  | Never failed by default                                                                                                                                                                                           |
| Marks per day            | Limited to the goal                                                                                                                                                                                               |
| Day strip                | The last 7 days, with arrows to earlier weeks                                                                                                                                                                     |
| Extras                   | Total completed days and current streak per Counter, a progress ring above each date on the list                                                                                                                  |
| Sections                 | The user's own headings on the Counters page, created, renamed, deleted and reordered there. A Counter sits in one or none. Deleting a section keeps its Counters. Sections never affect what completes a Counter |
| Links                    | A Counter links any number of spaces. Tasks can be picked only from linked spaces; with none linked, nothing can be picked                                                                                        |
| Any task counts          | One switch per Counter, off and disabled without a linked space. On: every Task completed in a linked space counts and the picked Tasks are set aside. Off: only picked Tasks count                               |
| Color                    | Each Counter has its own, from the space palette                                                                                                                                                                  |
| Show in Today/Tomorrow   | One switch. Today and Tomorrow each list the Counters scheduled that day; tomorrow cannot be marked yet                                                                                                           |
| Reopen or delete a Task  | Today's completion is removed. Earlier days keep theirs                                                                                                                                                           |
| Counter row              | One line, as in TickTick habits: initial, name, total and streak on the left; compact day circles on the right. The date bar above the list spans the full width                                                  |
| Order                    | Counters are dragged by their name side, within a section or into another; sections are dragged by their heading. Today and Tomorrow follow the same order, without headings                                      |
| Picking a day            | Clicking a date on the Counters page lists only the Counters scheduled that day and highlights that day in their rows; the circles stay editable                                                                  |
| Detail page              | The Today/Tomorrow switch sits with Edit and Archive. Links and History are collapsed until opened                                                                                                                |
| Linking Tasks            | A search field with a dropdown above the list of picked Tasks                                                                                                                                                     |

Engineering calls (change if wrong):

| Call                                                                                            | Reason                                                  |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| A monthly day past the end of a month falls on its last day                                     | Every month gets one scheduled day                      |
| "Every N days" and "every 2 weeks" count from the day the schedule took effect                  | Predictable, and earlier days follow the same rhythm    |
| A schedule or goal change starts tomorrow while today is scheduled and open, else at once       | A day in progress keeps its goal (PRD: next period)     |
| Subtasks of a linked space count like any other Task                                            | One rule per space                                      |
| Removing or deleting a space removes its picked Tasks; losing the last one turns the switch off | Picks always belong to a linked space                   |
| A picked Task moved to an unlinked space is hidden and does not count; it returns if moved back | Nothing to repair on every Task move                    |
| A Task completed on an unscheduled day counts for nothing                                       | There is no day to mark                                 |
| Task completions respect the day's goal                                                         | One rule for every completion                           |
| A Task completion replaces a hand-set Fail or Skip of today                                     | The activity happened                                   |
| A click on a full day clears it, Task completions included                                      | The grid is the user's record                           |
| Fail or Skip keeps the day's completions if there is room, otherwise replaces them              | Marks the rest of a part-done day                       |
| An unmarked or part-done day before the Counter existed ends a streak                           | A streak means consecutive days                         |
| An archived gap neither breaks nor extends a streak                                             | Archiving is a pause                                    |
| Archiving keeps today's marks and fails nothing; restore starts requiring from tomorrow         | Archiving is a pause                                    |
| Deleting a space leaves its Counters and their history                                          | History is permanent                                    |
| A Task in a live series is linked through the series                                            | PRD default                                             |
| Turning a linked Task into a series moves the link to the series                                | Keeps "series Tasks are linked by series" true          |
| Linking an already Done Task creates nothing                                                    | Only the transition to Done counts                      |
| Done → Cancelled behaves like reopen                                                            | The Task is no longer done                              |
| The time zone is taken from the browser at creation and is immutable                            | Changing it would move day boundaries under saved dates |

## 3. Approaches

**Day state**

- **Cursor plus saved days (chosen).** `closed_through` is the last day that can no longer fail by default. Closing a day writes one `counter_days` row, which keeps its goal when the Counter changes later. Open days are read from the schedule.
- A row for every scheduled day, created ahead. Simpler reads, but rows must be rewritten on every edit, archive and restore.
- Derive everything from occurrences on read. Loses old goals after an edit.

**Task integration**

- **Explicit calls inside the Task transaction (chosen).** Same pattern as `task-lifecycle.ts`; completion and occurrence commit together.
- Postgres trigger on `tasks`. Catches every writer, but puts time zone and schedule logic in SQL, which the repo does not use.
- Async event after commit. Needs retries and can leave the two out of sync.

## 4. Data model

Migrations `0039` to `0043`. Dates are Postgres `date` read as `YYYY-MM-DD` strings.

**`counters`**

| Column                     | Type                      | Notes                                                                                       |
| -------------------------- | ------------------------- | ------------------------------------------------------------------------------------------- |
| `id`                       | text PK                   |                                                                                             |
| `workspace_id`             | text FK, cascade          |                                                                                             |
| `section_id`               | text FK null, set null    | The section it sits in                                                                      |
| `color`                    | text                      | One of the space colors                                                                     |
| `counts_any_task`          | bool                      | Every Task completed in a linked space counts                                               |
| `name`                     | text                      |                                                                                             |
| `schedule`                 | jsonb                     | `{ frequency: daily, interval }`, `{ weekly, interval, weekdays }`, `{ monthly, monthDay }` |
| `target`                   | int                       | Completions per scheduled day, 1–999                                                        |
| `time_zone`                | text                      | IANA                                                                                        |
| `anchor_date`              | date                      | Origin for intervals                                                                        |
| `show_in_today`            | bool                      | Today and Tomorrow                                                                          |
| `position`                 | double                    | Order from low to high; new Counters go last                                                |
| `status`                   | enum `active`, `archived` |                                                                                             |
| `closed_through`           | date                      | Last day that is closed                                                                     |
| `pending_change`           | jsonb null                | `{ schedule, target }` from tomorrow                                                        |
| `created_at`, `updated_at` | timestamp                 |                                                                                             |

**`counter_sections`**: `id`, `workspace_id` (cascade), `name`, `position`, timestamps.

**`counter_spaces`**: `counter_id` and `space_id` (both cascade), primary key of the two, `created_at`.

**`counter_links`** (picked Tasks): `id`, `counter_id` (cascade), `task_id` (FK tasks, cascade) or `series_id` (no FK, so it survives series deletion), exactly one set (check). Unique per `(counter_id, task_id)` and `(counter_id, series_id)`. A series belongs to the space of its latest Task.

**`counter_occurrences`**: `id`, `counter_id` (cascade), `local_date`, `status` (`completed`, `skipped`, `failed`), `skip_reason`, `source` (`manual`, `task`, `system`), `task_id` (FK tasks, **set null**), `created_at`. Unique `(counter_id, task_id)` where `task_id` is not null. Index `(counter_id, local_date)`.

**`counter_days`**: `id`, `counter_id` (cascade), `local_date`, `required`, `target`, `completed`, `skipped`, `failed`, `outcome` (`met`, `excused`, `failed`), `created_at`. Unique `(counter_id, local_date)`.

`0041` converts data from the earlier per-period build: a weekly Counter becomes that weekday of its anchor, a monthly one that day of the month, both with goal 1; daily Counters keep their goal. Snapshots longer than a day and their default fails are dropped. Hand and Task marks are kept as days marked by choice. `0043` replaces the single space of a Counter with linked spaces and sections. By decision it carries nothing over: old space settings and picked Tasks are removed.

## 5. Domain rules

Pure functions in `counter-schedule.ts` and `counter-days.ts`. All date math is on local date strings; `today` is the date of `now` in the Counter's time zone.

### Schedule

| Schedule  | A date is scheduled when                                                             |
| --------- | ------------------------------------------------------------------------------------ |
| daily, N  | the days from `anchor` to the date divide by N                                       |
| weekly, N | its weekday is chosen, and the Monday-based weeks from the anchor's week divide by N |
| monthly   | its day of month is `monthDay`, or the last day when the month is shorter than that  |

### Which days are tracked

A date's goal is the saved `counter_days.target` if there is a row. Otherwise, for an active Counter whose schedule covers the date, it is the current goal (a pending change decides dates after today). Otherwise the date is not tracked.

### Closing

While an active Counter's `closed_through` is before yesterday, in one transaction holding `FOR UPDATE` on the Counter row, for each date after the cursor that is scheduled:

1. Count its hand and Task entries.
2. Write the day with `required = true`: `default fails = max(0, goal − entries)`, inserted as `source = system`. Outcome: `failed` if any fail, else `met` if `completed ≥ goal`, else `excused`.
3. Apply `pending_change`; a new schedule re-anchors at the next date.

Then `closed_through = yesterday`. It runs on a 60-second timer and lazily before any Counter read or write. A failure on one Counter is logged and does not block the others.

A day marked **by choice** (before the Counter existed, during an archive, or on the day of a restore) is saved with `required = false`: it never gets default fails, and its row is removed once it holds nothing.

### Lifecycle and edits

- **Create:** `anchor = today`, `closed_through = yesterday`.
- **Archive:** close ended days, save today by choice if it has marks, set `closed_through = today` and `archived`.
- **Restore:** apply `pending_change` from today, set `closed_through` to at least today, set `active`.
- **Edit:** name, section, color, links and the switches apply at once. Schedule and goal go to `pending_change` while today is open and scheduled, otherwise apply at once. Setting the current values again clears the pending change.

### Marking a day

Rejected unless the Counter is active, the date is tracked and `date ≤ today`. A day is set as a whole:

- `completed, count`: `count ≤ goal`. Existing completions are kept first (Task ones before hand ones); Fail and Skip on the day are removed.
- `failed` / `skipped`: completions stay only if there is room beside them; the remaining slots get the status. A skip needs a non-blank reason (≤ 500 chars).
- `empty`: removes the day's entries.

A change to a closed or saved day **resettles** it in the same transaction: default Fails are removed and recreated, and the row is updated.

### Day strip

Seven days ending on `until` (default: today). Per day: `tracked`, `loggable`, `fill`, `capacity` (the goal), counts, `canComplete` and the day's entries. `filled`: `completed ≥ capacity`. `partial`: some, fewer. `empty`: none.

### Stats

- **Total:** days whose completions reached the goal.
- **Streak:** consecutive scheduled days ending now. Saved days before today, newest first: Met +1, Excused neutral, Failed ends it. Before the creation date, an unmarked scheduled day or a part-done one also ends it. Today: a hand-set Fail makes the streak 0; a reached goal adds 1; otherwise it adds nothing.

## 6. Task integration

`counter-task-sync.ts` takes the caller's transaction.

- `recordTaskCompletion(tx, task, now)`: find active Counters that link `task.spaceId` and either count any task or have picked `task.id`, `task.seriesId` or `task.originSeriesId`; lock each (ordered by id) and close its ended days. Skip it if today is not tracked, the Task already has an entry, or the goal is reached. Otherwise remove today's Fail or Skip and insert a Task completion.
- `revertTaskCompletions(tx, taskIds, now)`: for each Counter holding an entry for those Tasks: lock, close ended days, delete today's entries (active Counters), and set `task_id = null` on the rest.

| Task change                        | Where                                            | Call                          |
| ---------------------------------- | ------------------------------------------------ | ----------------------------- |
| Status → Done                      | `TasksService.commitLifecycle` (update, move)    | record                        |
| Done → To do / In progress         | `TasksService.update`, `TasksService.move`       | revert                        |
| Done → Cancelled                   | `TasksService.commitLifecycle`                   | revert                        |
| Task delete, with subtasks         | `TasksService.commitLifecycle` before the delete | revert                        |
| Space delete                       | `SpacesService` before deleting its Tasks        | unlink the space, then revert |
| Series stop cancels open instances | `RecurrenceService.stop`                         | none (they were never Done)   |
| Task becomes a series              | `RecurrenceService.createSeries`                 | move its links to the series  |

A Task created directly as Done has no links yet, so it needs no call.

## 7. API

Zod contracts in `packages/api/src/todex/counters.ts`. Controller `counters`, behind `WorkspaceGuard`; every id is checked against the caller's workspace.

| Method and path                                     | Body / query                                                                           | Returns            |
| --------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------ |
| `GET /v1/counters`                                  | `status`, `until?`                                                                     | `Counter[]`        |
| `POST /v1/counters`                                 | name, schedule, target, timeZone, showInToday, sectionId, color                        | `CounterDetail`    |
| `GET /v1/counters/:id`                              | `until?`                                                                               | `CounterDetail`    |
| `PATCH /v1/counters/:id`                            | any of the above except timeZone, or spaceIds (the whole set), countsAnyTask, position | `CounterDetail`    |
| `POST /v1/counters/:id/archive`, `/restore`         |                                                                                        | `CounterDetail`    |
| `PUT /v1/counters/:id/days/:date`                   | status (`completed` + count, `failed`, `skipped` + skipReason, `empty`)                | `Counter`          |
| `DELETE /v1/counters/:id/occurrences/:occurrenceId` |                                                                                        | `Counter`          |
| `POST /v1/counters/:id/links`                       | taskId                                                                                 | `CounterDetail`    |
| `DELETE /v1/counters/:id/links/:linkId`             |                                                                                        | `CounterDetail`    |
| `GET /v1/counter-sections`                          |                                                                                        | `CounterSection[]` |
| `POST /v1/counter-sections`                         | name                                                                                   | `CounterSection`   |
| `PATCH /v1/counter-sections/:id`                    | name, position                                                                         | `CounterSection`   |
| `DELETE /v1/counter-sections/:id`                   |                                                                                        | `{ ok }`           |

`Counter`: id, name, sectionId, color, spaceIds, countsAnyTask, position, schedule, target, timeZone, showInToday, status, today, `progress` (`today`: completed and goal, or null; `nextDate`), `pendingChange`, `stats` (`totalDays`, `streak`), `week` (7 days).
`CounterDetail` adds `links` (picked Tasks in linked spaces, each with its `spaceId`) and `history` (all entries, newest first, each with `deletable`: not a default Fail and the Counter active). Picking a Task outside the linked spaces is rejected.

The server computes schedules, limits, progress and stats. The web renders them.

## 8. Web

- Sidebar: a **Counters** row in Planning → Views, before Goals.
- `/planning/counters`: Active / Archived and a New menu (Counter, Section); a full-width date bar with progress rings and arrows beside the dates; rows grouped under the user's collapsible sections, then "No section". A section heading has Rename and Delete; an empty section offers "+ New", which starts a Counter in it. A row shows the Counter's colored initial, name, total and streak on the left and seven compact day circles on the right; hovering the name shows the repeat rule. Archived rows offer Restore. "Back to today" appears in the page header while an earlier week is shown. Clicking a date picks that day (again, or "Show all", clears it). Dragging a row by its name reorders it or moves it to another section; dragging a heading reorders sections (onto "No section" moves one to the end).
- `/planning/counters/[counterId]`: header with the Today/Tomorrow switch, Edit and Archive; one card with Total / Streak / Today tiles filling its left side, and dates over day circles between the week arrows on the right; collapsed **Links** and collapsed **History**.
- Links: a card in two columns that stack on narrow screens. **Spaces** lists the linked spaces with remove buttons and "Add space". **Tasks** has the "Any task counts" switch and info tooltip in its heading; when on, a line says which spaces count; when off, a keyboard-friendly search field (disabled with "Link a space first" until a space is linked) that stays open to pick several Tasks, above the picks, each marked with its space color.
- Form: name; repeat (Daily with "every N days", Days of the week, Monthly); times per day; section; color; Show in Today/Tomorrow.
- Today and Tomorrow: a **Counters** block with the same rows and no date header, listing the Counters scheduled that day in the saved order. Tomorrow's strip ends on tomorrow.
- Day circle: **click** adds a completion (a goal of 2+ takes one click each); clicking a full day clears it. **Right-click** (or two-finger click, long press) offers Fail, Skip… and Clear. Marks: check, ring with the count, red cross, dashed amber dash, open circle; a dashed circle is upcoming and a dot is off the schedule.
- Task status, move and delete mutations also invalidate the `counters` query.

## 9. Testing

- Unit (`counter-schedule.test.ts`, `counter-days.test.ts`): schedules, month ends, intervals, settlement, day limits, streak and total.
- Database (`counters.db.test.ts`, `counter-task-sync.db.test.ts`; run when `COUNTERS_TEST_DATABASE_URL` is set): marking days, closing and resettling, days before creation, edits, archive/restore, sections, linked spaces and picks, Task completion, reopen and delete.
- Web: helper tests; manual pass of the list, detail, Today and Tomorrow screens.

## 10. Later

A Stats view and best streak read `counter_days` plus today; no new tables or backfill.
