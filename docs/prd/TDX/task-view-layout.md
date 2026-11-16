# TaskView layout

| Field           | Value                                                 |
| --------------- | ----------------------------------------------------- |
| Status          | Draft                                                 |
| Scope           | TDX                                                   |
| Apps / packages | `apps/todex-web`, `apps/todex-api`, `@repo/api/todex` |
| Created         | 2026-11-05                                            |

## Problem

Planning TaskView is one Details card. Status, priority, stage, schedule, and progress sit in that card. Acceptance criteria sit in a second card. Description and subtasks sit in the main column with borders. Outcome, complexity, several schedule slots, and references are missing.

Repeat currently moves the same task forward on completion (`completeRecurringTask`). That erases the finished occurrence. Recurrence needs a stable series, one task per occurrence, and calendar previews that are not rows yet.

## Goals

- Planning TaskView matches the approved layout: main column (title, chips, outcome, description, acceptance criteria, subtasks, references) and sidebar (Progress, Execution, Organization, Timeline).
- Task Progress and Time Used use the formulas in this PRD. Reaching 100% does not mark the task Done. Marking Done below 100% warns and does not block.
- A task has 0–10 schedule slots. Each slot has its own start and end. Estimate, schedule, and executed time are separate.
- A root task can repeat as a series of independent instances. Subtasks cannot repeat.
- Completing, cancelling, or deleting a parent cancels or deletes unfinished subtasks only after the user confirms and only after execution has already stopped. The transition does not stop execution itself. Completed subtasks and execution history stay on Done and Cancelled.

## Non-goals

- Do not change the breadcrumb or the docked/fullscreen toggle. Leave `TasksBreadcrumb`, `readTaskViewMode`, and `writeTaskViewMode` as they are.
- Do not restyle `calendar-task-view.tsx` or `execution-task-detail.tsx` beyond the data they must read (slots, series, retired slots).
- Do not add Comments, Notes, or section dividers.
- Do not add a Research entity. Do not build conversation sharing. Access stays `canReadConversation`, owner-only, so a later sharing change replaces that function only.
- Do not add an Owner or Executor control to TaskView. Owner is attribution on the task. Workspace membership is the visibility boundary. Executor stays on the execution session.
- Do not validate the title as "verb + object + context".
- Do not block quick create, save, or execution start on an empty Outcome.
- Do not change Kanban or list progress. `taskChecklistProgress` stays for `task-kanban.tsx`.
- Do not show or edit `tasks.color` in TaskView. Calendar blocks still read it.
- Do not add the `lucide-react` package. Property icons are Lucide glyphs as inline SVGs in `apps/todex-web/src/components/icons.tsx`.
- Do not add task dependencies. That is a separate PRD.
- Do not render more than 30 days of recurring previews, and do not persist those previews.
- Do not generate instances whose period has not started.
- Do not add a relocate wizard to space deletion. Moving a root task to another space is the relocation path. Deleting the space then deletes what remains.
- No backward compatibility for stored data. There is no production database to preserve. Do not backfill `schedule_date`. Reset the local database.
- Legacy Repeat (shift the same task forward in `completeRecurringTask`) stays only until slice 4, and only for root tasks that already use it. Do not add slots, an anchor, or new behavior to that path. Slice 4 deletes it in the same change that adds series. After slice 4 there is one repeat model.

## User stories

### Read the task in the approved layout

**As a** signed-in user, **I want** the task body and its properties in the approved groups, **so that** I can scan outcome, criteria, and schedule without a single details card.

**Acceptance criteria**

- [ ] The main column order is title, chips, Outcome, Description, Acceptance Criteria, Subtasks, References.
- [ ] Chips under the title are Status, Priority, Estimate, and Progress. Estimate and Progress are read-only. Status and Priority still edit the task.
- [ ] The sidebar groups are Progress, Execution, Organization, Timeline, in that order.
- [ ] Group headers and the References heading have no icon. Each sidebar property has a Lucide glyph. A collapse chevron is allowed on a header.
- [ ] Main sections are separated by whitespace, not dividers or bordered cards.
- [ ] Outcome is plain text, max 500 characters. Quick create does not ask for it. An empty value shows `Add an outcome before you execute.` and still saves.
- [ ] Adding the first acceptance criterion, subtask, reference, or schedule slot expands that section if it was collapsed. Emptying the section leaves it as the user left it.

### See progress and time without double counting

**As a** signed-in user, **I want** progress and time to describe this task, **so that** subtask work is visible and not added twice.

**Acceptance criteria**

- [ ] With both remaining direct subtasks and acceptance criteria, progress is half the subtask ratio plus half the criteria ratio.
- [ ] With only one of those groups, that group is the whole percent.
- [ ] With neither group, progress is 0% until status is Done, then 100%.
- [ ] A direct child counts as done only when its status is `done`. `in_progress` stays in the denominator. `cancelled` children are in neither count.
- [ ] When every remaining direct subtask is Done, the subtask ratio is 100%. When every direct child is cancelled, the subtask group is absent.
- [ ] The subtask header and the Progress group both show `done/remaining` or the percent, and `N cancelled` when any direct child is cancelled. The percent still excludes those children.
- [ ] Checking the last criterion or subtask does not change the task status.
- [ ] Setting status to Done while progress is under 100% asks for confirmation and then saves.
- [ ] The Progress chip and the Progress group show the same rounded percent.
- [ ] Executed and Time Used use this task's sessions only. When it has subtasks, a separate line shows their executed total and is not added into Time Used.
- [ ] Starting execution outside a slot does not create or edit a slot.

### Plan several slots

**As a** signed-in user, **I want** up to 10 slots with their own lengths, **so that** the estimate stays a separate number.

**Acceptance criteria**

- [ ] Each slot has `id`, `startAt`, and `endAt`. Due is still one date. Slots and Due are independent.
- [ ] Create, edit, delete, drag, and resize apply to one slot. The task estimate does not change.
- [ ] The eleventh slot is rejected in the client and the API.
- [ ] Overlaps with another slot, another task, or a calendar event show a warning and still save.
- [ ] Done or Cancelled tasks drop future slots from Today and the calendar. The rows remain. Reopening the task does not put those slots back.

### Complete a parent without losing history

**As a** signed-in user, **I want** a warning before a parent completion cancels leftover subtasks, **so that** finished work and session history remain.

**Acceptance criteria**

