# Calendar: Planned vs Actual and Space colors

| Field           | Value                                      |
| --------------- | ------------------------------------------ |
| Status          | Draft                                      |
| Scope           | TDX                                        |
| Apps / packages | todex-web, todex-api, `@repo/api`          |
| Created         | 2026-11-10                                 |

## Problem

Calendar shows scheduled events and scheduled tasks. Execution time lives on another page. A user cannot see what they planned and what they actually ran on the same timeline.

Spaces have `emoji` and no color. Events, templates, and tasks each store their own `color`. This work deletes those columns. `spaces.color` is the only color identity for tasks, events, and sessions. There is no production database to preserve.

## Goals

- Planned, Actual, and Both modes on `/calendar`.
- Actual blocks come from execution intervals. They do not create calendar events and they are not pushed to Google.
- Both mode is two lanes on a shared time axis, for 1 or 2 days.
- Planned and Actual stay independent. Overlap is not completion and not a link.
- `spaces.color` is the only color for a task, an event with a Space, and a session. Events with no Space use the neutral color.
- A timed event created or edited in Todex is at least 15 minutes.

## Non-goals

- Creating calendar events from sessions, or matching a session to an event.
- Connecting lines, match badges, or an in-calendar Planned / Actual / Difference number. Execution Activity stays the actual-time report.
- Automatic rescheduling, planning suggestions, or per-task splits of a session.
- Keeping `tasks.color`, `calendar_events.color`, or `calendar_event_templates.color`, or accepting `color` on those write bodies.
- A compatibility layer, a legacy color fallback, or a backfill that preserves local rows by rewriting history.
- Deleting `spaces.emoji` or its create/update API. Todex web still does not show an emoji picker, and Calendar does not render emoji.
- Writing Space color into Google Calendar, or exporting sessions as Google events.
- A freeform color input. The palette is the eight presets below.
- Replacing FullCalendar, or adding `@fullcalendar/resource`.

## User stories

### Space color

**As a** user, **I want** each Space to have a muted color, **so that** its events, scheduled tasks, and execution use the same color.

**Acceptance criteria**

- [ ] Create and rename Space dialogs offer the eight presets and a preview.
- [ ] `PATCH /v1/spaces/:id` with `{ "color": "<preset>" }` updates the Space. Omitted `color` on create uses `#B8A4D1`.
- [ ] Task, event, and template forms have no color control. Their write APIs reject a `color` field.
- [ ] Changing `spaces.color` updates task blocks, events, and session slices without copying the color onto those rows.
- [ ] `spaces.emoji` still round-trips on create and update. Calendar does not render it.
- [ ] The calendar does not render Space emoji.

### Planned, Actual, Both

**As a** user, **I want** to switch the timeline between intentions, execution, and both, **so that** I can compare them without leaving Calendar.

**Acceptance criteria**

- [ ] The toolbar has Planned, Actual, and Both. Default is Planned.
- [ ] Planned shows calendar events and scheduled task blocks, including the Events / Tasks filters.
- [ ] Actual shows execution slices only. Filters do not apply.
- [ ] Both shows events and scheduled tasks on the left half of each day and execution slices on the right half.
- [ ] All-day events and midnight scheduled tasks stay in the all-day row, on the Planned half in Both. Sessions never become all-day events.
- [ ] Actual slices are not draggable.

### Day count

**As a** user, **I want** one day-count control, **so that** I can show 1–7 days without a Day/Week toggle.

**Acceptance criteria**

- [ ] The toolbar dropdown lists 1 through 7. There is no Day/Week control.
- [ ] Planned and Actual allow 1–7. Default is 7.
- [ ] Both enables 1 and 2 and disables 3–7. Entering Both from 3–7 days shows 2 days.
- [ ] Leaving Both restores the previous count, unless the user picked 1 or 2 while in Both. That pick replaces the stored count.
- [ ] The visible range still starts on the anchored day.
- [ ] The choice survives reload in this browser.

### Event task scope

**As a** user, **I want** an event's tasks to come from one Space, **so that** a block has one color and one owner.

**Acceptance criteria**

- [ ] With no Space, task scope is disabled and the form shows "Select a Space to add tasks."
- [ ] With a Space, the picker lists only that Space's tasks.
- [ ] Changing Space while tasks are selected asks for confirmation and clears them before the Space changes.
- [ ] Clearing Space is blocked while tasks are selected.
- [ ] The API rejects a non-empty scope with no Space, a task from another Space, and a duplicate task id.
- [ ] An event with no Space and no tasks remains valid and uses the neutral color. Google events with no Space stay valid.

