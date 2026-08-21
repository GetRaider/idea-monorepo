# Focus Page — Timer Modes & Manual Records

| Field           | Value              |
| --------------- | ------------------ |
| Status          | Draft              |
| Scope           | TAD                |
| Apps / packages | `apps/take-and-do` |
| Created         | 2026-08-21         |

## Problem

The Focus page only supports a **countdown timer** — users must set a duration (1–60 min) before starting. There is no **stopwatch** (count-up) mode for open-ended focus, and no way to **log a session retroactively** when focus happened outside the app but should still count toward history and analytics.

## Goals

- Offer **Stopwatch** (default) and **Timer** (existing countdown) modes on the idle session panel
- Stopwatch counts up from 0; optional target duration shown as a reference only (no auto-stop)
- Keep existing Timer UX unchanged (duration dial, countdown, pause/resume/stop, break flow)
- Let users **add manual focus records** from History when a session was missed but should appear in stats
- Manual records count in analytics totals and heatmap; show a **Manual** badge in History

## Non-goals

- Editing or deleting existing history entries (out of scope for this iteration)
- Manual records with task link or color (name + duration + datetime only)
- Changing break/backlog/session-selection flows beyond what's required for new modes
- Moving Focus to `@repo/ui` or other apps

## User stories

### Choose stopwatch or timer mode

**As a** registered user, **I want** to pick Stopwatch or Timer before starting focus, **so that** I can track open-ended work or timed sessions.

**Acceptance criteria**

- [ ] Idle panel shows a **Stopwatch | Timer** toggle; **Stopwatch is selected by default**
- [ ] Preference persists across reloads (stored in idle draft / local + server sync)
- [ ] Timer mode: existing behavior — duration required (1–60 min), countdown display, auto-complete at 0
- [ ] Stopwatch mode: Start enabled without duration; counts up elapsed time; optional duration field shown as reference (not required to start)
- [ ] Active session UI shows **elapsed** time for stopwatch, **remaining** time for timer
- [ ] Cannot switch mode while a session is running

### Stop focus with break suggestion (both modes)

**As a** user, **I want** the same stop/save/break flow after a stopwatch session, **so that** habits stay consistent.

**Acceptance criteria**

- [ ] Stop → save/discard dialog unchanged
- [ ] On save, break suggestion uses **actual elapsed seconds** when no planned duration was set (stopwatch)
- [ ] Break suggestion still uses planned duration basis when optional target was set on stopwatch

### Add a manual focus record

**As a** user, **I want** to add a past focus session from History, **so that** statistics reflect work I did without the timer.

**Acceptance criteria**

- [ ] History section has an **Add record** action (header or empty state)
- [ ] Dialog collects **name** (required), **duration** (required, 1 min – 24 h), **date & time** (required, not in the future)
- [ ] On save, record appears in History with a **Manual** badge
- [ ] Record is included in Analytics totals and heatmap (bucketed by `startedAt` local day)
- [ ] Manual records do not trigger break flow
- [ ] Guest users: same behavior via local storage (existing focus guest path)

## Functional requirements

1. **Timer mode** (`timerMode: "timer"`) — identical to current Focus idle + active UX; `validateSessionConfig` still requires `durationMinutes` 1–60.
2. **Stopwatch mode** (`timerMode: "stopwatch"`, default) — `durationMinutes` optional; if omitted, `plannedDurationSeconds` is `0` on the active timer; start requires name or linked task (same as today).
3. Optional stopwatch target: when set, show reference in idle UI (e.g. dial or label “Target: 25m”) and in active UI; do **not** auto-stop or auto-complete when target is reached.
4. Active stopwatch never auto-completes via `remainingSeconds === 0`; user must Stop explicitly.
5. **Manual record** creates a completed `FocusSession` with `source: "manual"`, `status: "completed"`, `taskId: null`, no color override (palette hash from name).
6. Manual `startedAt` = user-selected datetime (ISO); `endedAt` = `startedAt + duration`; `actualDurationSeconds` = `plannedDurationSeconds` = duration in seconds.
7. History row shows **Manual** badge when `source === "manual"`; live sessions show no badge (implicit `source: "live"`).
8. Analytics (`FocusStatsSummary`, `FocusActivityHeatmap`) include manual sessions; filter by session name works for manual entries.