- [ ] Confirming Done or Cancelled on a parent with unfinished subtasks states that those subtasks will be cancelled.
- [ ] Subtasks that are already Done stay Done. Their sessions and execution results stay.
- [ ] The parent status does not change until subtask execution is already stopped. The transition does not close intervals or remove queue rows while a session or job is still active.
- [ ] A new session cannot start on the parent or those subtasks while the transition is in progress.
- [ ] Creating, deleting, reparenting, or moving a subtask cannot change that parent's child set while the transition lock is live. The committed transition cancels the unfinished children read under the parent row lock.
- [ ] A subtask status change during that lock does not save. After the parent transition commits, a retry with the old version conflicts and shows the cancelled subtask. After abort, the same status change saves once.
- [ ] A failed attempt leaves every status, interval, and queue row unchanged. Retrying with the same transition id finishes the write once execution is stopped.
- [ ] Deleting a parent asks for confirmation, uses the same execution guard, then deletes its subtasks and their history.
- [ ] Clearing Parent on a subtask makes it a root task. Its status, estimate, slots, outcome, and criteria stay.
- [ ] Moving a parent to another space moves its subtasks with it. Moving a subtask to another space on its own clears its parent.
- [ ] A section or epic that does not belong to the destination space is cleared. Section becomes the destination default.

### Repeat a root task

**As a** signed-in user, **I want** each occurrence to be its own task, **so that** an unfinished one stays when the next period starts.

**Acceptance criteria**

- [ ] Repeat is shown only on a root task. The API rejects a recurrence rule on a subtask.
- [ ] One occurrence creates one task instance, however many slots it has.
- [ ] The server creates an instance when that occurrence's period has started, even if the previous instance is not Done.
- [ ] Previous unfinished instances stay on the board.
- [ ] A new instance copies the template, with new task and subtask ids, status To Do, criteria unchecked, and no execution sessions.
- [ ] The calendar shows previews for occurrences in the next 30 days that are not instances yet. A preview and its instance never appear together.
- [ ] Turning Repeat on does not create a schedule slot. The series anchor is its own instant.
- [ ] Edit this task, edit this and future, skip, stop repeating, and delete series follow the rules in Repeat below.
- [ ] Stop Repeating is available in the same release that can turn Repeat on.
- [ ] A rule edit applies immediately. It does not schedule a future rule, and it does not create occurrences before now.
- [ ] "This and future" tells the user that existing tasks keep their subtasks and that only new occurrences get a subtask change.
- [ ] Changing Weekly to Daily keeps the existing instance at that occurrence anchor. A second task is not created there. Its id, history, overrides, and slots stay. A later day that has no instance yet is a new task. Overlapping slots stay a warning on one task.
- [ ] Delete series keeps every existing task instance and stops future generation.

## Functional requirements

1. Title remains `tasks.summary`. Placeholder: `Action verb + object + context`. Any non-empty summary saves.
2. Outcome is plain text, max 500 characters after trim, default `''`. Quick create (`TaskComposer`, create menu) omits it. Empty is valid on create, update, and execution start. TaskView shows the hint when it is empty.
3. Description stays sanitized HTML and `TaskDescriptionEditor`.
4. Acceptance criteria stay per task, including on a subtask. Header count is `done/total` for that task's own criteria.
5. Subtasks are direct children of a root task. Each row shows a done checkbox (`statusAfterDoneToggle`), the summary (opens that task), and that subtask's estimate. Header count is `done/remaining`, remaining excludes `cancelled`, plus `N cancelled` when that count is greater than 0. Add-subtask exists only on a root task. A level-2 task does not render Subtasks.
6. References stay the last main section. Heading has a count and no icon. Removing a reference deletes the pin only. Deleting a doc or conversation cascades the pin. GET omits a conversation the caller cannot read.
7. Sidebar Progress contains Task Progress and Time Used. When the task has any direct subtask, Time Used also shows `Subtasks {duration}` from those children's sessions. That number is not added to the parent's executed time or to the Time Used bar.
8. Task Progress uses `taskProgressPercent`. Display with `Math.round`. Parent progress uses the parent's own criteria and the status of its direct subtasks. It does not read a subtask's criteria. The Progress group shows `N cancelled` beside the percent when that count is greater than 0, the same count as the subtask header. The chip stays the percent alone.
9. Time Used is this task's `actualTime` seconds divided by this task's `estimation` minutes times 60. The label includes percents above 100. The bar fill is `min(percent, 100)`. Slot length is not an input.
10. Sidebar Execution contains Estimate, Executed, Progress Stage, and Complexity. The label is Progress Stage. The column stays `progressStageId`. Executed is this task's session time only. Progress Stage may be empty and does not change the percent.
11. Complexity is null, Low, Medium, or High. Null is shown as None.
12. Organization contains Space, Section, Epic, Goal, and Parent. Parent options are root tasks except this task. Clearing Parent converts a subtask into a root task.
13. Timeline contains Schedule, Due, and Repeat. Repeat is hidden on a subtask. Schedule and Due are independent. Estimate, slots, and executed time are independent.
14. A task has at most 10 slots, each `{ id, startAt, endAt }` with `endAt` after `startAt`. Timed slots are at least 15 minutes. Empty list means unscheduled. Identical ranges are rejected. Overlaps are allowed.
15. A new slot from a date with no times is 09:00–10:00 local. That hour does not read `estimation`. An all-day calendar drop is local midnight through the next local midnight.
16. Collapse state is `useState`, reset when `task.id` changes, not persisted. Initial open state: Outcome open; Description open when it has visible text; Acceptance Criteria, Subtasks, and References open when their count is greater than 0; Progress, Execution, and Organization open; Timeline open when there is a slot, a due date, or a series. Transition from 0 to 1 item in Acceptance Criteria, Subtasks, References, or Schedule sets that section open. Transition to 0 does not close it.
17. Status Done or Cancelled is the only completion path in this view. There is no Mark done button.
18. Depth is two levels. Create and `parentTaskId` update use the same server check.

### Progress formula

```text
remaining     = direct children whose status is not cancelled
subtaskRatio  = remaining with status done / remaining count
criteriaRatio = criteria with done / criteria length

both groups present       → 50% * subtaskRatio + 50% * criteriaRatio
only remaining subtasks   → subtaskRatio
only criteria             → criteriaRatio
neither, status done      → 100%
neither, any other status → 0%
```

A group exists only when its denominator is greater than 0. A cancelled task with neither group is 0%.

### Schedule slots

