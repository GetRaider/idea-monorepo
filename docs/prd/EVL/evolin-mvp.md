# Evolin MVP

| Field           | Value                                                                 |
| --------------- | --------------------------------------------------------------------- |
| Status          | Draft                                                                 |
| Scope           | `EVL` (proposed — not in commitlint or Husky yet)                     |
| Apps / packages | `apps/evolin`, `apps/evolin-api`, `@repo/evolin-shared`               |
| Created         | 2026-11-09                                                            |

This document is the source of truth for the Evolin MVP. It specifies product behavior and the implementation that satisfies it. Items marked **Proposed** are defaults chosen so an agent can implement without inventing behavior. They are repeated in [Open questions](#22-open-questions--assumptions). Do not treat them as user-confirmed decisions.

No user research, retention metrics, or habit-formation science is claimed here. The product intent comes from the Evolin brief.

---

## 1. Executive Summary

Evolin helps one person establish a small number of habits and then stop tracking them. A habit is a plan (why, minimum action, trigger, schedule) plus a lifecycle: Backlog, Establishing, Paused, or Established. Only Establishing habits consume a global capacity of 3, with 2 recommended. Practice is a daily completed or skipped mark on scheduled days. Graduation is an explicit user choice, not a day-count rule.

The MVP is a local Expo Web app and a NestJS REST API backed by PostgreSQL. There is no authentication, no extra product surfaces, and no deployment. Shared request and response contracts live in `@repo/evolin-shared`. UI primitives are React Native Reusables inside `apps/evolin`. The existing `@repo/ui` package stays untouched and is not imported.

---

## 2. Product Problem & Opportunity

Habit trackers turn a behavior into a permanent logging chore. Streaks punish missed days and keep finished habits on the daily list. People who want a behavior to become ordinary have no product state for "I am done tracking this."

Evolin treats tracking as temporary scaffolding:

- The user writes a plan small enough to repeat.
- The product limits how many habits are in progress.
- Practice is a record of establishing, not a score.
- The user decides when the habit can leave the active list.

The opportunity for this MVP is a single coherent loop — plan, limit, practice, graduate — that a solo developer can ship locally inside the existing monorepo.

---

## 3. Product Vision & Principles

**Vision.** A person can take a habit from intention to "established" without a second product surface.

**Principles.**

1. Establish, then stop tracking. Established habits stay on record and drop off the daily practice list.
2. Fewer active habits is the product, not a setting buried in preferences. Capacity is global and enforced by the API.
3. The minimum action is the habit. The product does not collect stretch goals.
4. Missed days are unmarked days. The UI does not show streaks, points, or failure language.
5. Graduation is a decision. The product never graduates a habit because a counter crossed a threshold.
6. MVP scope is habits only. Features listed under non-goals are not implemented "while we are here."

---

## 4. Target Users & Jobs To Be Done

**User.** One adult using the local web app on their own machine. The MVP has no accounts, no roles, and no shared workspaces.

| Job | Outcome |
| --- | --- |
| Park an idea | A habit can exist in the Backlog before it is ready to practice. |
| Make a plan | Before a habit becomes active, the user has a why, a minimum action, a trigger, a weekday schedule, and a duration. |
| Protect attention | The app refuses a fourth Establishing habit. |
| Record today | On a scheduled day, the user can mark completed, skipped, or clear that mark. |
| Pause without deleting history | A paused habit frees a slot and keeps its practice records. |
| Declare it established | The user graduates from the detail screen after seeing factual counts, and the slot frees. |

---

## 5. MVP Goals & Non-Goals

### Goals

- Create, read, update, and delete habits.
- Capture an establishment plan and block activation until it is complete.
- Move habits through the state machine in [section 8](#8-habit-lifecycle--state-machine).
- Enforce a hard cap of 3 Establishing habits in the database transaction that activates or resumes.
- Show recommended capacity (2) in the UI without blocking the third slot.
- Record at most one practice outcome per habit per local calendar date.
- Let the user graduate an Establishing habit and keep its history read-only.
- Run Postgres in Docker from `apps/evolin-api/docker-compose.yml`. Run the API and Expo Web on the host.

### Non-goals

The following are out of this PRD. Do not add schema, endpoints, screens, env vars, or acceptance criteria for them.

- Authentication, authorization, sessions, and user management.
- Onboarding.
- Discover and habit templates.
- Insights or analytics dashboards.
- Notifications and reminders.
- Offline support and sync queues.
- Native iOS or Android builds (Expo Web only).
- Product analytics and error-monitoring SDKs.
- CI/CD, cloud hosting, and production hardening beyond binding the API for local use.
- AI features.
- Social or community features.
- Gamification, streaks, points, levels, and badges.
- Redis, queues, and any Compose service besides Postgres and the API.
- A Dockerized Expo app and a Compose file at the repo root.
- Zustand or any other client state library.
- A separate `ui-native` package.
- A separate `evolin-api-client` package.
- Per-category capacity.
- Automatic graduation.
- Time-of-day scheduling.

---

## 6. Functional Requirements

IDs are stable. **Proposed** means the default in this draft, listed again in section 22.

### Habits

| ID | Requirement |
| --- | --- |
| HAB-001 | The system stores habits with the fields in [section 7](#7-habit-domain-model). |
| HAB-002 | Title and category are required to create a habit. Description is optional. |
| HAB-003 | **Proposed.** A new habit is created in `backlog` unless the client sends `startEstablishing: true`. |
| HAB-004 | The client can update title, description, category, and plan fields. Status does not change through the update endpoint. |
| HAB-005 | Delete is permanent and removes the habit, its practice records, and its status events. |
| HAB-006 | Category is one of a fixed set. Users cannot create categories. |

### Plan

| ID | Requirement |
| --- | --- |
| HAB-010 | Plan fields are: why, minimum action, trigger, weekdays, estimated duration in minutes. |
| HAB-011 | Plan fields may be empty while status is `backlog`. |
| HAB-012 | Entering `establishing` requires a complete plan. The API rejects the transition when any plan field is missing. |
| HAB-013 | `paused` and `established` habits always have a complete plan, because they passed through `establishing`. |
| HAB-014 | Weekdays use ISO numbering: 1 Monday through 7 Sunday. At least one weekday is required when the plan is complete. |
| HAB-015 | There is no time of day. "Scheduled today" means today's weekday in the client timezone is in `weekdays`. |

### Lifecycle

| ID | Requirement |
| --- | --- |
| HAB-020 | Status is exactly one of `backlog`, `establishing`, `paused`, `established`. |
| HAB-021 | The only transitions are those in [section 8](#8-habit-lifecycle--state-machine). Any other transition returns `409 INVALID_TRANSITION`. |
| HAB-022 | **Proposed.** `established` is terminal for the MVP. |
| HAB-023 | Repeating the transition that matches the current status returns the current habit and writes nothing (idempotent). |
| HAB-024 | Every successful status change appends one row to `habit_status_events` in the same transaction. |
| HAB-025 | Practice rows are never deleted because of a status change. |

### Capacity

| ID | Requirement |
| --- | --- |
| HAB-030 | A habit consumes one global slot only while `status = establishing`. |
| HAB-031 | Hard maximum is 3. The API rejects activation and resume with `409 CAPACITY_EXCEEDED` when 3 habits are already establishing. |
| HAB-032 | Recommended capacity is 2. The API still allows the third. The UI explains the recommendation. |
| HAB-033 | Backlog, paused, and established habits do not consume a slot. |
| HAB-034 | Pause, graduate, move-to-backlog from establishing, and delete of an establishing habit release the slot. |
| HAB-035 | The capacity check and the status write commit in one database transaction. |

### Practice

| ID | Requirement |
| --- | --- |
| HAB-040 | A practice outcome is `completed` or `skipped`. |
| HAB-041 | At most one practice row exists per habit per `practice_date`. A second write updates that row. |
| HAB-042 | While the habit is `establishing` or `paused`, the user can create a mark on a day the current schedule includes, and can change or clear an existing mark even when that weekday is no longer in the schedule. |
| HAB-043 | Creating, changing, or clearing a practice is rejected when the habit is `backlog` or `established`. |
| HAB-044 | A **new** practice row is rejected when that date's weekday is not in the current schedule. Updating or deleting an existing row does not use this check. |
| HAB-045 | A date with no row is not a stored "miss." The detail screen may label a past scheduled establishing day with no row as unmarked. Copy does not call it a failure. |
| HAB-046 | A day with no row whose weekday is outside the current schedule is not unmarked. A day that already has a row still shows that row. |
| HAB-047 | Future dates are rejected. |
| HAB-048 | The client sends an IANA timezone. "Today" is the current calendar date in that zone. |
| HAB-049 | Changing `weekdays` does not delete, rewrite, or hide existing practice rows. |

### Graduation

| ID | Requirement |
| --- | --- |
| HAB-050 | Only an `establishing` habit can graduate. |
| HAB-051 | Graduation is a deliberate action on the detail screen. No job or day count graduates a habit. |
| HAB-052 | The confirmation step shows factual counts and the plan. It does not show a score. |
| HAB-053 | **Proposed.** The confirm control stays disabled until the user checks one acknowledgement. The acknowledgement is not stored. |
| HAB-054 | On success, status becomes `established`, `established_at` is set, the slot is released, and practice history remains readable. |

### UI

| ID | Requirement |
| --- | --- |
| HAB-060 | Three routes exist: habit list, create/edit, habit detail. Daily practice is on the list and the detail. There is no Today page. |
| HAB-061 | The list shows a capacity indicator, status grouping, and a create action. |
| HAB-062 | Illegal actions are disabled. A stale client that still calls the API shows the server message and refetches. |
| HAB-063 | Delete and graduate require an explicit confirm dialog. |

---

## 7. Habit Domain Model

One habit row holds identity and the plan. The plan is 1:1 and is not versioned, so it is not a second table.

### Categories (fixed)

| Value | Label |
| --- | --- |
| `health` | Health |
| `mind` | Mind |
| `work` | Work |
| `home` | Home |
| `relationships` | Relationships |
| `learning` | Learning |
| `other` | Other |

**Proposed** set. Labels are UI copy. The API stores the value.

### Fields

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `id` | UUID string | always | Generated with `crypto.randomUUID()`. Immutable. |
| `title` | string | create | Trimmed. 1–80 characters. |
| `description` | string or null | no | Trimmed. Empty becomes null. Max 500. |
| `category` | category enum | create | One of the fixed values. |
| `why` | string or null | to establish | Trimmed. 1–500 when set. Personal reason. |
| `minimumAction` | string or null | to establish | Trimmed. 1–200 when set. The smallest version the user will actually do. |
| `trigger` | string or null | to establish | Trimmed. 1–200 when set. An existing behavior or event, not a reminder. |
| `weekdays` | int[] or null | to establish | Unique ISO weekdays, sorted ascending, length 1–7. Each value is 1–7. |
| `estimatedDurationMinutes` | int or null | to establish | Integer 1–180. Duration of the minimum action, not of the establishment period. |
| `status` | status enum | always | Default `backlog` on create. |
| `createdAt` | timestamptz | always | Set on insert. Immutable. |
| `updatedAt` | timestamptz | always | Set on insert and on every habit or practice mutation for that habit. |
| `activatedAt` | timestamptz or null | no | Set when a transition enters `establishing`. Overwritten on each resume or later activation. |
| `pausedAt` | timestamptz or null | no | Set when entering `paused`. Cleared when leaving `paused`. |
| `establishedAt` | timestamptz or null | no | Set when entering `established`. Cleared nowhere in the MVP (terminal). |

JSON uses camelCase. Postgres columns use snake_case (`minimum_action`, `estimated_duration_minutes`, `activated_at`, and so on).

Whitespace-only strings fail validation as empty. The API trims before length checks.

### What is intentionally absent

No user id, streak, color, icon, difficulty, target count, reminder time, archived flag, or sort index. List order is defined in HAB-061's API: status group, then `updatedAt` descending.

---

## 8. Habit Lifecycle & State Machine

```mermaid
stateDiagram-v2
  [*] --> backlog: create
  backlog --> establishing: activate
  establishing --> paused: pause
  establishing --> backlog: move to backlog
  establishing --> established: graduate
  paused --> establishing: resume
  paused --> backlog: move to backlog
  backlog --> [*]: delete
  establishing --> [*]: delete
  paused --> [*]: delete
  established --> [*]: delete
```

| From | To | Action | Capacity | Side effects |
| --- | --- | --- | --- | --- |
| — | `backlog` | create | none | Insert habit. Append status event `from = null`, `to = backlog`. |
| — | `establishing` | create with `startEstablishing: true` | consume | Same, but only if the plan is complete and a slot is free. `activatedAt = now`. Event `to = establishing`. |
| `backlog` | `establishing` | activate | consume | Require complete plan and a free slot. Set `activatedAt`. Clear `pausedAt`. |
| `establishing` | `paused` | pause | release | Set `pausedAt`. |
| `establishing` | `backlog` | move to backlog | release | Clear `activatedAt` and `pausedAt`. |
| `establishing` | `established` | graduate | release | Set `establishedAt`. Clear `pausedAt`. |
| `paused` | `establishing` | resume | consume | Require a free slot. Set `activatedAt`. Clear `pausedAt`. |
| `paused` | `backlog` | move to backlog | none | Clear `activatedAt` and `pausedAt`. |
| same | same | repeat that action | none | Return 200. Do not append an event. |

**Rejected**

| Attempt | Code |
| --- | --- |
| Any arrow not in the table, including `established` → anything and `paused` → `established` | `INVALID_TRANSITION` |
| Activate or resume at 3 establishing | `CAPACITY_EXCEEDED` |
| Activate or create-as-establishing with an incomplete plan | `PLAN_INCOMPLETE` |
| `PATCH` body containing `status` | `VALIDATION_ERROR` |

**Proposed and unconfirmed**

- `established` cannot return to `establishing`. The detail screen does not offer "practice again."
- Graduation is not available from `paused`. The user resumes (if a slot exists) and then graduates.
- Move-to-backlog from `establishing` or `paused` is allowed. Pause means "temporarily not now." Backlog means "not in this round." Both keep practice rows.
- `activatedAt` is the start of the current establishing stretch, not the first time ever. Lifetime time-in-establishing is computed from `habit_status_events`, not from `activatedAt`.

### Practice records across transitions

Rows stay. Graduation and pause do not filter them out of history. After `established`, `PUT` and `DELETE` practice return `409 PRACTICE_NOT_ALLOWED`. After a later move to `backlog`, practice writes stay rejected until the habit is establishing or paused again. Rows from the earlier stretch remain on the detail screen.

### Status events

`habit_status_events` is in the MVP because pause/resume would otherwise make "days establishing" unknowable. It is an append-only log, not a user-facing audit screen.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text PK | UUID |
| `habit_id` | text FK | `ON DELETE CASCADE` |
| `from_status` | habit_status or null | Null on create |
| `to_status` | habit_status | Not null |
| `occurred_at` | timestamptz | Transaction time |

Index: `(habit_id, occurred_at)`.

### UI for illegal transitions

- Hide or disable controls that the current status cannot perform.
- Capacity full: disable Activate, Resume, and "Start establishing." Keep Pause, Graduate, and Move to backlog enabled when those transitions are legal.
- If the API returns 409 anyway, show `message` inline on the detail screen (or on the card that fired the action) and invalidate the habits query.

---

## 9. Capacity Management Rules

Constants in `@repo/evolin-shared`:

```ts
export const ACTIVE_HABIT_RECOMMENDED = 2;
export const ACTIVE_HABIT_MAXIMUM = 3;
```

| Rule | Behavior |
| --- | --- |
| Who counts | `SELECT count(*) FROM habits WHERE status = 'establishing'` inside the write transaction. |
| Recommended | Not enforced. Response field `capacity.recommended` is always 2. |
| Maximum | Enforced on create-as-establishing, activate, and resume. |
| Unlimited | Backlog and established have no cap. Paused has no cap. |
| Delete | Deleting an establishing habit frees the slot on commit. |
| Concurrency | The write transaction takes `pg_advisory_xact_lock(841001)` before counting. The lock releases on commit or rollback. Two simultaneous activations cannot both observe `used = 2` and both insert a third and fourth. |
| Idempotent retry | Activating a habit that is already `establishing` does not take a second slot and does not require the lock to reject. |

`841001` is an arbitrary app-specific bigint. One lock is enough: the database has a single anonymous user.

### API payload

List and detail include:

```json
{
  "capacity": { "used": 2, "recommended": 2, "maximum": 3 }
}
```

`used` is the live count, not "slots including this habit" on a paused detail page.

### Errors

`409` body:

```json
{
  "statusCode": 409,
  "code": "CAPACITY_EXCEEDED",
  "message": "You can establish at most 3 habits at once.",
  "details": { "used": 3, "maximum": 3 }
}
```

### UI

- List header: `2 of 3 establishing`.
- `used < 2`: no extra sentence.
- `used = 2`: `Two at a time is the recommended load. One more slot is available.`
- `used = 3`: `All 3 slots are in use. Pause or graduate a habit before starting another.`
- Create screen: primary action is **Start establishing** when `used < 3` and the plan is complete; **Save to backlog** is always available. When `used = 3`, **Start establishing** is disabled and the full-capacity sentence is visible.

### Edge cases

| Case | Result |
| --- | --- |
| Third slot | Allowed. UI shows the recommendation copy before submit, not a blocking modal. |
| Fourth slot | 409. No partial write. |
| Pause then activate another | Allowed when the pause has committed and `used` is now &lt; 3. |
| Graduate the last establishing habit | `used` becomes 0. List empty-state for the Establishing group appears. |
| Two devices | Last committed transaction wins. The loser gets 409 and refetches. |

---

## 10. Practice Tracking Rules

### Scheduled today

Inputs, both required on list, detail, and practice writes:

| Input | Meaning |
| --- | --- |
| `timeZone` | IANA name, for example `Europe/Warsaw`. Validated with `Intl.DateTimeFormat`. Invalid → `400 VALIDATION_ERROR`. |
| `date` | `YYYY-MM-DD`. On list and detail, this is the client's local today. |

`scheduledToday` is true only when all of these hold:

- `status` is `establishing`
- `date` is today's calendar date in `timeZone` (server clock compared in that zone)
- ISO weekday of `date` is in `weekdays`

If the client sends a `date` that is not today in `timeZone`, list and detail return `400` with code `DATE_TIMEZONE_MISMATCH`. Practice writes use the path date and do not require it to be today.

### Outcomes

| Outcome | Meaning |
| --- | --- |
| `completed` | The user did the minimum action that day. |
| `skipped` | The user chose not to do it that day. This is a mark, not a failure state. |
| no row | Nothing was recorded. |

### Writes

`PUT /v1/habits/:id/practices/:date` with `{ "outcome": "completed" | "skipped", "timeZone": "..." }`.

Allowed when:

1. Status is `establishing` or `paused`.
2. `date` parses as a real calendar date.
3. `date` is less than or equal to today in `timeZone`.
4. `date` is on or after the habit's `createdAt` calendar date in `timeZone`.
5. The date overlaps an establishing interval (see below).
6. The weekday is in the current `weekdays` **only when no row exists yet**.

Otherwise:

| Failure | Code |
| --- | --- |
| Bad date, bad timezone, bad outcome | `VALIDATION_ERROR` |
| Status is `backlog` or `established` | `PRACTICE_NOT_ALLOWED` |
| Insert when the weekday is not in the current schedule | `PRACTICE_NOT_SCHEDULED` |
| Date after local today | `PRACTICE_DATE_IN_FUTURE` |
| Unknown habit | `HABIT_NOT_FOUND` |

Uniqueness: primary key `(habit_id, practice_date)`. `PUT` inserts or updates `outcome` and `updated_at`. Same outcome twice returns the same row (idempotent). A `PUT` that finds an existing row updates it and does not return `PRACTICE_NOT_SCHEDULED`.

`DELETE /v1/habits/:id/practices/:date` removes the row. Deleting a missing row returns `204` and does not check the weekday. Deleting an existing row uses the lifecycle and date checks, not the weekday check.

Paused habits may correct a past date. They may not write today's outcome unless today is still inside an establishing interval (it is not, once paused). The practical rule: **the date must overlap an establishing interval from `habit_status_events`.** Today while `establishing` overlaps the open interval. A paused habit can correct days from earlier establishing stretches only.

### Days

| Day | Behavior |
| --- | --- |
| Scheduled, establishing, no row | List shows **Done** and **Skip**. |
| Scheduled, row exists | List shows the outcome and **Undo**. Changing Done ↔ Skip is a PUT. |
| Not scheduled, no row | No practice controls. Detail cell is empty, not "missed." |
| Not scheduled, row exists | Detail still shows the stored outcome and, when the lifecycle allows, change and Undo. The list shows that outcome for today too. |
| Scheduled, past, was establishing, no row | Neutral unmarked dot. Copy: `Unmarked`. No banner, no streak break. |
| Was not establishing that day, no row | Not unmarked. Render as inactive. |
| Future | No cell actions. |

### History retention

Rows remain for the life of the habit. Status changes do not rewrite them. `PATCH` of `weekdays` does not delete or update `practice_records`. A stored outcome stays in `recent` and in `GET .../practices` after that weekday leaves the schedule. `inSchedule` on a recent day is the **current** schedule and can be false while `outcome` is still set. Delete habit cascades the rows.

Days with no row are not a stored history. An unmarked hint for those days uses the current schedule, because weekdays are not versioned. Do not add a schedule-history table. Changing the schedule may change which empty days look unmarked. It must not change a day that has a row.

### Progress numbers (detail only)

Computed, not stored:

| Field | Definition |
| --- | --- |
| `completedCount` | Practice rows with `completed`. |
| `skippedCount` | Practice rows with `skipped`. |
| `establishingDayCount` | Local calendar dates that overlap any closed or open establishing interval, from the first such date through today in `timeZone`, inclusive. |
| `recent` | 14 local dates ending today. Each item: `date`, `weekday`, `inSchedule` (current schedule only), `outcome` or null, `duringEstablishing` boolean. `outcome` is independent of `inSchedule`. |

The UI does not divide completed by establishing days into a percentage score.

### Timezone

The server does not store a user timezone. Every read that classifies "today" requires `timeZone`. Practice `practice_date` is a date, not a timestamp, so the zone is not re-applied later. DST gaps do not create a second row because the key is the calendar date.

---

## 11. Graduation Flow

### Who can start it

The detail screen shows **Mark established** only when `status` is `establishing`.

### What the user sees

A dialog, not a new route.

- Title: `Mark this habit established?`
- Plan recap: why, minimum action, trigger, weekday labels, duration.
- Facts, in this order:
  - `Establishing days: {establishingDayCount}`
  - `Completed: {completedCount}`
  - `Skipped: {skippedCount}`
- Sentence: `Graduate when the minimum action feels sustainable without this list. Evolin does not require a number of days.`
- Checkbox (**proposed**): `I can keep doing the minimum action without tracking it here.`
- **Mark established** stays disabled until the checkbox is on.
- **Cancel** closes the dialog and writes nothing.

The checkbox is UI state only. The API does not accept or store a score, a survey, or the checkbox value. `POST .../graduate` has an empty body.

### On confirm

1. Client calls graduate.
2. API re-checks status and transitions as in section 8.
3. Capacity drops by one.
4. Client closes the dialog, refetches, and stays on the detail screen.
5. Detail now shows status Established, `establishedAt`, the plan, and history. Practice controls are gone. Copy: `Practice history is kept. This habit no longer uses an active slot.`

### If the habit was paused or already established

- Paused: the graduate control is not rendered. API returns `INVALID_TRANSITION` if called.
- Already established: API returns 200 and the current habit (idempotent). The dialog is not shown again.

### History

No practice row is created for graduation day unless the user marked one. Graduation is not a practice outcome.

---

## 12. UX / UI Specification

Expo Web, mobile-first, one column up to 720px content width centered on larger screens. Touch targets at least 44px. No additional routes.

### Routes

| Path | Screen | Responsibility |
| --- | --- | --- |
| `/` | Habits | Capacity, groups, cards, today's practice, create. |
| `/habits/new` | Create | Plan form. Save to backlog or start establishing. |
| `/habits/[habitId]` | Detail | Plan, status actions, progress, 14-day history, practice. |
| `/habits/[habitId]/edit` | Edit | Same form as create, without the start/backlog choice. Save updates fields only. |

Stack navigation. Back from create, edit, and detail returns to the previous screen. The list is the only top-level screen.

### List

**Header.** `Habits`. Text button `New habit` (links to `/habits/new`).

**Capacity.** Text indicator from section 9. Not a chart.

**Groups, top to bottom.** Establishing, Paused, Backlog, Established. A group with zero habits is omitted. Within a group, `updatedAt` descending.

**Card.**

- Title, category label, status.
- Minimum action if present; otherwise `No minimum action yet` for backlog only.
- If `scheduledToday` and status is establishing: `PracticeActions` (Done, Skip, or outcome + Undo).
- If establishing and not scheduled today: `Not scheduled today`.
- Tap on the card body opens detail. Practice buttons stop that navigation.

**Primary action.** `New habit`.

**Secondary.** None on the list. Status changes happen on the detail screen so the list stays a practice surface.

**Empty (no habits at all).** `No habits yet.` `Add one you want to establish.` Button `New habit`.

**Empty filter.** There is no filter control in the MVP. Grouping is the only organization. **Proposed:** do not add chips; they duplicate the groups.

### Create / Edit

Single scroll form.

| Order | Field | Control |
| --- | --- | --- |
| 1 | Title | Text input |
| 2 | Description | Multiline, optional |
| 3 | Category | Select of the seven values |
| 4 | Why | Multiline |
| 5 | Minimum action | Text input |
| 6 | Trigger | Text input. Hint: `Something you already do.` |
| 7 | Schedule | Seven toggle buttons, Mon–Sun. At least one before start-establishing. |
| 8 | Estimated duration | Integer minutes. |

Create footer:

- `Save to backlog` — submits with `startEstablishing: false`. Plan fields may be incomplete.
- `Start establishing` — submits with `startEstablishing: true`. Disabled when the plan is incomplete or `used = 3`.

Edit footer:

- `Save` — `PATCH` changed fields. Does not change status.
- Delete is not on the edit screen. It stays on detail.

Validation errors render under the field. A 409 renders above the footer.

### Detail

1. Title, category, status.
2. Status actions (only legal ones): Activate, Pause, Resume, Move to backlog, Mark established.
3. Plan block. Incomplete backlog plan shows `Add a plan before starting` linking to edit.
4. If establishing and scheduled today: `PracticeActions`.
5. Progress counts from section 10, then a 14-day row. Legend text: `Filled is completed, outlined is skipped, dot is unmarked. A stored mark stays after the schedule changes. Empty means no row and not an unmarked establishing day.`
6. `Edit habit`.
7. `Delete habit` (destructive text button).

**Move to backlog** uses a confirm dialog: `Move "{title}" to the backlog? Practice history stays. It will not use an active slot.`

**Delete** uses a confirm dialog: `Delete "{title}"? Practice history is removed.`

**Pause** does not need a second dialog. It is reversible through Resume.

### Component hierarchy

```text
app/_layout.tsx
  QueryClientProvider
  Stack
app/index.tsx
  HabitsScreen
    CapacityIndicator
    HabitGroup
      HabitCard
        PracticeActions
app/habits/new.tsx
app/habits/[habitId]/edit.tsx
  HabitForm
app/habits/[habitId].tsx
  HabitDetailScreen
    StatusActions
    PlanSummary
    PracticeActions
    ProgressSummary
    RecentPractice
    GraduateDialog
    ConfirmDialog
```

`PracticeActions`, `HabitForm`, and `ConfirmDialog` are the shared pieces. Do not fork a second practice widget for the detail screen.

React Native Reusables primitives to add under `apps/evolin/components/ui` (only these): button, input, textarea, label, text, card, badge, separator, select, checkbox, alert-dialog. Icons from `lucide-react-native`.

The graduation acknowledgement uses the RNR checkbox (`@rn-primitives/checkbox` under `components/ui/checkbox.tsx`). Do not import `@repo/ui` or `@radix-ui/react-checkbox`. RNR on Expo Web runs through React Native Web. Use the maintained **NativeWind 4** line and **Tailwind 3.4**, which is the version `@repo/ui` already uses. Do not adopt NativeWind 5 or Tailwind 4. Overlay components (alert-dialog) need `PortalHost` from `@rn-primitives/portal` as the last child of the root layout. After the primitives are added, `npx @react-native-reusables/cli doctor` must pass.

### States

| State | UI |
| --- | --- |
| List loading | Three card-shaped placeholders. No spinner-only page. |
| Detail loading | Title line and two blocks of placeholders. |
| Mutation pending | The pressed button shows disabled pending state. Other actions stay usable. |
| Form field error | Message under the field. Submit stays enabled so the user can correct and retry. |
| 404 detail | `This habit is gone.` Link `Back to habits`. |
| Network error | `Could not reach Evolin API.` `Retry` refetches. |
| 409 | Server `message`, then refetch on dismiss. |

### Responsive

- Below 720px: full-bleed padding 16, stacked footer buttons, weekday toggles wrap.
- 720px and up: content column max 720, centered. Same components. No sidebar, no split view.

### Keyboard and mobile web

- Every control is a real `Button` or text input, focusable in browser tab order.
- Alert dialog traps focus and closes on Escape (Radix behavior via React Native Reusables on web).
- Weekday toggles are toggle buttons with `accessibilityState.checked` and accessible names `Monday` … `Sunday`.
- Practice buttons have accessible names `Mark completed`, `Skip today`, `Undo practice`.
- Do not rely on hover.

### Visual tone

Neutral surface, one accent for primary buttons, destructive color only for delete. No illustrations, confetti, or streak flames.

---

## 13. Technical Architecture

```mermaid
flowchart LR
  browser["Expo Web on the host :8081"]
  api["NestJS on the host :8092"]
  db["Postgres in Docker :5435"]
  shared["@repo/evolin-shared Zod contracts"]
  browser --> api
  api --> db
  browser --- shared
  api --- shared
```

| Piece | Choice |
| --- | --- |
| Web UI | Expo, React Native, React Native Web, Expo Router. Run on the host. |
| UI kit | React Native Reusables + NativeWind in `apps/evolin/components/ui`. |
| Server state | TanStack Query. |
| Forms | React Hook Form + Zod resolver. |
| Local UI state | React `useState` / `useReducer`. |
| API | NestJS 11 modular monolith. One `HabitsModule`. |
| Validation | Zod schemas from `@repo/evolin-shared` on both sides. |
| DB | Postgres 16, Drizzle, SQL migrations generated by drizzle-kit. |
| Identity | None. One database, one implicit user. |

### Backend layout

```text
apps/evolin-api/
  src/
    main.ts
    env/env.ts
    database/database.module.ts
    database/schema.ts
    habits/habits.module.ts
    habits/habits.controller.ts
    habits/habits.service.ts
    habits/habit-transitions.ts
    habits/practice-rules.ts
  docker-compose.yml
  drizzle.config.ts
  package.json
```

`habit-transitions.ts` is a pure function: `(status, action) → next status | error`. `practice-rules.ts` is pure date/schedule checks. The service owns transactions. The controller parses Zod and maps errors.

No generic repository layer. No second module.

### Frontend layout

```text
apps/evolin/
  app/_layout.tsx
  app/index.tsx
  app/habits/new.tsx
  app/habits/[habitId].tsx
  app/habits/[habitId]/edit.tsx
  components/ui/
  features/habits/
  lib/api/client.ts
  lib/api/habits.ts
  lib/query-client.ts
```

`lib/api/client.ts` is a small `fetch` wrapper that prefixes `EXPO_PUBLIC_API_URL` and parses the error envelope. It is not a generated SDK.

### Exception to the repo HTTP-client rule

`@repo/api/helpers` depends on a package that also depends on NestJS. Metro must not bundle that graph. Evolin calls `fetch` from `apps/evolin/lib/api/client.ts` and does not import `@repo/api`.

### Exception to the shared-UI rule

`@repo/ui` is Radix DOM + Tailwind for Next apps. Evolin does not import it and does not wrap new components in `@radix-ui/themes`. React Native Reusables stay inside the app until a second native app exists.

---

## 14. Monorepo Integration

Inspected layout: `pnpm-workspace.yaml` already includes `apps/*` and `packages/*`. New folders are picked up without editing the workspace globs. `turbo.json` task graph (`build`, `dev`, `lint`, `test`) applies to any package that defines those scripts.

### Existing surfaces to leave alone

`apps/devinity-*`, `apps/take-and-do`, `apps/todex-*`, `apps/personal-website`, `apps/tempo`, `packages/ui`, `packages/api`, `packages/shared`.

### New package `@repo/evolin-shared`

Justified contents only:

- Zod schemas and inferred types for habit, create, update, practice, capacity, and the error envelope.
- Constants `ACTIVE_HABIT_RECOMMENDED` and `ACTIVE_HABIT_MAXIMUM`.
- Pure helpers: `isoWeekday(date, timeZone)`, `isScheduledWeekday`, `assertCompletePlan`.

No React, no Nest, no Drizzle. Do not set `"type": "module"`.

`todex-api` has no `"type": "module"`. Its `tsconfig` extends `@repo/typescript-config/nestjs.json` (`module: nodenext`), so Nest emits CommonJS and loads dependencies with `require()`. A shared package that is ESM, or that points both `import` and `require` at one ESM file, fails that load. `@repo/api` is `"type": "module"` and is the wrong template here.

**Compile.** `packages/evolin-shared/tsconfig.json` extends `base.json` and overrides `module` to `CommonJS` and `moduleResolution` to `Node`. `outDir` is `dist`. The emitted `dist/index.js` is CommonJS.

**Exports.**

```json
{
  "name": "@repo/evolin-shared",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "react-native": "./src/index.ts",
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  }
}
```

Metro's default condition names include `react-native`, so Expo transpiles `src/index.ts` and does not load `dist`. Nest resolves `default` and `require()`s the CommonJS build. Do not publish an ESM build, and do not point `import` and `require` at the same file.

`evolin-api` also has no `"type": "module"`, matching `todex-api`. Its `build` depends on `^build`, which produces `dist` before the API compiles. Zod stays the catalog `zod` (`^4.1.11`); that package is dual and loads from the CommonJS entry.

Do not put these types in `@repo/api`. That package pulls Nest and class-validator and is the wrong boundary for a React Native app.

### Tooling reuse

| Concern | Decision |
| --- | --- |
| TypeScript, API | Extend `@repo/typescript-config/nestjs.json`. |
| TypeScript, shared | Extend `base.json`, then override to CommonJS as in the package section above. |
| TypeScript, Expo | New `apps/evolin/tsconfig.json` extends `base.json` and **overrides** `module` to `ESNext`, `moduleResolution` to `Bundler`, `jsx` to `react-jsx`, `customConditions` to `["react-native"]`, `lib` to `["ES2022", "DOM"]`. Do not extend `nextjs.json` (Next plugin). |
| ESLint, API | `@repo/eslint-config/nest-js`. |
| ESLint, shared | `@repo/eslint-config/library`. |
| ESLint, Expo | `@repo/eslint-config/base` plus `eslint-plugin-react` and `eslint-plugin-react-hooks`. Do not use the Next config. |
| Tests, API | `@repo/vitest-config` nest preset, Vitest, supertest. Not Jest. |
| Prettier | Repo root. `singleQuote: true`. |
| Zod | Catalog `zod` `^4.1.11`. Use a resolver release that supports Zod 4. |
| Nest, Drizzle, pg | Catalog versions already used by `todex-api`. |

### Expo / pnpm constraints

The repo uses pnpm's isolated linker (`pnpm-workspace.yaml` has no `nodeLinker`). Leave it. Do not set `node-linker=hoisted`. Expo SDK 52 and later detect this workspace and configure Metro. SDK 54 and later support isolated installs. Manual `watchFolders`, `resolver.nodeModulesPaths`, `resolver.extraNodeModules`, and `resolver.disableHierarchicalLookup` fight that setup. Do not add them.

`apps/evolin/metro.config.js` is only the NativeWind wrapper around Expo's default:

```js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
```

Run `expo start --web --clear` once after creating that file.

NativeWind:

- **NativeWind 4** and **Tailwind 3.4**, including `nativewind/preset`. Not NativeWind 5, not Tailwind 4.
- `tailwind.config.js` `content` globs only under `apps/evolin`.
- Do not import `@repo/ui/tailwind-preset`.
- `babel.config.js` uses `babel-preset-expo` with `jsxImportSource: 'nativewind'` and the `nativewind/babel` preset. `global.css` is imported from the root layout.

React:

- The root catalog is `react` `^19.1.0` and `@types/react` `^18.2.61`. Other apps depend on `catalog:` and must keep doing so.
- `apps/evolin/package.json` depends on the exact `react`, `react-dom`, `react-native`, `@types/react`, and `@types/react-dom` versions the chosen Expo SDK documents. It does **not** use `catalog:` for those packages. The catalog's `@types/react` is `^18`, which does not match a React 19 Expo app.
- pnpm applies `pnpm.overrides` only from the root `package.json`. A root override would change React for every app. Do not add one. Package-level `pnpm.overrides` are not a workaround; pnpm does not honor them.
- Isolated installs keep a different React under `apps/evolin/node_modules` when the Expo pin differs from the catalog. Do not add `pnpm.packageExtensions` for React.
- After install, `pnpm why react --filter evolin` shows the Expo pin, and `pnpm why react --filter devinity-web` still shows the catalog range.

Expo SDK: use the current stable SDK that supports NativeWind 4. Do not guess the SDK number in this PRD. Web-only script: `expo start --web`. Do not add `expo run:ios` or `expo run:android` scripts.

Node:

- Root `engines.node` is `>=20.18.0`. That range allows Node 22.
- Node 20 left LTS on 2026-04-30. The API image uses `node:22-bookworm` (maintenance LTS, still supported, accepted by `engines`). Do not bump the repo `engines` field in this MVP. Do not use a Current (odd) release.

### Git scope

`EVL` is **proposed** for Evolin. Before the first commit, add `EVL` to:

- `commitlint.config.cjs` `scope-enum`
- `.husky/pre-commit` and `.husky/pre-push` branch regex
- `.cursor/rules/git-conventions.mdc`, `.cursor/rules/monorepo-architecture.mdc`, and the root `README.md` scope lists

Until that lands, commits on Evolin files cannot pass hooks. That tooling edit is part of milestone 0, not a product feature.

### Root scripts to add

```text
dev:evolin    turbo run dev --filter=evolin --filter=evolin-api --filter=@repo/evolin-shared
docker:evolin pnpm --filter evolin-api docker:up && pnpm --filter evolin-api db:migrate
```

`pnpm docker:evolin` starts Postgres and applies migrations from the host. `pnpm dev:evolin` starts the API and Expo Web on the host. Do not add a Compose file at the repo root.

Register `EXPO_PUBLIC_API_URL`, `DATABASE_URL`, `WEB_ORIGIN`, and `PORT` in `turbo.json` `globalEnv` when those apps start reading them through Turbo.

---

## 15. Backend & REST API Contracts

Base URL: `http://localhost:8092`. Global prefix: `v1`. `GET /health` is excluded from the prefix and returns `{ "status": "ok" }`.

JSON error envelope, every 4xx and 5xx:

```json
{
  "statusCode": 409,
  "code": "CAPACITY_EXCEEDED",
  "message": "You can establish at most 3 habits at once.",
  "details": {}
}
```

| Code | HTTP | When |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Zod failure, including unknown fields and a `status` key on PATCH. `details.issues` is the Zod issue list. |
| `DATE_TIMEZONE_MISMATCH` | 400 | List/detail `date` is not today in `timeZone`. |
| `HABIT_NOT_FOUND` | 404 | Unknown id. |
| `CAPACITY_EXCEEDED` | 409 | No free slot. |
| `INVALID_TRANSITION` | 409 | Action not allowed from the current status. |
| `PLAN_INCOMPLETE` | 409 | Activate or start-establishing with a missing plan field. `details.fields` lists them. |
| `PRACTICE_NOT_ALLOWED` | 409 | Status cannot accept practice writes. |
| `PRACTICE_NOT_SCHEDULED` | 409 | Insert of a new row whose weekday is not in the current `weekdays`. Not used when the date already has a row. |
| `PRACTICE_DATE_IN_FUTURE` | 409 | Path date is after local today. |

Controllers use a Zod pipe around `@repo/evolin-shared` schemas. Do not add class-validator DTOs for the same bodies.

### Habit JSON

```ts
type Habit = {
  id: string;
  title: string;
  description: string | null;
  category: HabitCategory;
  why: string | null;
  minimumAction: string | null;
  trigger: string | null;
  weekdays: number[] | null;
  estimatedDurationMinutes: number | null;
  status: "backlog" | "establishing" | "paused" | "established";
  createdAt: string;
  updatedAt: string;
  activatedAt: string | null;
  pausedAt: string | null;
  establishedAt: string | null;
  scheduledToday: boolean;
  todayPractice: { date: string; outcome: "completed" | "skipped" } | null;
};
```

Timestamps are ISO-8601. `todayPractice` is the row for the query `date`, or null.

### `GET /v1/habits`

Query: `timeZone` (required), `date` (required, local today).

Response `200`:

```ts
type HabitList = {
  capacity: { used: number; recommended: 2; maximum: 3 };
  habits: Habit[];
};
```

Order: `establishing`, `paused`, `backlog`, `established`, then `updatedAt` desc. No pagination in the MVP (a single user will not have a list large enough to need it; cap is not enforced on backlog count).

### `POST /v1/habits`

Body:

```ts
type CreateHabit = {
  title: string;
  description?: string | null;
  category: HabitCategory;
  why?: string | null;
  minimumAction?: string | null;
  trigger?: string | null;
  weekdays?: number[] | null;
  estimatedDurationMinutes?: number | null;
  startEstablishing?: boolean; // default false
  timeZone: string;
  date: string;
};
```

`201` returns `{ habit, capacity }` using the same `Habit` shape. `startEstablishing: true` runs the capacity transaction. `false` ignores capacity.

### `GET /v1/habits/:id`

Query: `timeZone`, `date`.

`200`:

```ts
type HabitDetail = {
  habit: Habit;
  capacity: { used: number; recommended: 2; maximum: 3 };
  progress: {
    completedCount: number;
    skippedCount: number;
    establishingDayCount: number;
    recent: Array<{
      date: string;
      weekday: number;
      inSchedule: boolean;
      duringEstablishing: boolean;
      outcome: "completed" | "skipped" | null;
    }>;
  };
};
```

`recent` length is 14, ending at `date`.

### `PATCH /v1/habits/:id`

Body: any subset of plan and identity fields except `status`, ids, and timestamps. At least one field. `timeZone` and `date` required so the returned habit can include `scheduledToday`.

`200` `{ habit, capacity }`.

Clearing a plan field with `null` is allowed only while `backlog`. On `establishing`, `paused`, or `established`, a patch that would null a required plan field returns `409 PLAN_INCOMPLETE` and writes nothing.

### `DELETE /v1/habits/:id`

`204` empty body. Idempotent: unknown id returns `404` (the resource never existed). A second delete is `404`.

### Transitions

Each is `POST` with body `{ "timeZone": string, "date": string }` and response `200` `{ habit, capacity }`.

| Action | Path |
| --- | --- |
| Activate | `/v1/habits/:id/activate` |
| Pause | `/v1/habits/:id/pause` |
| Resume | `/v1/habits/:id/resume` |
| Move to backlog | `/v1/habits/:id/backlog` |
| Graduate | `/v1/habits/:id/graduate` |

No request body fields beyond timezone and date. Graduate does not take a questionnaire.

### `PUT /v1/habits/:id/practices/:date`

Body: `{ outcome: "completed" | "skipped", timeZone: string }`.

`200`:

```ts
type Practice = {
  habitId: string;
  practiceDate: string;
  outcome: "completed" | "skipped";
  createdAt: string;
  updatedAt: string;
};
```

### `DELETE /v1/habits/:id/practices/:date`

Query: `timeZone`. `204` when the row is gone, including when it was already gone.

### `GET /v1/habits/:id/practices`

Query: `from`, `to` (`YYYY-MM-DD`), `timeZone`. Default `to` = today in that zone, `from` = 27 days earlier (28 days inclusive). Max range 366 days. `400` if `from` &gt; `to`.

`200`: `{ practices: Practice[] }` ordered by `practiceDate` ascending. This is the history endpoint. The detail screen uses `progress.recent` and does not need this call for the first 14 days. The endpoint exists so history is not trapped inside the detail assembler.

### Health

`GET /health` → `200` `{ "status": "ok" }`. No database check required for Compose readiness. A failed DB query surfaces on the first real request.

### CORS

`enableCors({ origin: WEB_ORIGIN, methods: ["GET","POST","PATCH","DELETE","OPTIONS"], allowedHeaders: ["Content-Type"] })`. `WEB_ORIGIN` default `http://localhost:8081`. Credentials are off. There are no cookies.

---

## 16. Database Schema

Postgres enums:

```text
habit_status: backlog | establishing | paused | established
habit_category: health | mind | work | home | relationships | learning | other
practice_outcome: completed | skipped
```

### `habits`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | text | PK |
| `title` | text | not null |
| `description` | text | null |
| `category` | habit_category | not null |
| `why` | text | null |
| `minimum_action` | text | null |
| `trigger` | text | null |
| `weekdays` | smallint[] | null |
| `estimated_duration_minutes` | smallint | null |
| `status` | habit_status | not null default `backlog` |
| `created_at` | timestamptz | not null default now() |
| `updated_at` | timestamptz | not null default now() |
| `activated_at` | timestamptz | null |
| `paused_at` | timestamptz | null |
| `established_at` | timestamptz | null |

Checks:

- `title` length between 1 and 80.
- `description` is null or length ≤ 500.
- `why` is null or length between 1 and 500. Same pattern for `minimum_action` (≤ 200) and `trigger` (≤ 200).
- `estimated_duration_minutes` is null or between 1 and 180.
- `weekdays` is null or (`cardinality` between 1 and 7 and every element is between 1 and 7). Uniqueness and sort are enforced in the service before write; the check stops empty arrays and out-of-range values.
- Plan completeness: `status = 'backlog' OR (why, minimum_action, trigger, weekdays, estimated_duration_minutes are all not null)`.

Indexes:

- `habits_status_updated_idx` on `(status, updated_at desc)`.

No `user_id`. Adding accounts later is a new migration, not a nullable column "just in case."

### `practice_records`

| Column | Type | Constraints |
| --- | --- | --- |
| `habit_id` | text | PK part, FK → `habits.id` `ON DELETE CASCADE` |
| `practice_date` | date | PK part |
| `outcome` | practice_outcome | not null |
| `created_at` | timestamptz | not null default now() |
| `updated_at` | timestamptz | not null default now() |

Primary key `(habit_id, practice_date)` is the duplicate prevention. Index is the PK.

### `habit_status_events`

As in section 8. FK `ON DELETE CASCADE`.

### Transactions

| Operation | Boundary |
| --- | --- |
| Create backlog | One transaction: insert habit, insert event. |
| Create establishing, activate, resume | One transaction: advisory lock, count, insert or update, insert event. Roll back on capacity or plan failure. |
| Pause, graduate, move to backlog | One transaction: update habit, insert event. Lock not required (they do not consume a slot). |
| Patch | One transaction: update habit. No event. |
| Delete habit | One transaction: delete habit (cascades). |
| Put practice | One transaction: insert or update practice, bump `habits.updated_at`. |
| Delete practice | One transaction: delete practice, bump `habits.updated_at`. |

The service uses Drizzle's transaction callback. No nested transactions.

### Migrations

- `apps/evolin-api/drizzle.config.ts` points at `src/database/schema.ts` and `out: ./drizzle`.
- Generate and migrate run on the host against `localhost:5435` (section 17).
- First migration creates enums and the three tables.
- No seed. The app starts empty.
- No `db:push` in the documented flow.

---

## 17. Local Development Infrastructure

`apps/evolin-api` owns local infrastructure. There is no Compose file at the repo root.

```text
apps/evolin-api/
  docker-compose.yml
  drizzle.config.ts
  package.json
  src/
```

`packages/evolin-shared` is the folder for `@repo/evolin-shared`. The API and Expo stay on the host and are not Compose services.

### Ports

| Service | Where | Port | Notes |
| --- | --- | --- | --- |
| Postgres | Compose service `postgres` | **5435 → 5432** | 5432 is Devinity, **5433 is Take&Do**, 5434 is Todex. |
| API | host process | **8092** | 8090 is Devinity API. 8091 is Todex API. |
| Expo Web | host process | **8081** | Expo's web default. |

Compose binds Postgres to `127.0.0.1`.

### Connection URLs

| Caller | URL |
| --- | --- |
| API on the host → Postgres | `postgresql://postgres:password@localhost:5435/evolin` |
| Expo on the host → API | `http://localhost:8092` |

### Compose file

Path: `apps/evolin-api/docker-compose.yml`. Top-level `name: evolin` so the volume is prefixed `evolin_` and does not collide with other apps. One service. No Redis. No API image.

**postgres**

- Image `postgres:16-alpine` (not pgvector).
- Database `evolin`, user `postgres`, password `password`. Local only.
- Volume key `pgdata` (project name makes it `evolin_pgdata`) mounted at `/var/lib/postgresql/data`.
- Healthcheck `pg_isready -U postgres -d evolin`.
- Port `127.0.0.1:5435:5432`.

### Environment examples

`apps/evolin-api/.env.example` is what the host API reads:

```text
PORT=8092
DATABASE_URL=postgresql://postgres:password@localhost:5435/evolin
WEB_ORIGIN=http://localhost:8081
```

`apps/evolin/.env.example`:

```text
EXPO_PUBLIC_API_URL=http://localhost:8092
```

Expo inlines `EXPO_PUBLIC_*` at bundle time. Restart Expo after changing it. Do not commit a real `.env`.

### Commands

Host `pnpm install` once, from the repo root, before Expo. Then, still from the repo root:

```bash
pnpm docker:evolin
pnpm dev:evolin
```

Open `http://localhost:8081`. The API is `http://localhost:8092`.

| Goal | Command |
| --- | --- |
| Start Postgres and migrate | `pnpm docker:evolin` |
| Postgres logs | `docker compose -f apps/evolin-api/docker-compose.yml logs -f` |
| Generate a migration | `pnpm --filter evolin-api db:generate` |
| Apply migrations | `pnpm --filter evolin-api db:migrate` |
| Stop Postgres, keep data | `pnpm docker:evolin:down` |
| Wipe the database volume | `pnpm docker:evolin:clean` |
| Start API and Expo Web | `pnpm dev:evolin` |
| Stop API and Expo | Ctrl+C in that terminal |

`docker:evolin:clean` removes `evolin_pgdata`. Run `db:migrate` again after a database wipe. Migrations do not run when the Postgres container starts.

### Hot reload

- API: `nest start --watch` on the host. `@repo/evolin-shared` rebuilds through the Turbo `dev` dependency.
- Expo: Fast Refresh on the host.

### What is not run in Docker

The API, Expo, Metro, and the web bundle. `docker-compose.yml` has no API service and no frontend service.

---

## 18. Non-Functional Requirements

| Topic | Requirement |
| --- | --- |
| Audience | One local user. The API has no auth. Do not publish it beyond the machine. Compose binds Postgres to `127.0.0.1:5435`. |
| Queries | List uses one query for habits plus today's practice (left join on `practice_date = date`) and one count for capacity. Detail adds one practice aggregate and one status-event read. No per-card HTTP calls. |
| Payload | List returns habit fields only. `progress.recent` is detail-only. |
| Transactions | Capacity races are covered by the advisory lock, not by a UI disable. |
| Time | Server comparisons that need "today" use the request `timeZone`. Postgres runs with `TZ=UTC`. |
| Accessibility | Section 12 keyboard and naming rules. Color is not the only status signal; the status label is text. |
| Bundle | Do not import `@repo/ui`, `@repo/api`, or icon barrels outside `lucide-react-native` icons that are named imports. Expo's package import optimization may stay on. |
| Logging | Nest logger for 5xx. No analytics SDK. |
| Secrets | Local password `password` is acceptable only because the port is bound to localhost and the database is development data. |

Performance budgets are not invented here. The structural requirement is the query shape above.

---

## 19. Edge Cases & Error Handling

| Case | Behavior |
| --- | --- |
| Activate with blank why | `409 PLAN_INCOMPLETE`, `details.fields` includes `why`. Form scrolls to the first missing field when the client already knows; the API is still the authority. |
| Start establishing while at capacity | Button disabled. Direct API call returns `CAPACITY_EXCEEDED`. |
| Double-click Activate | First request commits. Second sees `establishing` and returns 200 without a new event. |
| Pause an already paused habit | 200, no new event. |
| Graduate twice | 200 the second time, no second `establishedAt` overwrite if already set. |
| Graduate while paused | `INVALID_TRANSITION`. |
| Resume when 3 others are establishing | `CAPACITY_EXCEEDED`. This habit stays paused. |
| Delete during another client's view | Other client gets 404 on detail and refetches the list. |
| PUT completed then PUT skipped | One row, outcome skipped, `updatedAt` changes, `createdAt` unchanged. |
| PUT the same outcome | 200, no logical change. `updatedAt` may stay unchanged if the outcome is equal (skip the write). |
| DELETE practice twice | First 204, second 204. |
| New practice on Sunday when Sunday is off and that date has no row | `PRACTICE_NOT_SCHEDULED`. |
| Practice tomorrow | `PRACTICE_DATE_IN_FUTURE`. |
| Practice on a paused habit for today | Today is not inside an establishing interval → `PRACTICE_NOT_ALLOWED`. |
| Correct a completed day from last week while paused, if that day was establishing | 200. |
| Correct history after established | `PRACTICE_NOT_ALLOWED`. |
| Edit weekdays while establishing | Allowed. Existing practice rows stay, including their outcomes. A day that already has a row can still be changed or cleared. A new row on a removed weekday returns `PRACTICE_NOT_SCHEDULED`. Today's create buttons follow the new schedule. |
| Clear why while establishing | `PLAN_INCOMPLETE`, no write. |
| Title of 81 characters | `400 VALIDATION_ERROR`. |
| Unknown category | `400 VALIDATION_ERROR`. |
| Invalid timezone `Mars/Base` | `400 VALIDATION_ERROR`. |
| DST spring-forward | One date key. No duplicate row. |
| API down | List shows the network error and Retry. |
| Migration not applied | API boots, first query returns 500. README says to migrate before opening the app. |
| Container clock skew vs phone | "Today" follows the server clock rendered in the client zone. A client clock more than a calendar day off can get `DATE_TIMEZONE_MISMATCH`. Accepted for local MVP. |

User-facing messages are the `message` strings in section 15. Do not show Postgres errors in the UI.

---

## 20. Acceptance Criteria

### Create and backlog

**Given** an empty database  
**When** the user saves a habit with only title and category  
**Then** it appears in the Backlog group, `used` stays 0, and no practice controls show.

**Given** a backlog habit with no why  
**When** the user activates it  
**Then** the API returns `PLAN_INCOMPLETE` and the status stays `backlog`.

### Capacity

**Given** 3 establishing habits  
**When** the user activates a fourth  
**Then** the API returns `CAPACITY_EXCEEDED`, the fourth stays in its previous status, and the list says all 3 slots are in use.

**Given** 2 establishing habits  
**When** the user starts a third  
**Then** the create succeeds and the list shows the recommendation sentence plus `3 of 3`.

**Given** 3 establishing habits  
**When** the user pauses one  
**Then** `used` is 2 and another backlog habit can activate.

### Practice

**Given** an establishing habit scheduled for today's weekday  
**When** the user marks Done on the list  
**Then** the card shows completed and a second Done does not create a second row.

**Given** that completed mark  
**When** the user presses Undo  
**Then** the row is gone and Done / Skip show again.

**Given** an establishing habit not scheduled today and no row for today  
**When** the user opens the list  
**Then** the card says `Not scheduled today` and a direct PUT for today returns `PRACTICE_NOT_SCHEDULED`.

**Given** a completed practice on a weekday that is later removed from the schedule  
**When** the habit is still establishing  
**Then** the history still shows completed, a PUT to `skipped` for that date returns 200, and a new PUT for a different off-schedule date with no row returns `PRACTICE_NOT_SCHEDULED`.

**Given** a skipped mark  
**When** the user changes it to completed  
**Then** the same date has outcome completed.

**Given** an established habit  
**When** the user PUTs a practice  
**Then** the API returns `PRACTICE_NOT_ALLOWED` and the detail screen has no practice buttons.

### Graduation

**Given** an establishing habit with two completed practices  
**When** the user opens Mark established  
**Then** the dialog shows those counts, the confirm button is disabled until the acknowledgement is checked, and no request has been sent.

**Given** the user confirms  
**When** graduate succeeds  
**Then** status is established, `used` decreases by one, the two practice rows still load, and the habit is not in the Establishing group.

**Given** a paused habit  
**When** the user looks at detail  
**Then** Mark established is absent.

### Lifecycle rejects

**Given** an established habit  
**When** the client calls activate  
**Then** the API returns `INVALID_TRANSITION`.

**Given** a paused habit  
**When** the client calls graduate  
**Then** the API returns `INVALID_TRANSITION`.

### Delete

**Given** a habit with practice rows  
**When** the user confirms delete  
**Then** the habit, practices, and status events are gone and the list no longer shows it.

---

## 21. Implementation Milestones

Ordered so each step is demoable. Do not start the Expo UI before the API transitions exist.

- [ ] **M0 — Scope tooling.** Add `EVL` to commitlint, Husky, and the scope docs listed in section 14.
- [ ] **M1 — `@repo/evolin-shared`.** CommonJS build, Zod schemas, constants, weekday helper, plan completeness helper. Unit tests for weekday and plan rules. A Nest test `require`s `dist`. No app yet.
- [ ] **M2 — Compose and API shell.** `apps/evolin-api/docker-compose.yml` with Postgres only, env example, health route, Drizzle schema, first migration, empty `HabitsModule`. The API runs on the host.
- [ ] **M3 — Habit writes.** Create, patch, delete, five transitions, advisory lock, status events. Vitest coverage for the pure transition table and an e2e test that the fourth establishing habit returns 409.
- [ ] **M4 — Practice.** Put, delete, list history, detail progress. E2e for the unique date key, for `PRACTICE_NOT_SCHEDULED` on insert, and for updating an existing row after its weekday leaves the schedule.
- [ ] **M5 — Expo shell.** Router, NativeWind 4, default Expo Metro config, Query client, API client, RNR primitives including checkbox. List loads from the API. `pnpm why react` still shows the catalog range for `devinity-web`.
- [ ] **M6 — Screens.** List groups, capacity copy, create/edit form, detail, practice actions, graduate dialog, delete confirm.
- [ ] **M7 — Verify.** `pnpm --filter @repo/evolin-shared test`, `pnpm --filter evolin-api test`, `pnpm --filter evolin-api test:e2e`, lint on the three packages, and the manual flow in section 20 on Expo Web at 390px width and at 1280px width.

### Testing map

| Layer | What |
| --- | --- |
| `@repo/evolin-shared` | ISO weekday across a known timezone, schedule membership, plan completeness. |
| `evolin-api` unit | Transition table, capacity decision given a count, practice date rules. Pure functions, no database. |
| `evolin-api` e2e | Supertest against `AppModule` and the Compose database (or a dedicated `evolin_test` database on the same instance). Cover create, 409 capacity, practice upsert, graduate. |
| Expo | No Detox and no Playwright in the MVP. Manual section 20. |

### Agent constraints while implementing

- Do not import `@repo/ui` or `@repo/api` from `apps/evolin`.
- Do not set `node-linker=hoisted`, root `pnpm.overrides`, or manual Metro `watchFolders` / `nodeModulesPaths`.
- Do not put the API in Docker. Compose runs Postgres only.
- Do not add auth, Redis, Zustand, notifications, or a Today route.
- Do not store a graduation score.
- Do not enforce the recommended cap of 2 in the API.
- Keep plan columns on `habits`.
- Keep status changes out of `PATCH`.

---

## 22. Open Questions & Assumptions

Each line is a **proposed default** already specified above. Change the PRD before implementation if the default is wrong.

| # | Question | Default in this draft |
| --- | --- | --- |
| Q1 | Git scope code for Evolin? | `EVL`, and the PRD lives in `docs/prd/EVL/`. |
| Q2 | Can an established habit return to establishing? | No. Terminal. |
| Q3 | Can the user graduate while paused? | No. Resume, then graduate. |
| Q4 | Is move-to-backlog a real action? | Yes, from establishing and from paused. |
| Q5 | Where do plan fields live? | Columns on `habits`, not a `habit_plans` table. |
| Q6 | Is status history stored? | Yes, `habit_status_events`, because pause/resume otherwise destroys duration. |
| Q7 | Category list? | The seven values in section 7. Fixed. |
| Q8 | Schedule shape? | ISO weekdays only. No time of day. At least one day to establish. |
| Q9 | What does estimated duration mean? | Minutes for the minimum action, 1–180. |
| Q10 | Does the recommended cap of 2 block the API? | No. UI copy only. Hard cap is 3. |
| Q11 | Is a self-assessment stored? | One checkbox in the dialog. Not sent or stored. |
| Q12 | May the user edit a past practice? | Yes, while establishing or paused, for dates inside an establishing interval, up through today. |
| Q13 | Are off-schedule days recordable? | A new row, no. An existing row can be changed or cleared regardless of the current weekday. |
| Q14 | How is "missed" stored? | It is not stored. Rows survive schedule edits. Unmarked hints for days with no row use the current schedule. |
| Q15 | Does the product remember timezone? | No. The client sends an IANA zone on each request. |
| Q16 | Is there a user id? | No column. |
| Q17 | Package name for contracts? | `@repo/evolin-shared`, not an unscoped `evolin-shared` and not `@repo/api`. |
| Q18 | HTTP client in the app? | `fetch` in `apps/evolin/lib/api/client.ts`. |
| Q19 | List filters as chips? | No. Groups only. |
| Q20 | Expo SDK number? | Latest stable at implementation. Not pinned here. |

### Assumptions that are not product choices

- The implementer can add `EVL` to Husky without a separate product review.
- Nest watch runs on the host, so Docker file-watch polling is not required.
- A single advisory lock is correct only while the database holds one person's habits. That matches the no-auth MVP.
- Binding Postgres to `127.0.0.1` is sufficient local isolation. The API is a host process.

---

## Implementation checklist

- [ ] M0 scope tooling (`EVL`)
- [ ] M1 `@repo/evolin-shared` schemas, constants, pure helpers, unit tests
- [ ] M2 `apps/evolin-api/docker-compose.yml` (Postgres only), health, Drizzle migration
- [ ] M3 habit CRUD, state machine, capacity lock, e2e for the fourth slot
- [ ] M4 practice put/delete/history and detail progress
- [ ] M5 Expo Router, NativeWind, TanStack Query, API client
- [ ] M6 list, form, detail, graduate, delete
- [ ] M7 lint, unit, e2e, manual web pass at 390px and 1280px