### Execution on the timeline

**As a** user, **I want** each execution session on the calendar as the time I was actually running it, **so that** pauses are empty grid.

**Acceptance criteria**

- [ ] One session is one details view. Each closed or open active interval is its own filled slice.
- [ ] Slices of one session on one day share one overlap column.
- [ ] The details duration is the union of the intervals, in seconds, with overlapping history counted once.
- [ ] A custom title is shown when set. Otherwise one task shows its summary. Two or more show `{first summary} +{n-1} task` or `tasks`.
- [ ] Saving a title does not change that session's intervals.
- [ ] Activity attributes the session to `execution_sessions.space_id`. Moving a task afterward leaves that attribution in place.
- [ ] Task order is `execution_session_tasks.position`.
- [ ] A running interval extends to the current time and the grid refreshes while one is open.
- [ ] A session that crosses local midnight is split into per-day slices and still opens one session.
- [ ] Intervals shorter than 15 minutes are shown.

## Functional requirements

1. Add `spaces.color`, required, one of the presets. Default `#B8A4D1`.
2. Presets, in order: `#B8A4D1`, `#AD8570`, `#93B7CC`, `#A1B6A1`, `#C9A2AD`, `#CEBD8C`, `#8FBAB5`, `#A5A9B0`.
3. Drop `tasks.color`, `calendar_events.color`, and `calendar_event_templates.color` from the database, Drizzle schema, mappers, Zod schemas, agent calendar tool, and Google event upsert. Delete `calendar-color-picker.tsx`, `calendar-colors.ts`, `calendar-colors.test.ts`, `CALENDAR_EVENT_COLORS`, `DEFAULT_EVENT_COLOR`, `DEFAULT_TASK_COLOR`, and `blockColor`. A write body that still contains `color` is `400` because those schemas are `.strict()`. Do not strip the field and continue.
4. Block treatment: background is the Space hex at 22% opacity on the calendar surface, a 2px left border is the solid hex, title and time use the existing foreground and muted tokens. Do not paint a solid pastel fill. No Space uses neutral `#7c7c86` with the same treatment. Theme tokens that are not entity colors stay.
5. Remove the color pickers from the task view, the event form, and the template form.
6. Add `execution_sessions.space_id` and `execution_sessions.title` (`text`, nullable title). `space_id` is set once in `execute` from the tasks' shared `tasks.space_id` and is never updated. Activity reads this column, not `tasks.space_id`.
7. `execute` rejects an empty task list (already), duplicate ids (already), and tasks whose `space_id` values differ. Use `400` with "Tasks must belong to one space". The check runs inside the existing transaction after the task rows are locked.
8. Moving a task to another Space (`TasksService.update` when `spaceId` changes) does not change `execution_sessions.space_id`. If that task is on an open session, reject with `400` and "Finish the execution before moving this task". In the same transaction, remove the task id from `calendar_events.task_scope` and `calendar_event_templates.task_scope`. Leave each event's `space_id` as it is.
9. Event scope writes, session start, and task Space changes take their locks inside the transaction already used by that service. Lock task rows with `FOR UPDATE` in `id` order, then the event or session row. Re-read `tasks.space_id` after the lock and reject a mismatch. Do not add database triggers.
10. Deleting a Space that any session references fails with `409`. Extend `deletionPreview` with `sessionCount`. Inbox deletion stays blocked as it is today.
11. Timed events created or updated through `CalendarEventsService` must be at least 15 minutes. All-day events are exempt. Google inbound upserts may still store shorter events. A title-only patch of an existing short event is allowed. A patch that sets a timed range under 15 minutes is `400`. Drag and resize that would end under 15 minutes revert.
12. Template `durationMinutes` minimum becomes 15 on create and update.
13. Modes and day count are client state. Keys: `todex.calendar.mode` (`planned` | `actual` | `both`, default `planned`) and `todex.calendar.dayCount` (`1`–`7`, default `7`). While Both has forced the count down, keep the previous count in `todex.calendar.dayCountBeforeBoth` and delete that key after restore or after the user picks 1 or 2 in Both.
14. Actual naming and slice rules are in the Execution story. The calendar does not write `calendar_events` for them.
15. Overlap is computed per lane. Planned and Actual never share horizontal space. Matching task ids do not move blocks.
16. No analytics summary on the calendar.

## Technical requirements