- Rows live in `task_schedule_slots`. There is no `schedule_date` and no timestamp array.
- One calendar block per slot that is not retired, on tasks whose status is not `done` or `cancelled`. Parent and subtask blocks both show. A subtask block shows the summary and the label `Subtask`.
- Drag moves one slot and keeps its duration. Resize writes that slot's `startAt` and `endAt`. Other slots and `estimation` stay.
- Today and Tomorrow include a task when any non-retired slot overlaps `[from, to)`: `startAt < to && endAt > from`.
- Overlap warnings compare the slot with sibling slots, other tasks' non-retired slots in the workspace, and calendar events in range. The warning names the other title. Save still succeeds.
- When status becomes `done` or `cancelled`, set `retired_at` on every slot whose `endAt` is after the transition time. Past slots stay unretired and remain history. Reopening (`todo` or `in_progress`) does not clear `retired_at`.
- Execution outside a slot does not insert or resize a slot.
- Task and slot writes send `version`. The update matches that version and increments it in the same statement. A mismatch returns 409 and does not write slots. The client refetches and shows `This task changed. Review the schedule and try again.`

### Hierarchy and lifecycle

Server check on create and on every parent change:

- The new parent, when set, is in the workspace and has `parentTaskId = null`.
- The task being given a parent has no children.
- Self-parent is rejected.
- `assertAcyclic` stays as a backstop.
- Failure message: `Tasks can only be nested one level deep`.

Space moves reuse the existing placement rules:

- Moving a root task copies `spaceId` onto its direct subtasks. Section becomes the destination default when the current section is not in that space. Epic is cleared when it is not in that space. Subtasks stay children. Slots stay.
- Moving a subtask to another space sets `parentTaskId` null, then applies the same section and epic cleanup. It is a root task in the new space.
- Moving a subtask inside the same space to another root keeps it a subtask.

Status transitions for a parent with at least one direct child that is not `done` and not `cancelled`:

- The client confirms: unfinished subtasks will be cancelled. If progress is under 100%, the same dialog also states the percent. Confirmation is required. It is not a hard block.
- Done below 100% with no unfinished subtasks still confirms, then saves.
- Done at 100% with no unfinished subtasks saves without that dialog.
- Cancelled with no unfinished subtasks saves without the subtask dialog.

The transition never closes an interval, never calls `closeTracking` or `finishSession`, and never removes an `execution_queue` row until execution is already stopped and the status or delete write commits.

`task_lifecycle_locks` holds one row per affected task id: `task_id` primary key, `transition_id`, `action` (`done`, `cancelled`, or `delete`), `expires_at`. The affected set is the parent plus every unfinished subtask. The parent is included when it has an open execution interval, a queue row, or neither.

Acquire locks the task rows `FOR UPDATE` in ascending id order, then inserts the lock rows, in that one transaction. A second transaction waits on the row locks, sees the inserted rows, and returns 409 `lifecycle_in_progress`. An expired row (`expires_at <= clock_timestamp()`) does not count as held. The acquire deletes expired rows for those ids only after it holds the task-row locks, then inserts. Two acquires cannot both insert.

A live parent lock also freezes that parent's child set. Create subtask, delete subtask, reparent, and a move that sets or clears `parentTaskId` are child-set changes. Moving a root task together with its current children is not one: membership stays. Each child-set change locks the subtask row, when it already exists, and every parent whose set would change, `FOR UPDATE` in ascending id order, in the transaction that would write the membership. It then rejects the write when any of those parents has a lock row with `expires_at > clock_timestamp()`. The response is 409 `lifecycle_in_progress`. The child set is unchanged. A dead lease does not reject the membership write. The same id order as acquire is required so a child-set write and a lifecycle acquire cannot deadlock.

A direct child's status write takes that subtask row and its parent row `FOR UPDATE` in that same id order, in the transaction that would change status. A live parent lifecycle lock returns 409 `lifecycle_in_progress`. Status and `version` stay. The client refetches and does not flip the checkbox. Retry after the lock is gone is deterministic: if the transition committed and cancelled that child, the stale `version` returns 409 `conflict` and the refetch shows the cancelled subtask; if the transition aborted or the lease expired without a write, the same status patch commits once. The lifecycle transaction holds those row locks from the re-read through the cancel, so a status patch cannot commit between them. A status patch that committed before acquire is already in the set acquire locked. Already-Done children are not cancelled.

A lock authorizes a write only inside a transaction that still sees `expires_at > clock_timestamp()` and the same `transition_id`. A check from the previous request does not count. Refresh is `UPDATE task_lifecycle_locks SET expires_at = :next WHERE task_id = :id AND transition_id = :transitionId AND expires_at > clock_timestamp()`. Zero rows means the lease is dead. The caller gets 409 `lease_expired` and writes no status, no queue change, and no new lease. The lease is 2 minutes.

Start, enqueue, and focus take the same task-row locks, in the same id order, in the transaction that would insert the interval or queue row. They reject the task when a non-expired lock exists. That check and the insert commit together, so a lease cannot expire between the check and the insert without one of the two transactions waiting. Pause and complete do not take this reject path. The lock does not stop a session that is already open.

Termination is observed under those task-row locks. It is true only when the parent and every locked subtask have no open interval and no agent job with `focalType = task`, that `focalId`, and status `running` or `awaiting_confirmation`. Queue rows may still exist. If it is false, refresh the lease with the predicate above and return 409 `execution_still_active`. Intervals, queue rows, and statuses stay.

When termination is true, that same transaction does the rest. It does not start a second transaction after releasing the locks:

- Re-read the lock rows with `expires_at > clock_timestamp()` and this `transition_id`. If any affected id fails that predicate, roll back and return 409 `lease_expired`.
- Re-read direct children while the parent row lock is still held. The unfinished child ids must equal the subtask ids locked for this `transition_id`. If a child was added, removed, or its status no longer matches that unfinished set, roll back and return 409 `lifecycle_in_progress`. Do not cancel a set captured at acquire time. Do not cancel a child that is already Done.
- `UPDATE` the parent `WHERE version = :expected`, set the new status, `version = version + 1`, and `updated_at`. Zero rows rolls back with 409 `conflict`.
- Set that re-read unfinished set to `cancelled` and increment each of their versions. Do not update subtasks that are already Done. Do not delete session rows or `task_execution_results`.
- Retire future slots, as in Schedule slots.
- Delete `execution_queue` rows for the parent and for the subtasks whose status just became `cancelled`. This is the first time those rows are removed.
- Delete the lock rows.

Abort (`POST /v1/tasks/:taskId/lifecycle/:transitionId/abort`) deletes lock rows for that id only where `expires_at > clock_timestamp()`, and changes nothing else. An already expired lease is not an abort of a committed write. Expiry does not close intervals.

Retry with the same `transition_id` is safe. If the parent is already in the requested status and every previously unfinished subtask is `cancelled`, return the current task. If this id still holds a live lease and execution is active, return 409 `execution_still_active`. A dead lease returns 409 `lease_expired` and the client must acquire again. A version mismatch returns 409 `conflict` and does not cancel a subset.

