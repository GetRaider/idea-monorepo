# Tempo UX interaction redesign

| Field           | Value                                      |
| --------------- | ------------------------------------------ |
| Status          | Draft                                      |
| Scope           | TMP                                        |
| Apps / packages | `apps/tempo`                               |
| Created         | 2026-09-04                                 |
| Mocks           | [`mocks/v1`](./mocks/v1) (dial + glow) · [`mocks/v2`](./mocks/v2) (target) |

Companion: visual/layout/a11y/styling is [`ui-visual-redesign.md`](./ui-visual-redesign.md). **v2 mocks are the visual target.** Break offer modal and dual-record rules stay in [`break-timer-on-pause.md`](./break-timer-on-pause.md) — this PRD only fixes how those states are presented and which controls exist.

## Problem

Focus is one layout for idle setup, running, paused, and break. Users get three start paths, a red “error” for paused work, two adjacent Stop actions during rest, and a silent Resume no-op. History and Analytics use different filters. Analytics totals mix focus and break, so “I worked X” is a lie.

## Goals

- Focus is a **state machine**: idle, focus running, focus paused, paused+break, break-only. Each state shows only the controls that apply.
- **One primary Start**: Regular Session cards select; composer Start launches. No play control on cards.
- Rest layout matches the break PRD: primary break clock, paused-focus chip (not an error), **one** destructive action, Resume disabled **with copy**.
- Analytics **Focus time** is primary; **Break time** is secondary; Daily Average / session stats are **focus-only**.
- History and Analytics share the same period + Regular Session filter model.
- User-facing term stays **Regular Session** (not “Activity” / “backlog”).

## Non-goals

- Multiple simultaneous focus timers.
- Changing break offer-on-pause/complete (keep modal per break PRD).
- Pomodoro auto-loops or auto-resume after break.
- Renaming Regular Sessions to “Activity” (analytics PRD language stays internal).
- Visual redesign, Tailwind/Radix migration, dial chrome — those are the UI PRD.
- New IPC/schema beyond what the break PRD already adds (`recordRole` assumed present).

## User stories

### Focus stages by session state

**As a** focus user, **I want** the screen to match whether I am setting up, running, paused, or on a break, **so that** I am not editing a form while a clock is ticking.

**Acceptance criteria**

- [ ] Idle shows composer (mode, name, optional scope, duration/goal, save-as-regular) + Regular Sessions + one primary Start.
- [ ] Focus running shows session identity + clock + Pause + Stop. Composer fields and Regular Sessions are hidden (or Regular Sessions collapsed and non-interactive).
- [ ] Focus paused (no break) shows frozen clock + Resume + Stop. No Regular Session Starts.
- [ ] Paused + break running shows break remaining as the only ticking clock, a paused-focus chip (`{name} paused · {hms}`), **Stop break** only, and Resume disabled with “Finish break to resume”.
- [ ] Break-only (post-complete or manual) shows Break identity + countdown + Stop break. No focus Stop.
- [ ] Focus Stop is not shown while a break record is active.

### Select then start Regular Sessions

**As a** focus user, **I want** clicking a Regular Session to prepare the composer, **so that** duration/mode apply and I do not have two competing Starts.

**Acceptance criteria**

- [ ] Clicking the card (name / body) selects it: fills name, highlights the card, hides “Save as Regular”.
- [ ] Clicking a selected card again deselects (clears `selectedSessionId`, name stays editable).
- [ ] Primary Start in the composer starts the selected session (or ad-hoc name when none selected).
- [ ] Selecting the default **Break** Regular Session: Mode toggle is hidden or inert; Start calls `startBreak` with planned seconds from the duration field (default `settings.breakDurationMinutes`).
- [ ] Selecting any other Regular Session: Start uses current mode + duration/goal from the composer (`handleStart` today).

### Understand rest vs work

**As a** focus user, **I want** break time kept out of “how much I worked”, **so that** Analytics stays trustworthy.

**Acceptance criteria**

- [ ] Analytics stat **Focus Time** (emphasized) = completed `recordRole === 'focus'` seconds in the filtered dataset.
- [ ] Analytics stat **Break Time** = completed `recordRole === 'break'` seconds in the same filters.
- [ ] **Sessions**, **Daily Average**, **Avg. Session**, **Longest Session**, **Active Days** use **focus records only**. Daily Average = focus seconds / `calendarDayCount`.
- [ ] Time by Day buckets sum **focus** seconds only.
- [ ] Time by Activity includes Break as a row when break records exist in the dataset (Break is an activity, not hidden).
- [ ] History rows for `recordRole === 'break'` show a **Break** badge. Timer/Stopwatch badges are removed from the default row.

### Same filters on History and Analytics

**As a** user reviewing time, **I want** Today / Week / Month / Custom plus Regular Session filter on both screens, **so that** I do not relearn the range control.

**Acceptance criteria**

- [ ] History replaces `datetime-local` From/To with the same period presets as Analytics (`today` | `week` | `month` | `custom`).
- [ ] Custom range uses date inputs (`YYYY-MM-DD`), reusing `resolveAnalyticsPeriod` / `parseDateInputValue`.
- [ ] Both screens have a Regular Session `<select>` (“All sessions”).
- [ ] History groups completed records by local calendar day (newest day first); each group has a heading + rows.
- [ ] Empty copy: no records at all vs no records in this range (already exists; keep).