### Architecture

- **Apps / packages:** `apps/todex-web`, `apps/todex-api`, `packages/api/src/todex`.
- **Reuse (required):**
  - Grid and toolbar: `apps/todex-web/src/app/calendar/calendar-grid.tsx`, `calendar-toolbar.tsx`, `calendar-provider.tsx`, `calendar-blocks.ts`, `calendar-overlap.ts`, `calendar.css`.
  - Forms: `calendar-event-view.tsx`, `calendar-draft.tsx`, `calendar-schedule-panel.tsx`, `calendar-task-scope.tsx`, `calendar-task-view.tsx`.
  - Space dialogs: `apps/todex-web/src/app/planning/space-dialogs.tsx` and `updateBoard` in `tasks-provider.tsx`.
  - API schemas: `packages/api/src/todex/space.ts`, `calendar.ts`, `execution.ts`, `task.ts`.
  - Services: `spaces.service.ts`, `calendar-events.service.ts`, `calendar-templates.service.ts`, `execution.service.ts`, `execution-activity.ts`, `tasks.service.ts`, `google-calendar.service.ts`, `apps/todex-api/src/modules/agent/tools/calendar-tool-handler.ts`.
  - Mappers: `apps/todex-api/src/db/mappers.ts`.
  - Icons already used on chips: `TasksIcon` for tasks, `CalendarIcon` for events, in `CalendarChip`.
- **New modules:**
  - `packages/api/src/todex/space-colors.ts` — palette, default, zod enum. Re-export from the todex barrel.
  - `apps/todex-web/src/app/calendar/calendar-actual.ts` — slice splitting, union duration, display title. Pure functions plus tests.
  - `apps/todex-web/src/app/calendar/calendar-session-view.tsx` — read-only session details and title field.
  - `apps/todex-web/src/app/planning/space-color-picker.tsx` — preset swatches.
- **Import boundaries:** Web imports types from `@repo/api/todex`. No app-to-app imports. Overlap layout stays in the web app.

### Data layer

- **Schema changes:**
  - `spaces.color text not null default '#B8A4D1'`.
  - Drop `tasks.color`, `calendar_events.color`, and `calendar_event_templates.color`.
  - `execution_sessions.space_id text not null references spaces(id) on delete restrict`.
  - `execution_sessions.title text null`.
  - Index `execution_sessions_workspace_space_started_idx` on `(workspace_id, space_id, started_at)`.
  - Do not add an intervals table. Intervals stay on `execution_session_tasks.intervals`.
  - Do not replace `calendar_events.task_scope` jsonb with a join table.
  - Do not add triggers. Cross-space checks are row locks inside the existing service transactions.
- **Migration:** one drizzle migration after `0033_breezy_changeling`. There is no production database. Local rows do not need a history-preserving backfill.
  1. `ALTER TABLE spaces ADD COLUMN color text NOT NULL DEFAULT '#B8A4D1'`.
  2. `ALTER TABLE` drop `tasks.color`, `calendar_events.color`, and `calendar_event_templates.color`.
  3. `DELETE FROM execution_session_tasks` and `DELETE FROM execution_sessions`. Then add `space_id` not null, the restrict FK, `title` null, and the index.
  - Leave `spaces.emoji` as it is. Do not hash existing ids into the palette. Resetting the local database and migrating an empty schema is an acceptable alternative to the deletes in step 3.
- **Queries / persistence:**
  - `SpacesService.create` and `ensureInbox` persist `color` from the body or the default.
  - `execute` writes `space_id` and leaves `title` null.
  - Title updates do not rewrite intervals or `space_id`.
  - `ExecutionService.activity` joins `spaces` on `execution_sessions.space_id`. The `spaceId` filter and the per-space totals use that id. `buildExecutionActivity` does not learn a task's current space.

### API & contracts

Global prefix is `v1`. Workspace guard stays on these controllers.