Delete parent uses the same acquire, the same parent-and-subtask termination check, the same child-set re-read, and the same single write transaction. A mismatched unfinished set returns 409 `lifecycle_in_progress` and deletes nothing. The confirm copy states the subtask count and that execution history will be deleted. After termination, that transaction deletes the parent. Children and their history cascade. Queue rows for the parent and the subtasks are deleted in that transaction, not before. If the delete does not commit, the tasks, intervals, and queue rows stay. A dead lease does not delete them.

A subtask keeps its own status, estimate, executed time, slots, outcome, and acceptance criteria. Parent completion does not mark unfinished subtasks Done.

### Repeat

Repeat is one series per root task. Completing an instance does not move its dates and does not create the next instance. Slice 4 deletes `completeRecurringTask`. Until that slice, root Repeat stays the legacy shift and is not extended.

**Series** (`recurring_series`): id, workspace id, `anchor` timestamptz not null, `rule` (`TaskRecurrence`, including `timeZone`), `rule_version` integer not null starting at 1, `stopped_at` null until Stop Repeating, `rule_effective_at` timestamptz not null, `cursor_rule_version` integer not null, `generated_through` text null, timestamps. `rule.timeZone` is the only timezone. `anchor` is the recurrence anchor, not a schedule slot. `rule_effective_at` is the first instant the current rule may generate. It starts equal to `anchor` and is always `<= now` after a rule edit. There is one active rule. MVP does not store a pending or future-dated rule. `cursor_rule_version` starts at 1 and `generated_through` starts null.

Enabling Repeat writes the series and the first template version with `effective_at` equal to `anchor`. It does not insert a slot. The anchor control is required. It prefills from the earliest slot start, otherwise the due date at the start of that local day, otherwise today at 09:00 local. The user can change that instant before save. Saving stores only the anchor.

**Instance:** a normal task with `series_id`, `occurrence_key`, `occurrence_anchor`, and `origin_series_id`. The key is `{ruleVersion}/{localKey}`. `localKey` is the occurrence anchor formatted in that rule version's timezone as `yyyy-MM-dd'T'HH:mm`. `occurrence_anchor` is that same instant as `timestamptz`, stored when the instance is inserted and not rewritten when the rule changes. Unique `(series_id, occurrence_key)` and unique `(series_id, occurrence_anchor)` where `series_id` is not null. A new `rule_version` cannot collide with an older key, and an exception for version 1 does not match version 2. The anchor unique index is what stops a second instance at that instant. `origin_series_id` is a text copy of the series id with no foreign key. The key and the anchor are kept after detach, including the key's rule version.

**Template versions** (`series_template_versions`): `id`, `series_id`, `effective_at` timestamptz, `template` jsonb. Unique `(series_id, effective_at)`. The version for an occurrence is the row with the greatest `effective_at` that is still `<=` that occurrence's anchor. "This and future" inserts a new version. It does not update an older version. One mutable template cannot do this, so the versions stay.

A template stores summary, outcome, description, estimation, priority, complexity, progress stage id, space id, section id, epic id, goal id, owner id, acceptance criteria with `done: false`, references (`doc`, `conversation`, or `url`), subtask templates (same scalar fields, criteria, and slot offsets, no series id), slot offsets, and due offset. It does not store session ids or execution results. Slot offsets are `{ dayOffset, startLocal, endLocal }` from the anchor's local date. Due offset is a day count. Zero offsets means the instance has no slots. Generation adds `dayOffset` with `addCalendarDays` in `rule.timeZone` and applies the local clock times. Do not shift by a fixed UTC millisecond delta. A version holds at most 10 slots.

**Generation** (`RecurrenceService.materializeDue`):

- Build candidates only for the active `rule_version`, from `rule_effective_at` through `now`. Skip the series when `rule_effective_at` is still in the future. Each candidate key is `{rule_version}/{localKey}`.
- Do not resume from the latest existing `occurrence_key`, and do not treat `generated_through` from another `cursor_rule_version` as proof.
- A key is satisfied when a `series_exceptions` row has that exact key, or an instance with `series_id` equal to this series has `occurrence_anchor` equal to the candidate instant. An exact `occurrence_key` match is the same case when the key was written for this version. Insert the unsatisfied keys in local-key order. Do not insert a second task when the anchor matches an existing instance of this series. Leave that task's id, `occurrence_key`, history, overrides, and slots as they are. That anchor match lets the cursor pass the candidate.
- `generated_through` stores the local key through which every earlier candidate of `cursor_rule_version` is satisfied. A null value means none of that version is proven. Never move it past a hole. Never leave it pointing at a previous rule version.
- The cursor update is in the same transaction as the inserts: `UPDATE recurring_series SET generated_through = :localKey, cursor_rule_version = :version WHERE id = :id AND cursor_rule_version = :version AND generated_through IS NOT DISTINCT FROM :previous`. Zero rows rolls the inserts back.
- Each call inserts at most 30 rows, then stops. The next call continues from the first hole of the current version. The due set, not the cursor, is the candidate list.
- Insert with `ON CONFLICT DO NOTHING` on `(series_id, occurrence_key)` and on `(series_id, occurrence_anchor)`. A second tick does not create a second task. A new rule version does not hit the key conflict against the old version's keys. It does hit the anchor conflict when the instants are equal, and that conflict inserts nothing.
- Do not create an anchor that is still in the future. Do not invent keys before `rule_effective_at`. Instances from earlier rule versions stay where they are.
- Run it on a 60 second interval inside `TasksModule` and at the start of the calendar range read. No new scheduler package.
- Copy the effective template version. New ids for the instance and its subtasks. Status `todo`. Criteria unchecked. No sessions. `overridden_fields` is empty. `origin_series_id` equals `series_id`. Slots are absolute instants from the offsets, or none. References are new pin rows.
- Unfinished older instances are left as they are.

**Exceptions** (`series_exceptions`): `series_id`, `occurrence_key`, `kind` `skipped` or `deleted`. Unique `(series_id, occurrence_key)`. The key includes `rule_version`. The generator and the preview match the whole key. A rule change does not delete or rewrite exception rows, so an old exception cannot suppress a new version's local time.

**Overrides:** `tasks.overridden_fields` lists fields edited with "this task only". Names are the template scalars plus `slots`, `dueDate`, `acceptanceCriteria`, `references`, and `subtasks`.

**This task only:** patch that instance, append the field names, increment `version`. Do not insert a template version. Do not patch any other instance.