### Clear copy when actions are blocked

**As a** user, **I want** to know why Start or Resume is unavailable, **so that** the UI does not feel broken.

**Acceptance criteria**

- [ ] Idle Start disabled when `name.trim()` is empty: helper text “Enter a session name to start”.
- [ ] Resume during break: control visible, `disabled`, text or adjacent hint “Finish break to resume”.
- [ ] Clock captions (not unit words): idle timer “Ready”; running timer “Remaining”; stopwatch “Elapsed”; goal hit “Goal reached”; break “Break remaining” / “Break paused”.
- [ ] Menu-bar tooltip: `{name} · {clock}` (break preferred when active), not name-only.

### Settings match the session model

**As a** user, **I want** confirm-on-stop and break duration with the other session defaults, **so that** Window settings are only window chrome.

**Acceptance criteria**

- [ ] **Confirm before saving or discarding** moves out of Window into Defaults (or a Session group).
- [ ] Default break duration is 1–60 minutes (same bounds as focus timer), not a 5–30-only select.
- [ ] Import shows a confirm step before overwriting local data (“Import replaces sessions and records on this Mac”).
- [ ] Offer-break toggle and pause/complete modal behavior unchanged (break PRD).

## Functional requirements

1. Derive a single `FocusViewState` discriminant from `activeFocusRecord` / `activeBreakRecord` (`idle` | `focusRunning` | `focusPaused` | `focusPausedBreakRunning` | `breakOnly`). Render only that state’s controls.
2. While `activeBreakRecord !== null`, do not render focus **Stop**. **Stop break** is the only destructive session action.
3. `handleResume` remains a no-op when break is running; the Resume control must be visible and disabled with the hint above (no silent omit).
4. Paused focus status is not an error: never use `ErrorText` / danger color for “{name} paused”.
5. Regular Session card click = `onSelect` only. No play control on the card.
6. Composer Start: if selected session is the default Break session (`isDefaultBreakSessionName`), call `startBreak`; else `start` as today.
7. `buildAnalyticsMetrics` (or a wrapper) computes work metrics from focus records only; expose `breakSeconds` separately. Do not change period math.
8. History listing uses `resolveAnalyticsPeriod` + session id filter (`filterRecordsByBacklogSession`) + day groups from `startedAt` local date.
9. History `HistoryEntry` includes `recordRole` (or equivalent) for the Break badge.
10. Tray tooltip includes formatted clock via existing `formatMenuBarClock` plus record name.
11. No new timer modes. Break remains countdown-only.

## Technical requirements

### Architecture

- **Apps / packages:** `apps/tempo` only. No `@repo/*` API changes.
- **Reuse (required):**
  - `App.tsx` handlers (`handleStart`, `handlePlayBacklog`, `handlePause`, `handleResume`, `requestStop`, `requestBreakStop`)
  - `isDefaultBreakSessionName` in `apps/tempo/src/helpers/break.helper.ts`
  - `resolveAnalyticsPeriod`, `parseDateInputValue`, `getAnalyticsDataset`, `buildAnalyticsMetrics`, `buildTimeByDay`, `buildTimeByActivity` in `analytics.helper.ts`
  - `filterRecordsByBacklogSession`, `buildHistoryEntries`, `buildActivityFilterOptions` in `history.helper.ts`
  - `formatMenuBarClock` / `formatHmsClock` / `formatTimerClock` in `elapsed.helper.ts`
  - Break offer / Stop dialogs — behavior unchanged
- **New modules:**
  - `apps/tempo/src/helpers/focus-view.helper.ts` — `resolveFocusViewState(focus, break)` + tests
  - `apps/tempo/src/renderer/src/focus/FocusIdleView.tsx` — composer + Regular Sessions
  - `apps/tempo/src/renderer/src/focus/FocusActiveView.tsx` — running / paused / break layouts (branch on `FocusViewState`)
  - `apps/tempo/src/helpers/history.helper.ts` — `buildHistoryDayGroups(entries)` (or records)
  - Shared filter bar used by History + Analytics: `apps/tempo/src/renderer/src/components/PeriodFilter.tsx` (behavior here; styling in UI PRD)
- **Import boundaries:** stay in `apps/tempo`.

### Data layer

- **Schema / migration:** none (uses `recordRole` from break PRD).
- **Queries:** none new. Renderer already has `getActiveState` + `listRecords`.

### API & contracts

- **IPC:** none new.
- **Shared types:** add `FocusViewState` next to renderer/helpers (not necessarily in `records.types.ts`).
- **AnalyticsMetrics:** extend with `focusSeconds`, `breakSeconds`; `totalSeconds` becomes **focusSeconds** (keep field for callers or alias — do not leave `totalSeconds` as focus+break).
- **HistoryEntry:** add `recordRole: RecordRole`.
- **Validation:** break duration settings 1–60 via existing `parseDurationMinutes` / timer bounds.