- **Spaces.** `CreateSpaceBody` and `UpdateSpaceBody` gain optional `color` (`z.enum` of the presets). `SpaceSchema.color` is required. `emoji` stays optional on write and nullable on read. Unknown hex is `400`.
- **Events.** Remove `color` from `CalendarEventSchema` and from create/update bodies. Parse those bodies with `.strict()`. `CalendarEventsService.create` and `update` run in one transaction: lock the task rows `FOR UPDATE` in `id` order, lock the event row on update, then re-read `tasks.space_id`. Reject when `taskScope` is non-empty and the resulting `spaceId` is null. Reject when any task's `spaceId` differs from the event `spaceId`. Reject duplicate ids in `taskScope`. Apply the 15-minute rule here. Google inbound upserts may still store a timed event shorter than 15 minutes, and they stop writing a color. `calendar-tool-handler.ts` drops `color` from its tool schema.
- **Templates.** Remove `color` from the template schema and write bodies. Parse those bodies with `.strict()`. Same scope rules, same task-row lock, and `durationMinutes >= 15` in `CalendarTemplatesService`.
- **Tasks.** Remove `color` from `TaskSchema` and `UpdateTaskBody`. Parse the update body with `.strict()`. `TasksService.update` stops writing a color.
- **Execution.** `ExecutionSessionSchema` gains `spaceId: string` and `title: string | null`. `UpdateExecutionSessionBodySchema`: `title` optional, trimmed, max 200, empty string stores null. `startedAt` and `endedAt` stay a pair: both present keeps today's history edit, which rewrites intervals. A body with only `title` is allowed on open and closed sessions and must not call `allocateSessionSpans`. `execute` / `preview` lock the task rows, then enforce one Space. Activity responses attribute time to the session Space.
- **Calendar actual read.** `GET /v1/execution/calendar?from&to&timeZone`. `from` and `to` are the same ISO datetimes as `ListCalendarEventsQuery`. `timeZone` is an IANA name, max 100. Response:

```ts
{
  sessions: Array<{
    id: string
    spaceId: string
    spaceName: string
    color: string
    title: string | null
    tasks: Array<{ id: string; taskKey: string; summary: string; position: number }>
    slices: Array<{ startedAt: string; endedAt: string | null }>
  }>
}
```

  Include a session when any interval overlaps `[from, to)`, or when an open interval (`endedAt` null) starts before `to`. Join `spaces` on `execution_sessions.space_id`, not on `tasks.space_id`. Order tasks by `position`. Return the stored intervals; the client splits them at local midnight. One query for sessions plus one query for links and tasks. No per-session round trip.
- **Shared types:** extend the zod schemas above. Add `ExecutionCalendarQuerySchema` and `ExecutionCalendarSchema` in `packages/api/src/todex/execution.ts`.
- **Validation:** palette enum, task/space match, 15-minute timed range, title length, calendar range `from < to`.

### Frontend

- **Routes / pages:** `/calendar` only. No new route. Session details open from the grid the way event preview does, not as `/execution/...`.
- **Components:**
  - Toolbar: mode control and day dropdown in `calendar-toolbar.tsx`.
  - `DayHeader` in Both also renders the labels Planned and Actual, each half the column.
  - `calendar-blocks.ts` grows a `lane: "planned" | "actual"` and a `sessionId: string | null`. Event and task blocks are `planned`. Each actual slice is one block, `kind: "session"`, `readOnly: true`, `allDay: false`.
  - Chip icon: events `CalendarIcon`, tasks `TasksIcon`, sessions `TasksIcon`. Size stays 11. Emoji is not an icon.
  - Compact chip: the time line hides when the harness height is under 32px. Title truncates. Do not set a min-height on the harness. Slot duration stays 30 minutes and snap stays 15, so a 15-minute event is half a slot and still clickable.
  - `space-color-picker.tsx` in create and rename dialogs. Rename loads `board.color`.
  - Delete the color pickers in `calendar-task-view.tsx`, `calendar-event-view.tsx`, and `calendar-schedule-panel.tsx`. Event, task, and template client calls stop sending `color`.
  - Fill comes from the Space list already loaded in `calendar-provider.tsx`: `space.color` for a block with `spaceId`, otherwise `#7c7c86`. Session slices use the `color` on the calendar payload, which was read from `execution_sessions.space_id`.
  - Session view lists every task and every slice, shows union duration, and saves title through the execution client. Closed-session start/end editing stays on the execution history list.
- **State & data fetching:** `calendar-provider.tsx` keeps the event and task queries. Add the calendar-sessions query for the same range when mode is `actual` or `both`. `refetchInterval: 30_000` while any returned slice has `endedAt: null`. Mode and day count initialize from `localStorage` and write through on change. `visibleBlocks` still filters planned events and tasks. It does not filter session blocks.
- **Styling:** Tailwind on the new picker and session view. Grid harness geometry stays in `calendar-overlap.ts` because FullCalendar owns those nodes. Set CSS variables for the fill (`--todex-block-color`) from the chip. No new `style={{}}` object beyond that variable.