**This and future:** insert a template version with `effective_at` equal to the selected occurrence's anchor. Do not update earlier versions. This effective date is for template content. It does not defer a rule change. Patch existing instances of this series whose anchor is `>=` that instant, whose status is `todo`, which have no open interval, and which have not overridden that field. The fields written on those instances are the supported scalars: summary, outcome, description, estimation, priority, complexity, progressStageId, spaceId, sectionId, epicId, goalId, and dueDate. Acceptance criteria, references, and slots stay in that patch when the field is not overridden. Increment each patched task's `version`. Do not write an instance with an earlier anchor. Do not write `done`, `cancelled`, or `in_progress` instances, or an instance with an open interval. Do not add, remove, or reorder subtasks on instances that already exist. Subtask structure in the new version applies only to instances generated after `effective_at`. When the edit changes subtasks, confirm with `Existing tasks keep their subtasks. New occurrences use this subtask list.` Do not present those existing tasks as receiving the new subtask list.

**Rule change** (frequency, timezone, or anchor) applies immediately, in one transaction. A selected future occurrence does not become the effective date.

- Reject a future effective instant with 400 `Rule changes apply immediately`. Do not write `rule` or `rule_effective_at` on that failure.
- Increment `rule_version`. Set `rule`. Set `rule_effective_at` to `clock_timestamp()`. That value is `<= now`. Do not set it to a future occurrence, and do not set it to the next anchor after now. The previous rule remains the generator until this transaction commits.
- Do not backfill new-rule occurrences from an older anchor through now. The next occurrence is created only when its period has started and its anchor is `>= rule_effective_at`.
- Set `cursor_rule_version` to the new `rule_version` and `generated_through` to null. A partial catch-up on the old version does not count as progress for the new one.
- Do not delete a task, do not clear `overridden_fields`, do not rewrite `occurrence_key`, and do not move slots on an existing instance.
- Do not delete or rewrite exceptions. They keep the old `{ruleVersion}/{localKey}` and do not match the new version.
- Materialization and previews use this new version only while `rule_effective_at <= now`, and only for anchors `>= rule_effective_at`. A template version may still be effective at a later occurrence. That does not keep the old rule active.
- A timezone change formats new local keys in the new timezone and prefixes the new `rule_version`. Old keys stay the strings they were given.
- An anchor change does not shift existing instances. New keys stay distinct from old keys. When a new version's occurrence instant equals an existing instance's `occurrence_anchor`, generation does not create another task and does not rewrite the existing one.
- Two schedule slots may overlap on that kept task, or on another task. Slot overlap is a warning and still saves. It is not an occurrence identity. Occurrence identity is the series plus `occurrence_anchor`. A later slot on the same instance, or an overlapping slot on a different series, is not a duplicate instance.
- Instances whose keys fall off the new rule remain visible, keep their ids and history, and stay attached. They are not cancelled and not detached by the rule edit.

**Cancel one instance:** set that task to `cancelled`. The series stays active. Other instances are not cancelled.

**Delete one instance:** use the lifecycle lock and termination observation. After termination, delete the task and insert a `deleted` exception for its key in that same transaction. The generator must not recreate it. If termination is false, delete nothing and insert no exception.

**Stop Repeating** and **Delete Series** are different actions. The Repeat menu shows both names. Stop Repeating confirms with `Stop repeating? No further tasks will be created. Future To Do tasks that have not started will be cancelled. Tasks already in progress, done, or cancelled stay as they are.` Delete Series confirms with `Delete this series? Existing tasks stay, including done and cancelled tasks and their history. No further tasks will be created. This action cancels nothing.`

**Stop Repeating:** set `stopped_at`. Cancel instances that are `todo`, have no sessions, and whose anchor is after now. Keep every other instance, including cancelled ones. Previews stop. The instance the user has open is not cancelled by this action. `materializeDue` ignores a stopped series.

**Delete Series** removes the series and keeps every task instance. It does not delete tasks, sessions, or execution results. It does not cancel tasks. The API `DELETE /v1/series/:seriesId` returns `{ kept: number }`. In one transaction: set each instance's `origin_series_id` to the series id if it is empty, set `series_id` null, leave `occurrence_key` (rule version included), delete exception rows, delete template versions, delete the series. Previews stop because the series is gone. `origin_series_id` plus `occurrence_key` is the provenance after detach.

### Calendar previews

For each active series (`stopped_at` is null), compute occurrences whose anchor is after now, `>= rule_effective_at`, and within 30 days, using the current `rule_version`. Drop a preview when that full `{ruleVersion}/{localKey}` has an exception, or when an instance of this series already has that `occurrence_anchor`. An older key at the same instant suppresses the preview. An overlapping slot does not. Return the rest as previews, not inserts. The title and slots come from the template version effective at that anchor.

A preview has the occurrence key, series id, title, and absolute slot times. The block is visually distinct (`preview: true`, muted). It is not a task id.

Clicking a preview does not insert a task. The popover shows the occurrence time and two actions: Skip (writes `skipped`) and Edit series (opens "this and future" on the template). Drag, resize, and status changes on a preview are refused.

When `materializeDue` creates that key, the calendar shows the instance and drops the preview.

### References, owner, and deletion

- Owner is `tasks.owner_id`, not null, references `users` on delete restrict. Set it to the authenticated member on create. Generated instances copy `ownerId` from the template version. No TaskView control. Owner does not grant access. Every read and write is scoped by `workspace_id`. A series, its versions, its exceptions, and its instances are visible only inside that workspace.
- Removing a workspace member reassigns that member's tasks, and the `ownerId` inside template versions in that workspace, to a remaining member with role owner. If several remain, use the earliest membership. The same transaction does the reassignment before the membership row is deleted. If the removed member is the user and no other owner remains, the removal returns 409 and deletes nothing. The user row is not deleted while any `owner_id` still points at it. Tasks are not cascaded.
- Executor is `execution_sessions.executor_type` (`human` or `ai`). A later session on the same task may use the other type. The task does not store an executor.
- Epic delete already nulls `tasks.epic_id` (`on delete set null`). Also set `epicId` null inside every template version that references that epic. Tasks and series rows remain.
- Space delete keeps today's confirmation. The preview includes the count of series whose current template `spaceId` is that space. Confirming runs Delete Series first, so instances that live in another space stay and keep `origin_series_id`. Instances in the deleted space are removed by the space delete, not by Delete Series. Moving the root task out first is how a series leaves the space.
- Retired slots stay on the task. Today, Tomorrow, the calendar, and overlap warnings use only slots with `retired_at` null on tasks that are not `done` or `cancelled`. The task Timeline on a Done or Cancelled task still lists retired and past slots as history. Reopening does not clear `retired_at`.
- Goal links stay on `doc_tasks`.

## Technical requirements

### Architecture