## Technical requirements

### Architecture

- **Apps / packages:** `apps/take-and-do` only
- **Reuse (required):**
  - `src/components/Focus/FocusSessionPanel.tsx` — idle/active panel
  - `src/hooks/focus/useFocusSessionLifecycleActions.ts` — start/stop lifecycle
  - `src/hooks/focus/useFocusActiveTimerEffects.ts` — tick / auto-complete
  - `src/helpers/focus/focus-session.helper.ts` — validation, record builders, history helpers
  - `src/components/Focus/FocusHistory.tsx` — history list + add entry point
  - `src/db/dtos/focus.dto.ts` — Zod schemas
  - `src/types/focus.types.ts` — domain types
  - `src/hooks/focus/useFocusSessionPersistence.ts` — append session
- **New modules:**
  - `src/components/Focus/FocusManualRecordDialog.tsx` — form dialog
  - `src/helpers/focus/focus-timer-mode.helper.ts` — mode validation, stopwatch start rules, manual record builder (optional; inline in helper if small)
- **Import boundaries:** all in-app; no `@repo/api` changes

### Data layer

- **Schema changes:** none — `focus_state.sessions` is JSONB; extend session object shape in types + Zod
- **Migration:** none
- **Session shape addition** on `FocusSession`:

```typescript
type FocusTimerMode = "timer" | "stopwatch";
type FocusSessionSource = "live" | "manual";

// FocusSession fields added:
timerMode?: FocusTimerMode;   // default "timer" for legacy rows
source?: FocusSessionSource;  // default "live"
```

- **Idle draft addition** on `FocusIdleDraft`:

```typescript
timerMode: FocusTimerMode; // default "stopwatch"
```

- **Persistence:** bump stored draft version if needed; hydrate missing `timerMode` as `"stopwatch"` for new defaults, `"timer"` for legacy active timers without field

### API & contracts

- **Endpoints:** existing `GET/PATCH /api/focus` via `FocusController` — no new routes
- **DTO:** extend `FocusSessionRecordDto` focus branch with optional `timerMode` and `source` enums; Zod `.default("live")` / accept omitted for backwards compat
- **Validation:**
  - `appendSession` accepts manual records from client
  - Server does not re-validate business rules beyond DTO (client-side validation + Zod)

### Frontend

- **Routes / pages:** `src/app/focus/page.tsx` — unchanged layout
- **Components:**
  - `FocusSessionPanel` — add **Stopwatch | Timer** toggle above dial (reuse `FocusModeToggleButton` pattern)
  - `FocusIdleSessionPanel` — conditional: hide/repurpose dial for stopwatch (show elapsed-style dial at 0 or target reference); `FocusEstimationInput` optional in stopwatch
  - `FocusTimerCard` — prop `displayMode: "remaining" | "elapsed"`; stopwatch shows `formatFocusCountdown(elapsedSeconds)` counting up
  - `FocusHistory` — `Add record` button in `FocusCollapsibleSection` header actions; opens `FocusManualRecordDialog`
  - `FocusManualRecordDialog` — name `Input`, duration input (reuse `parseEstimationInput` or mm/hh helper), datetime `input type="datetime-local"`
- **State & data fetching:**
  - `configureIdleDraft({ timerMode })` persists via `useFocusSessionPersistence`
  - New action `addManualFocusRecord(payload)` on context → `appendSession` + toast
  - `startFocusSession` branch: stopwatch uses `validateStopwatchSessionConfig` (no duration required)
- **Styling:** Tailwind in component files (matches current Focus panel); no new `.styles.tsx` unless a split is needed for size

### Auth & permissions

- Registered users: server-synced via `clientServices.focus.updateState({ appendSession })`
- Anonymous/guest: local storage path in `focus-storage.ts` (existing pattern)
- Manual add requires hydrated focus context (same as starting a session)

### Error handling & edge cases