Both layout, in `repaintTimegridOverlapLayout`:

- Group timed blocks by local day and lane.
- Pack columns inside the lane with greedy interval coloring.
- Before packing, collapse a session's slices on that day to one interval from the earliest start to the latest end, assign one column, and reuse it for every slice.
- Planned occupies the left half of the day, Actual the right half. In Planned or Actual mode the single lane occupies the full width.
- Write `left` and `width` on `.fc-timegrid-event-harness` with `important`, the same way `applyHarnessLayout` writes them today. Replace `eventUsesSameStartColumnLayout` rather than adding another special case.
- In Both, all-day event harnesses use left `0` and width `50%`.

Day views: `CALENDAR_VIEWS` already has 1–5 and 7. Add a 6-day `timeGrid` view. The dropdown calls `calendar.changeView` and keeps `range.from` as the anchor (`dateAlignment: "day"`).

### Auth & permissions

Workspace membership, already enforced by `WorkspaceGuard`. No new role. A session title edit is limited to that workspace's session.

### Error handling & edge cases

| Case | Behavior |
| --- | --- |
| Preset missing or unknown | API `400`. Picker cannot submit it. |
| Event scope without Space | API `400`. Form disables the picker. |
| Task from another Space | API `400`. |
| Duplicate task in one scope | API `400`. |
| User changes Space with tasks selected | Confirm, clear scope, then change Space. |
| User clears Space with tasks selected | Control stays disabled. |
| Timed range under 15 minutes from Todex | API `400`. Grid revert. |
| Write body includes `color` on a task, event, or template | API `400`. The field is not stored and not ignored. |
| Short event from Google | Visible. Neutral color when `spaceId` is null. |
| Open session, task Space change | API `400`. |
| Completed session, task Space change | Session `space_id` and Activity stay on the original Space. The task id is removed from event and template scopes. |
| Space delete while sessions exist | `409`. Preview shows `sessionCount`. |
| Concurrent scope edit and task move | The later transaction sees the locked `tasks.space_id` and rejects a mismatch. |
| Pause | No slice. Empty grid. |
| Several sessions overlap | Separate columns inside the Actual lane. |
| Event overlaps a slice | Separate lanes in Both. In a single mode the other set is hidden. |
| Empty range | The grid shows the time axis and no blocks. No extra empty-state panel. |
| `localStorage` throws | Use the defaults for the session. |

### Testing

- **Unit / integration:**
  - `apps/todex-web/src/app/calendar/calendar-actual.test.ts` — title fallback, union duration with an overlap, midnight split, open interval ended at `now`.
  - `apps/todex-web/src/app/calendar/calendar-overlap.test.ts` — lanes do not share columns; slices of one session share a column; two overlapping sessions in Actual get two columns.
  - `apps/todex-api/src/modules/calendar/calendar.test.ts` — scope/space rejects, 15-minute reject, all-day allowed, Google-shaped short row still maps, `color` on create or update is `400`.
  - `apps/todex-api/src/modules/execution/execution.test.ts` — mixed-space `execute` rejects, `space_id` stored, title-only patch leaves intervals byte-for-byte, calendar query returns a session that overlaps the range and skips one that does not.
  - `apps/todex-api/src/modules/execution/execution-activity.test.ts` — totals follow the session Space after the task's `space_id` changes.
  - `apps/todex-api/src/modules/spaces` — color enum, default on create. Add a test next to the service if none exists.
  - Task update test: Space change drops the id from `task_scope` and does not change `execution_sessions.space_id`; open session blocks the move. A second transaction that adds the task to an event in the old Space after the lock fails.
  - `calendar-tool-handler.test.ts` — the tool schema has no `color`.
- **E2E:** add Playwright on `todex-web`, matching `apps/devinity-web`: `playwright.config.ts`, `test/e2e/*.e2e-spec.ts`, script `test:e2e`, `baseURL` `http://localhost:3002`. Turbo already runs `test:e2e`. Sign-in stays Google-only. The suite inserts a user the way `apps/todex-api/test/mcp.e2e-spec.ts` does, calls `ensureOwnerWorkspace`, inserts a `sessions` row, and sets the `better-auth.session_token` cookie to that token. One spec file, `apps/todex-web/test/e2e/calendar-planned-actual.e2e-spec.ts`, covers:
  - Create a Space and choose a preset. The swatch is the color used on a later event.
  - Create an event in that Space with one task. The event chip uses the Space color. The form has no color control.
  - Start execution on two tasks from that Space. Actual and Both show one session as slices, titled from the first task. Pause leaves a gap. Resume adds a slice. Stop ends the open slice.
  - Set a session title from the calendar details. Reload Actual. The title is the chip label and the intervals are unchanged.
  - From 7 days, switch to Both. The grid shows 2 days. Switch back to Planned. The grid shows 7 days.
  - An event cannot add a task from another Space. The helper "Select a Space to add tasks." shows when Space is empty.
  - Change the Space color. The event chip, the scheduled task chip, and the session slice all show the new color.