- **Apps / packages:** `apps/todex-web`, `apps/todex-api`, `@repo/api/todex`.
- **Reuse:** `TaskDescriptionEditor`, `EstimatePicker`, `DatePicker`, `TaskRecurrencePicker`, `TaskComposer`, acceptance-criteria editing, `Select` chips, `formatEstimation`, `parseEstimation`, `formatDuration`, `addCalendarDays`, placement in `TasksService`. Lifecycle transitions do not call `closeTracking` or `finishSession`. Start, enqueue, and focus check `task_lifecycle_locks`.
- **New code:** `taskProgressPercent` in `task-helpers.ts`. `RecurrenceService` and the interval hook in `apps/todex-api/src/modules/tasks/`. Reference handlers in that module. No new Nest application module and no `@nestjs/schedule`.
- **Import boundaries:** the web app calls `@repo/api/todex` and `todexClient`. SQL stays in the API.

### Data layer

- `tasks.outcome text not null default ''`.
- `tasks.complexity` enum `low | medium | high`, null.
- `tasks.owner_id` not null, references `users` on delete restrict. No TaskView field. Member removal reassigns it before the membership row goes.
- `tasks.series_id` nullable, references `recurring_series` on delete restrict.
- `tasks.occurrence_key` text null.
- `tasks.occurrence_anchor` timestamptz null. Set on insert. A rule change does not update it.
- `tasks.origin_series_id` text null. No foreign key.
- `tasks.overridden_fields jsonb` string array, not null, default `[]`.
- `tasks.version integer not null default 1`. This is the concurrency token. `updated_at` still changes on write and is not the token.
- `task_lifecycle_locks`: `task_id` primary key, `transition_id`, `action`, `expires_at`. A row with `expires_at <= clock_timestamp()` authorizes nothing.
- Drop `tasks.schedule_date`.
- `task_schedule_slots`: `id`, `workspace_id`, `task_id` cascade, `start_at`, `end_at`, `retired_at` null. Check `end_at > start_at`. Index `(task_id)`. Index `(workspace_id, start_at, end_at)`.
- Unique index on `(series_id, occurrence_key)` where `series_id` is not null.
- Unique index on `(series_id, occurrence_anchor)` where `series_id` is not null. This is occurrence identity. It is not a constraint on slot ranges.
- `recurring_series`: `id`, `workspace_id`, `anchor`, `rule` jsonb, `rule_version` integer not null, `stopped_at` null, `rule_effective_at`, `cursor_rule_version` integer not null, `generated_through` text null, timestamps. Index `(workspace_id, stopped_at)`.
- `series_template_versions`: `id`, `series_id` cascade, `effective_at`, `template` jsonb. Unique `(series_id, effective_at)`.
- `series_exceptions`: `id`, `series_id` cascade, `occurrence_key`, `kind` `skipped | deleted`. Unique `(series_id, occurrence_key)`.
- `task_references`: as previously specified (`doc`, `conversation`, `url`), no `user_id`. Cascade when the doc, conversation, or task is deleted.
- One Drizzle migration. No data backfill. Local data can be wiped.
- `listByScheduleRange` joins slots with `retired_at` null and keeps a task when any such slot overlaps the range and the task is not `done` or `cancelled`.
- Replacing slots is a delete-and-insert in the same transaction as `UPDATE tasks SET version = version + 1 WHERE id = :id AND version = :expected`. Zero rows rolls the slot write back and returns 409.
- `actualTime` stays the sum of execution intervals for that task id.

### API & contracts

- `TaskSchema` drops `scheduleDate` and adds `outcome`, `complexity`, `ownerId`, `scheduleSlots`, `seriesId`, `occurrenceKey`, `occurrenceAnchor`, `originSeriesId`, `overriddenFields`, `version`.
- `ScheduleSlotSchema` is `{ id, startAt, endAt, retiredAt }`. Create and update accept at most 10 slots. Update replaces the set when `scheduleSlots` is present and requires `version`.
- Parent violations return 400 `Tasks can only be nested one level deep`.
- A subtask update that sets `recurrence` or creates a series returns 400 `Only root tasks can repeat`.
- Status and delete bodies include `version` and `transitionId`. Responses: 409 `execution_still_active`, 409 `lifecycle_in_progress`, 409 `conflict`. 400 when a slot is shorter than 15 minutes, `endAt` is not after `startAt`, or the range is duplicated.
- `POST /v1/tasks/:taskId/lifecycle/:transitionId/abort` releases that lock and writes no task change.
- `GET /v1/tasks/:taskId/references`, `POST`, and `DELETE` as previously specified. `canReadConversation` is `conversation.userId === caller` in the same workspace.
- Series routes, all workspace-guarded:
  - `POST /v1/tasks/:taskId/series` body `{ anchor }` creates the series and the first template version. It does not write slots.
  - `PATCH /v1/tasks/:taskId/series` body `{ scope: "instance" | "future", patch }`. `future` inserts a template version effective at that instance's anchor and patches only supported scalars, criteria, references, and slots on existing eligible instances. A rule field in that patch uses the immediate rule-change transaction. A future `rule_effective_at` returns 400 `Rule changes apply immediately`.
  - `POST /v1/series/:seriesId/exceptions` body `{ occurrenceKey, kind }`.
  - `POST /v1/series/:seriesId/stop`.
  - `DELETE /v1/series/:seriesId` detaches every instance and returns `{ kept: number }`. It deletes no task.
- Calendar range response adds `previews: { seriesId, occurrenceKey, title, slots }[]`. Previews have no `taskId`.
- Zod schemas live in `packages/api/src/todex/task.ts`, `series.ts`, and `task-reference.ts`.

### Frontend

- Edit `TaskViewBody` in `apps/todex-web/src/app/planning/task-view.tsx`. Breadcrumb and view mode stay.
- Subtask rows are compact. Do not use `EpicTaskCard` in this column.
- Schedule rows edit one slot's start and end. Show overlap text under the row.
- Status Done and Cancelled, and Delete, open the confirm dialog when the rules above say so. The client keeps `transitionId` across retries. On 409 `execution_still_active`, the dialog stays and tells the user to stop execution. On 409 `conflict` or after abort, refetch and close the dialog. A subtask status 409 `lifecycle_in_progress` leaves the checkbox unchanged.
- "This and future" shows `Existing tasks keep their subtasks. New occurrences use this subtask list.` when the edit changes subtasks.
- Conversation references set the `conversation` search param. `AgentWidget` reads it. No new chat route.
- Calendar blocks render previews with a muted style and no drag handles.

### Auth & permissions

Workspace member, same as `PATCH /v1/tasks/:id`. Series routes use the same guard. Conversation pins use `canReadConversation`. Mention rows are visible to anyone who can read the task.

### Error handling & edge cases