- Manual datetime in the future → constraint violation toast
- Manual duration &lt; 1 min or &gt; 24 h → constraint violation
- Empty name on manual record → constraint violation
- Switching timer mode resets optional duration only if moving timer → stopwatch (keep name/task)
- Legacy sessions without `source`/`timerMode` render as live timer sessions in History
- Stopwatch with 0 elapsed on stop → `canSaveOnStop` false (existing discard-only behavior)

### Testing

- **Unit / integration:**
  - `focus-session.helper.test.ts` (new or extend) — `validateStopwatchSessionConfig`, `buildManualFocusSessionRecord`, break duration from actual elapsed when `plannedDurationSeconds === 0`
  - `focus-history-pagination.test.ts` — manual badge label helper if extracted
  - `useFocusActiveTimerEffects` — stopwatch does not auto-complete at remaining 0
- **E2E:** none required for v1
- **Manual checks:**
  - Default mode Stopwatch on fresh load
  - Timer mode matches current behavior
  - Stopwatch count-up, pause/resume, save + break suggestion
  - Add manual record → appears in History with Manual badge, updates heatmap for selected day
  - Reload persists timer mode preference

### Deployment & ops

- **Env vars:** none
- **Scripts:** none
- **Rollout notes:** backwards compatible JSONB; old clients omit new fields; readers default `source: "live"`, `timerMode: "timer"` for records missing fields

## UX / UI

### Idle panel

```
[ Stopwatch | Timer ]     ← default Stopwatch

Stopwatch:
  - Dial at 0:00 (or shows optional target)
  - Duration input labeled "Target (optional)"
  - Start enabled with name/task only

Timer:
  - Unchanged: dial + required duration + Start
```

### Active session

- Stopwatch: large **elapsed** monospace clock (counts up)
- Timer: large **remaining** countdown (unchanged)

### History

- Header: `History` + **Add record** button (when expanded or always visible in header actions)
- Row: existing layout + small `Manual` pill/badge next to status when `source === "manual"`

### Manual record dialog

- Title: "Add focus record"
- Fields: Name, Duration (e.g. `45m`), Date & time (local)
- Actions: Cancel | Save

## Dependencies & risks

- **Auto-complete logic** in `useFocusActiveTimerEffects` assumes countdown — must skip completion when `timerMode === "stopwatch"` on active timer (add `timerMode` to `ActiveFocusTimer`)
- **Break duration** for stopwatch without target uses `actualDurationSeconds` at stop — document in `getBreakDurationSeconds` caller
- **Heatmap** buckets by `startedAt` — manual backdated entries appear on chosen day (intended)

## Open questions

- [ ] Max backdate for manual records (e.g. 1 year) — currently unrestricted except no future dates
- [ ] Should optional stopwatch target show progress ring toward target — v1 can be label-only

## Success criteria

- Stopwatch is default; users can start without setting duration
- Timer mode behavior unchanged for existing users who switch to it
- Manual records appear in History (Manual badge), Analytics totals, and heatmap
- No DB migration; existing sessions continue to display correctly

## Implementation checklist

- [ ] Extend `focus.types.ts` — `FocusTimerMode`, `FocusSessionSource`, `ActiveFocusTimer.timerMode`, `FocusIdleDraft.timerMode`, `FocusSession` fields
- [ ] Update `focus.dto.ts` Zod schemas for new optional fields
- [ ] Add `validateStopwatchSessionConfig`, `buildManualFocusSessionRecord` in `focus-session.helper.ts`
- [ ] Update `useFocusSessionLifecycleActions` — start branches for stopwatch; pass `timerMode` on active timer
- [ ] Update `useFocusActiveTimerEffects` — no auto-complete for stopwatch
- [ ] Update `FocusSessionPanel` — mode toggle, conditional idle UI, elapsed display on active card
- [ ] Add `FocusManualRecordDialog.tsx`; wire into `FocusHistory.tsx`
- [ ] Add `addManualFocusRecord` to focus context / lifecycle hooks
- [ ] Update `FocusHistory` row — Manual badge
- [ ] Persist `timerMode` in draft hydration (`focus-session-hydration.ts`, `focus-storage.ts`)
- [ ] Unit tests for new helpers and stopwatch completion guard
- [ ] Manual QA on `/focus` — both modes, manual record, analytics