- **Manual checks:** drag a timed event below 15 minutes and confirm it snaps back. Confirm a Google event with no Space stays neutral.

### Deployment & ops

- **Env vars:** none.
- **Scripts / commands:** `pnpm --filter todex-api db:migrate` (or the app's existing drizzle migrate script) before web deploy.
- **Rollout notes:** none. There is no production database. Apply the migration to local Postgres, or reset it first. Clients that send `color` on tasks, events, or templates get `400`.

## UX / UI

Toolbar order stays: date navigation, then the new mode control, then the day dropdown, then Filters, then the schedule toggle and New. Filters stay visible in Planned and Both and are disabled in Actual.

Create Space and Rename Space: name field, then the preset row, then the existing folder control on create. The selected swatch uses a ring. The dialog shows a 16px circle in the selected color beside the name.

Event form: Space select, then task scope. No color control on the event, task, or template forms. Helper copy when Space is empty: "Select a Space to add tasks." Confirm copy when changing Space with tasks: "Changing space clears the selected tasks."

Session details: title input, Space name, task list in position order, each slice as a local time range, and the union duration. Actual chips show the display title and the slice range. A short slice shows the title only.

## Dependencies & risks

- FullCalendar will keep fighting custom `left` / `width`. The existing mutation observer in `calendar-overlap.ts` has to keep rewriting harnesses after FullCalendar paints. Extend that observer; do not fork the event renderer.
- `updateSession` today requires `startedAt` and `endedAt` and rewrites every task's intervals. The title-only branch has to return before `allocateSessionSpans`.
- Activity currently joins `tasks.space_id` in `ExecutionService.activity`. Point that join at `execution_sessions.space_id` in the same change as the column. Calendar and Activity then share one Space.
- Space delete becomes stricter once sessions reference the Space. The migration deletes local sessions before the FK exists.

## Open questions

- None. Palette, lane geometry, pause drawing, analytics UI, task blocks, and the 15-minute rule are decided above.

## Success criteria

- A Space color change is visible on its events, scheduled tasks, and session slices, and those rows have no color column.
- Activity for a finished session stays on `execution_sessions.space_id` after the task moves.
- A paused session shows a gap, and the details duration equals the union of the intervals.
- Both at more than 2 days displays 2 days, and returning to Planned restores the previous count when the user did not pick a new one.
- An event cannot save tasks from two Spaces.
- No new `calendar_events` row appears when a session starts.
- Google sync still runs for calendar events and does not run because a session changed.

## Implementation checklist

- [ ] Add `SPACE_COLORS` and the zod enum. Add `spaces.color`. Add session `spaceId` and `title`. Remove task, event, and template `color` from schema, Zod, mappers, and the agent tool.
- [ ] Add the final-state drizzle migration. Register it in `drizzle/meta/_journal.json`. No palette backfill.
- [ ] Persist color on space create, inbox ensure, and update. Extend deletion preview and block delete when `sessionCount > 0`.
- [ ] Set `space_id` in `execute` after locking the tasks. Reject mixed Spaces. Add the calendar query and the title-only update path.
- [ ] Point `ExecutionService.activity` at `execution_sessions.space_id`.
- [ ] Enforce event and template task-scope rules and the 15-minute rule inside a transaction that locks the task rows. Reject `color` on those writes.
- [ ] On task Space change, lock the task, strip `task_scope` entries, and refuse the move during an open session.
- [ ] Add the Space color picker to create and rename. Delete the task, event, and template color pickers and the old color helpers.
- [ ] Add mode, day dropdown, 6-day view, and `localStorage`.
- [ ] Build actual slices, session chips, and session details. Paint fills from Space color.
- [ ] Replace overlap placement with lane-aware columns. Apply the 22% fill and left border.
- [ ] Add the Playwright spec and the Vitest cases listed above. Run `test` and `test:e2e` for todex-web and todex-api.