- Outcome over 500 characters: 400. Empty outcome: no error.
- Eleventh slot, short slot, or duplicate range: 400, previous slots kept.
- Overlap: 200 and a warning list on the task or calendar payload (`conflicts: { slotId, title }[]`).
- 409 `conflict` when `version` does not match. The version in the response is the current one. 409 `execution_still_active` when the parent or a locked subtask still has an open interval or a running job. 409 `lease_expired` when the write transaction no longer sees a live lease. 409 `lifecycle_in_progress` when start, enqueue, or focus hits a live lock, when a second transition id tries to lock the same task, when a child-set change or a direct child's status write hits a live parent lock, or when the final write re-reads a different unfinished child set.
- A rule edit with a future effective instant returns 400 `Rule changes apply immediately` and leaves the current rule in place.
- A task with no non-retired slots is absent from Today, Tomorrow, and the active calendar.
- Delete instance plus a later generator tick does not recreate the key.
- Two generator ticks cannot insert two rows for one key. A new rule version cannot insert a second row for an existing `occurrence_anchor` of that series.
- Stop Repeating then a tick creates nothing.
- A preview key that gets an instance between fetch and click is skipped as an exception only if the user confirms Skip and the key still has no instance. If the instance now exists, Skip is refused and the instance is shown.

### Testing

The slice that introduces a behavior ships its tests. Slice 6 runs those suites together and adds Playwright. It does not own the first copy of a lifecycle, concurrency, recurrence, or integrity test.

- **Slice 1:** two acquires serialize on the task-row locks and only one inserts; an expired lease returns 409 `lease_expired` and does not change status or queue rows; start is rejected in the same transaction as a live lock and is allowed once the lease is dead; the parent's open interval blocks the transition the same way a subtask interval does; retry after the normal stop writes once; abort and a second transition do not double-cancel; removing a member reassigns `owner_id` and template `ownerId`, and the user row remains while a task still references it. Concurrent integration: while the parent lease is live, create, delete, reparent, and a move that changes `parentTaskId` each return 409 `lifecycle_in_progress` and leave the child set unchanged; a subtask status write returns the same 409 and does not change `version`; after the transition commits, retrying that status write with the old version returns 409 `conflict`; after abort, the same status write commits once; after the lease is dead, membership writes succeed; the final transition re-reads children under the parent lock and cancels exactly that unfinished set.
- **Slice 2:** `taskProgressPercent` for both groups, one group, neither, Done, cancelled task, cancelled children excluded, all remaining Done is 100%, all children cancelled drops the subtask group, `in_progress` stays in the denominator. The Progress group and the subtask header share the cancelled count.
- **Slice 3:** 11th slot rejected; resize of one slot leaves the other and `estimation`; overlap still saves; retiring future slots on Done; reopen leaves `retired_at`; retired slots stay on the task payload and stay off Today; 409 on a stale `version` leaves the previous slots in place; the stored version increments by one on success.
- **Slice 4:** enabling Repeat with no slots writes an anchor and zero slots; a hole is still inserted; `generated_through` does not pass that hole and the cursor update rolls back when `cursor_rule_version` changed; `ON CONFLICT` keeps a single row; previous todo instance remains when the next period starts; generated instance has new ids, todo status, unchecked criteria, no sessions, and a stored `occurrence_anchor`; slot local times survive a DST spring-forward. Stop Repeating sets `stopped_at`, cancels future unstarted To Do instances, leaves the open instance, and a later tick creates nothing.
- **Slice 5:** "this and future" does not patch an earlier instance or an older template version, and it does not add or remove subtasks on an existing instance; a subtask edit stores the new structure on the template version and the confirm copy says existing tasks keep their subtasks. After 30 of 40 due keys, a rule change sets `rule_effective_at` to now, nulls `generated_through`, bumps `rule_version`, and does not insert occurrences before that instant; a future effective instant returns 400 and leaves the old rule. The next tick generates the new version's first due key. An exception `{1}/{localKey}` does not suppress `{2}/{localKey}`; a timezone change deletes no task; Delete Series keeps every instance, sets `origin_series_id`, and clears `series_id`. Weekly → Daily at an existing occurrence keeps that task id, history, overrides, and slots, writes no second row at that `occurrence_anchor`, and inserts the next day that has no instance. A preview is dropped for that anchor. Overlapping slots on the kept task stay two slots. Previews: a full key inside 30 days with no row and no matching anchor is a preview; the same full key with an instance is not; a skipped key is neither.
- **Slice 5 references, with the reference endpoints:** pin once; mention deduped; delete pin keeps the doc; delete doc drops the pin; another user's conversation is omitted.
- **Slice 6 Playwright:** `apps/todex-web` has no Playwright suite yet. Add a smoke project there, not a new framework. Cover opening TaskView, adding two slots, dragging one, seeing a subtask label on the calendar, seeing `N cancelled` in Progress, and seeing a recurring preview that is not a task row. Do not move the API tests above into the browser.
- **E2E beyond that smoke:** none.

### Deployment & ops

- **Env vars:** none.
- **Scripts:** `pnpm --filter todex-api db:migrate` before a web build that sends `scheduleSlots`.
- **Rollout:** slices land in order. Slice 1 includes the lifecycle lock and the version column. Slice 4 removes the legacy shift in the same change as series generation and ships Stop Repeating with it. No dual read of `scheduleDate`. No dual repeat model after slice 4. Repeat cannot ship without Stop Repeating.

## UX / UI

Dark, minimal, current Todex surfaces. Sidebar width stays `lg:w-[22rem]`.

| Property        | Glyph            |
| --------------- | ---------------- |
| Task Progress   | `circle-dashed`  |
| Time Used       | `clock`          |
| Estimate        | `hourglass`      |
| Executed        | `clock`          |
| Progress Stage  | `milestone`      |
| Complexity      | `gauge`          |
| Space           | `box`            |
| Section         | `layers`         |
| Epic            | `folder`         |
| Goal            | `target`         |
| Parent          | `git-branch`     |
| Schedule        | `calendar`       |
| Due             | `calendar-clock` |
| Repeat          | `repeat`         |

Reference rows may use `file-text`, `message-square`, and `link`. The References heading does not.

Schedule line: `4 Nov, 09:00 – 10:00` from that slot's own ends. Add and remove slots. Due empty label is None. Repeat uses `TaskRecurrencePicker` on root tasks only.

Subtask header and the Progress group both show `1 cancelled` when a direct child is cancelled. The percent can still be 100%. Example header: `2/2` and `1 cancelled`.

Stop Repeating and Delete Series use the confirm copy in Repeat. The menu labels match those dialogs. Stop Repeating is on the Repeat control in the same slice that enables a series. It cancels future unstarted To Do tasks. Delete Series keeps those tasks and cancels nothing.

"This and future" uses `Existing tasks keep their subtasks. New occurrences use this subtask list.` when subtasks change. Scalar edits do not use that sentence.