### Frontend

- **Routes:** still in-app screens (`AppScreen`). Add Focus `<h1>` (“Focus”) for parity with other screens.
- **App.tsx:** keep data/effects; stop inlining all Focus JSX. Switch on `resolveFocusViewState`.
- **BacklogPicker:** `onSelect` on card body. Drop `onPlay` from the card UI. `disabled={!isIdle}` when a session is running.
- **SettingsSection:** regroup confirm-on-stop; break duration input 1–60; Import confirm (window `confirm` is acceptable; Radix dialog if UI PRD lands first).
- **status-tray.ts:** `setToolTip` = name + clock (or “Tempo” when idle).
- **State:** no new persisted settings except using existing `breakDurationMinutes` for Break composer default when that card is selected (`setDurationMinutes(settings.breakDurationMinutes)`).
- **Styling:** do not restyle in this PRD; use existing primitives. UI PRD owns Tailwind.

### Auth & permissions

N/A — local single-user Electron app.

### Error handling & edge cases

| Case | Behavior |
|---|---|
| Empty name, idle | Start disabled + helper text |
| Break selected + Start | `startBreak`; ignore focus mode toggle |
| Click Regular Session while not idle | Cards non-interactive (today) |
| Break running + user hits Resume | Disabled; hint visible; `handleResume` still guards |
| Break running + user tries focus Stop | Control not rendered |
| Analytics filter = Break session | Focus Time 0; Break Time = that session’s breaks; Time by Activity can be a single Break row |
| Custom range invalid | Period null; same empty copy as Analytics today |
| Import cancel | No-op; no refresh |

### Testing

- **Unit:** `resolveFocusViewState` — all five states + null/null = idle; running focus + break must not be a valid combo (if both running, treat as `focusPausedBreakRunning` only when focus is paused — assert helper assumes repository invariant).
- **Unit:** `buildAnalyticsMetrics` / new split — mixed focus+break dataset: daily average ignores break seconds; `breakSeconds` isolated.
- **Unit:** `buildHistoryEntries` includes `recordRole`; `buildHistoryDayGroups` orders days desc, rows desc within day.
- **Unit:** existing `analytics.helper.test.ts` / `history.helper.test.ts` updated for new shapes.
- **E2E:** none.
- **Manual:** idle select → Start; Break select → Start is countdown; pause → offer modal (unchanged) → rest layout; Resume disabled with hint; Analytics week with a saved break; History day groups + Break badge; Import cancel.

### Deployment & ops

- **Env vars / scripts:** none.
- **Rollout:** renderer + helper only; backwards compatible with existing SQLite.

## UX / UI

State sketches (structure only; visual spec is the UI PRD):

**Idle**

```
Focus
[ Stopwatch | Timer ]
name · + scope · duration/goal · Save as Regular
[ Start ]
REGULAR SESSIONS  (select cards; no play)
```

**Focus running / paused**

```
{session name} · {mode}
{clock}  {caption}
[ Pause | Resume ]  [ Stop ]
```

**Paused + break**

```
Break
{remaining}  Break remaining
[ Stop break ]
{focus name} paused · {elapsed}
Resume disabled — Finish break to resume
```

**Break only**

```
Break
{remaining}
[ Stop break ]
```

Clock **surface:** `ClockDisplay` in every Focus state (UI PRD: no analog dial).

## Dependencies & risks

- **Depends on** break PRD data/IPC (`recordRole`, `getActiveState`, break start/stop). If break is mid-flight, land rest-layout controls on the same branch.
- **`App.tsx` size** — extract views or the state machine will stay bolted on. Mitigation: `focus-view.helper` + two view components.
- **Analytics PRD “Activity”** — do not rename shipped UI; filter label is “Regular Session” / “All sessions”.
- **Select-only cards** — if users miss one-click play, add it later; v2 does not.

## Open questions

- [ ] None blocking. Split `offerBreakTimer` pause vs complete remains on the break PRD.

## Success criteria

- A running or break session never shows the idle composer or Regular Session Starts.
- Selecting a card does not start a session; composer Start does.
- Break + paused focus: one ticking clock, one Stop, Resume explained.
- Analytics Daily Average does not increase when a break is saved.
- History and Analytics share period presets + session filter.
- Pause/complete still open the break-offer modal when the setting is on.

## Implementation checklist

- [ ] Add `resolveFocusViewState` + unit tests
- [ ] Split Focus JSX into idle vs active views; add Focus `h1`
- [ ] Rest layout: paused chip, hide focus Stop during break, Resume disabled + hint
- [ ] BacklogPicker: select on card only; Break → `startBreak` from composer Start
- [ ] Extend `AnalyticsMetrics` + tests; update `AnalyticsSection` stats
- [ ] History: `recordRole` badge, drop mode badge, period + session filter, day groups
- [ ] Extract `PeriodFilter` shared by History + Analytics
- [ ] Settings: move confirm-on-stop; break duration 1–60; Import confirm
- [ ] Tray tooltip name + clock
- [ ] Start disabled helper copy; `ClockDisplay` in all Focus states
- [ ] `pnpm --filter tempo test` + manual QA list above