Preview blocks are muted and do not use the task drag handles.

## Dependencies & risks

- The lifecycle lock blocks new sessions. It does not stop the current one. A write that trusts a lease checked on a previous request violates this PRD. A client that closes intervals inside the status call also violates it.
- `version` is the only edit token. A client that omits it is rejected. Slot replacement rolls back when the version check fails.
- Epic and space cleanup must patch every template version. Forgetting one leaves a future instance pointing at a deleted epic.
- The generator's candidate list is the current `rule_version` due set, and only when `rule_effective_at <= now`. `generated_through` is proof only for `cursor_rule_version`. A rule change resets that proof in the same transaction as the version bump and sets `rule_effective_at` to now. A future-dated rule violates this PRD. Satisfying a new key by an existing `occurrence_anchor` does not rewrite that task. Treating a slot overlap as that match violates this PRD.
- A child-set write or a direct child's status write that does not lock the parent in the same id order as the lifecycle acquire, or that ignores a live parent lease, violates this PRD. The final status write uses the child set re-read under that parent lock.

## Open questions

- None. Delete Series keeps every existing task and deletes the series definition. "This and future" does not add or remove subtasks on instances that already exist. A preview cannot be edited into a task.

## Success criteria

- Planning TaskView shows the approved groups, chips, hint, and collapse behavior. Breadcrumb and view mode still work.
- Two slots of different lengths both appear. Resizing one leaves the other and the estimate unchanged. The eleventh slot does not save.
- Done below 100% asks, then saves. Unfinished subtasks of a completed parent become Cancelled only after their execution is already stopped. The status call does not close those intervals. Done subtasks and their results remain. Delete Series leaves every instance in place with `origin_series_id` set.
- The next occurrence is a new task. The previous unfinished task is still there. A 30-day preview disappears when that instance exists and never shows twice. Weekly → Daily does not add a second task at an anchor that already has an instance.
- A parent lifecycle lock rejects a concurrent child-set change. The committed cancel matches the children re-read under the parent lock.
- A subtask has no Repeat control. Moving it to another space makes it a root task.

## Implementation plan

Ship the slices in order. Later slices call the code the earlier slices added. They do not rebuild TaskView.

### 1. TaskView layout and core lifecycle

**Depends on:** nothing.

**Delivers:** the approved column and sidebar, chips, outcome hint, collapse rules including expand-on-first-item, Lucide property icons, no Comments or Notes. `tasks.version` and `task_lifecycle_locks`. Status Done below 100% confirms. Parent Done, Cancelled, and Delete acquire locks on the parent and unfinished subtasks, refuse new sessions, treat a dead lease as unauthorized, observe termination of the parent session and the subtask sessions, and write only in the transaction that still holds a live lease. Child-set changes and direct-child status writes lock the parent in the same id order and reject while that lease is live. The final write re-reads the child set under the parent lock. Retry and abort behave as specified. Parent picker and add-subtask enforce depth 2. Space moves follow the parent and subtask rules. Repeat stays hidden on subtasks. Legacy root Repeat is unchanged. `owner_id` is set on create and reassigned when a member is removed. It is not shown.

**Acceptance:** the Read the task story, except progress math and slot editing, plus the Complete a parent story, plus the slice 1 tests. Existing `scheduleDate` still drives the Schedule row until slice 3.

**Does not:** change the progress formula, add slots, or replace recurrence. Later slices do not add this lock.

### 2. Subtasks, criteria, progress, and time

**Depends on:** slice 1.

**Delivers:** criteria and subtasks in the main column, `taskProgressPercent`, the same `N cancelled` count on the subtask header and in the Progress group, Time Used from this task only, separate subtask executed line. Kanban still uses `taskChecklistProgress`. The slice 2 tests ship here.

**Acceptance:** the progress and time story.

**Does not:** change schedule storage.

### 3. Schedule slots and calendar

**Depends on:** slice 1. Can follow slice 2 or land after it. It must not start before slice 1.

**Delivers:** `task_schedule_slots`, drop `schedule_date`, 10-slot cap, drag, resize, overlap warnings, retired slots excluded from active planning and kept on the task, version check and increment around slot replacement, Today and calendar reads, subtask label on blocks. Execution does not write slots. The slice 3 tests ship here.

**Acceptance:** the Plan several slots story.

**Does not:** generate recurring instances. Root Repeat remains the legacy shift until slice 4. Do not add an anchor or a default slot to that path.

### 4. Series, generation, and history

**Depends on:** slice 3.

**Delivers:** `recurring_series`, template versions, exceptions, `origin_series_id`, `rule_version`, `occurrence_anchor`, `materializeDue` with hole-safe reconciliation for that version, atomic cursor update, removal of `completeRecurringTask`. Enabling Repeat stores an anchor and does not create a slot. The same slice shows Stop Repeating, with its confirm copy, and `POST /v1/series/:seriesId/stop`. New instances copy the effective template and reset lifecycle fields. Unfinished previous instances remain. The slice 4 tests ship here.

**Acceptance:** the Repeat story except edit scopes, rule changes, and previews. Stop Repeating is included. A series cannot be enabled without that action.

**Does not:** "this and future", virtual previews, or Delete Series.

### 5. Recurrence edits and previews

**Depends on:** slice 4.

**Delivers:** this task only, this and future as a new template version from the selected anchor forward, overrides, the subtask confirm copy, immediate rule changes that bump `rule_version`, set `rule_effective_at` to now, reset the cursor, and keep existing tasks, anchor dedupe so a new version does not insert a second instance at an existing `occurrence_anchor`, skip, delete instance, Delete Series that keeps every instance, 30-day previews, preview popover. The confirm copy for Delete Series ships here. Stop Repeating already shipped in slice 4. The slice 5 tests ship here.

**Acceptance:** the rest of the Repeat story and Calendar previews. A rule change leaves the earlier task ids on the board and does not generate anchors before now. Weekly → Daily at an existing occurrence keeps that task. A partial catch-up does not satisfy the new rule version. Delete Series reports `kept` and those tasks still open.

### 6. Regression coverage and smoke tests

**Depends on:** slices 1 and 5.

**Delivers:** a cross-feature run of the slice 1–5 suites, plus Playwright smoke in `apps/todex-web` for TaskView, two slots, a subtask calendar label, `N cancelled` in Progress, and a preview that is not a task row. Epic template-version cleanup and space-delete series counts if slice 5 did not already cover that path end to end.

**Acceptance:** the slice 6 smoke list is green. This slice does not introduce the lock, the version check, the cursor, occurrence keys, or a second way to stop a session. Existing behavior from slices 1–5 still passes.
