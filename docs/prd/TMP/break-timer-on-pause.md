# Break timer on pause / complete

| Field           | Value                                      |
| --------------- | ------------------------------------------ |
| Status          | Draft                                      |
| Scope           | TMP                                        |
| Apps / packages | `apps/tempo`                               |
| Created         | 2026-09-03                                 |

## Problem

Tempo enforces exactly one active session at a time. When a user pauses focus work or finishes a session, there is no lightweight way to track intentional break time without starting a new focus session and losing the paused context.

Users want to step away briefly while keeping their paused focus session intact, and have break time recorded under a dedicated **Break** Regular Session for analytics — without turning Tempo into a full Pomodoro or multi-focus product.

## Goals

- Preserve the **single active focus session** invariant for normal focus work.
- Offer an optional **Break countdown timer** when the user pauses or completes a focus session (settings-gated, default on) — **independent of focus mode** (works when focus is **Timer** or **Stopwatch**).
- Allow a **second concurrent active record** only for Break while a focus session remains paused.
- Record break time against a default **Break** Regular Session (`SavedSession`, backlog-linked) via an explicit **Save / Discard** flow — same as focus stop (no silent auto-save).
- Allow starting Break manually from Regular Sessions when idle (same UX as any backlog session).
- Default break duration: **10 minutes**, adjustable before starting.
- **Migrate** existing history from a **Rest** Regular Session into the default **Break** Regular Session on upgrade (one-time, idempotent).

## Non-goals

- Multiple simultaneous focus sessions.
- Full Pomodoro cycles (auto focus → break → focus loops).
- Auto-resuming focus when break ends.
- Break-specific analytics beyond existing Activity / Regular Session filtering.
- **Break in stopwatch mode** — break is always a countdown timer (`mode: 'timer'`); no open-ended break stopwatch.
- Bulk renaming or merging of user Regular Sessions **other than** the legacy **Rest** → **Break** migration below.

## User stories

### Offer break on pause

**As a** focus user, **I want** to be prompted to start a break timer when I pause, **so that** I can track rest without abandoning my paused session.

**Acceptance criteria**

- [ ] When `offerBreakTimer` is enabled and the user clicks **Pause**, the focus session pauses as today, then a break-offer dialog appears — **whether focus mode is Timer or Stopwatch**.
- [ ] Dialog copy uses **Break** (not Rest).
- [ ] Dialog shows a duration control defaulting to 10 minutes (1–60, same bounds as focus timer).
- [ ] **Start break** starts a concurrent break countdown linked to the default Break Regular Session.
- [ ] **Not now** leaves the focus session paused with no break record.
- [ ] While break runs, the paused focus session remains active (`endedAt === null`, `segmentStartedAt === null`).
- [ ] When the break countdown completes, the app pauses the break and shows **Stop break?** with **Save** / **Discard** (respects `confirmOnStop`; when off, auto-saves if elapsed > 0).
- [ ] After break is saved or discarded, focus stays paused until the user clicks **Resume** (dual-timer case).

### Offer break on session complete

**As a** focus user, **I want** to be prompted to take a break after I save a completed session, **so that** I can transition into rest without manually starting Break from the backlog.

**Acceptance criteria**

- [ ] When `offerBreakTimer` is enabled and the user saves a stopped session (via Stop dialog or auto-save path), a break-offer dialog appears after save succeeds — **regardless of whether the completed session was Timer or Stopwatch**.
- [ ] **Start break** starts a standalone break countdown (no paused focus record exists).
- [ ] **Not now** returns to idle focus screen.
- [ ] Ending break (manual stop or countdown complete) shows Save / Discard; saved break appears under the default Break Regular Session in History.

### Manual Break from Regular Sessions

**As a** focus user, **I want** to start Break from Regular Sessions when idle, **so that** I can track break time outside pause/complete prompts.

**Acceptance criteria**

- [ ] A default **Break** Regular Session exists (created on first need if missing).
- [ ] Playing Break from backlog while idle starts a normal single active break/focus record (same as any backlog session).
- [ ] Playing Break from backlog while a focus session is active or paused is blocked in the UI (same as other backlog sessions today).
- [ ] Break backlog play uses countdown mode with the configured default break duration.

### Settings control

**As a** focus user, **I want** to disable break prompts, **so that** pause/complete stay frictionless when I do not want break tracking.

**Acceptance criteria**

- [ ] Settings includes **Offer break timer** toggle (default on).
- [ ] When off, pause and complete behave exactly as today (no dialog).
- [ ] Settings includes **Default break duration** (minutes, default 10, range 1–60).

### Save or discard break time

**As a** focus user, **I want** to save or discard break time when I stop the break timer, **so that** only intentional break time is recorded.

**Acceptance criteria**

- [ ] **Stop break** (manual) pauses the break, then shows a dialog: **Stop break?** — "Save keeps this break in history. Discard removes it."
- [ ] **Save** persists the break record (partial elapsed allowed if stopped early; capped at `plannedSeconds` on countdown complete).
- [ ] **Discard** deletes the active break record without history entry.
- [ ] If elapsed is 0, only **Discard** is offered (same as focus `StopDialog`).
- [ ] Countdown auto-complete uses the same save/discard flow (not silent save).
- [ ] Reuses existing **`confirmOnStop`** setting: when false, auto-save on stop/complete if elapsed > 0, else discard.
- [ ] After break is saved or discarded, UI returns to paused-focus (if focus still active) or idle.

### Migrate legacy Rest history to Break

**As an** existing Tempo user who tracked rest under a **Rest** Regular Session, **I want** that history moved to **Break** when the feature ships, **so that** analytics and History stay continuous under the new default name.

**Acceptance criteria**

- [ ] On first launch after upgrade, a one-time DB migration runs (idempotent).
- [ ] If a Regular Session named **Rest** exists (case-insensitive match) and **Break** does not: rename **Rest** → **Break** (keep same `session.id`, color, and linked records).
- [ ] If both **Rest** and **Break** exist: reassign all completed and active records with `session_id = rest.id` to `break.id`; update record `name` to **Break**; delete the empty **Rest** session row.
- [ ] Migrated backlog records get `record_role = 'break'` (completed and active).
- [ ] Total tracked time under **Break** in Analytics equals prior **Rest** total plus any pre-existing **Break** records.
- [ ] Migration does not duplicate records — **move/reassign only**, not copy.
- [ ] If no **Rest** session exists, migration is a no-op.

## Functional requirements

1. Focus sessions: at most **one** active focus record (`recordRole = 'focus'`, `endedAt IS NULL`).
2. Break sessions: at most **one** active break record (`recordRole = 'break'`, `endedAt IS NULL`).
3. Allowed concurrent state: **one paused focus + one running break**; no other combinations.
4. Starting a new focus session is blocked while any focus record is active (running or paused), unchanged from today.
5. Break records always use `mode: 'timer'` (countdown only — never stopwatch), `source: 'live'`, `kind: 'backlog'`, linked to the Break `SavedSession`.
6. Break offer on pause/complete is **independent of focus `TimerMode`**: focus may be `timer` or `stopwatch`; break always starts as countdown with `plannedSeconds` from offer dialog or default setting.
7. Break countdown auto-completes at `plannedSeconds`; elapsed is capped at planned on save (reuse `buildStoppedRecord` timer cap logic).
8. Break end (manual **Stop break** or countdown complete) follows the same save/discard pattern as focus stop — mirror `requestStop` / `StopDialog` / `confirmOnStop` behavior.
9. Break end plays the existing end sound when `soundEnabled` is true (on countdown complete, before save/discard prompt).
10. Menu bar clock shows the **running break** timer when a break is active; otherwise unchanged (paused/running focus).
11. UI labels and dialogs use **Break** consistently.
12. One-time **Rest → Break** migration runs at DB init after schema migration; safe to run on every startup (no-op when **Rest** absent).

## Technical requirements

### Architecture

- **Apps / packages:** `apps/tempo` only.
- **Reuse (required):**
  - `FocusRecord` lifecycle builders in `apps/tempo/src/helpers/session.helper.ts`
  - Elapsed / auto-stop in `apps/tempo/src/helpers/elapsed.helper.ts`
  - `SavedSession` CRUD in `apps/tempo/src/main/sessions.repository.ts`
  - IPC pattern in `apps/tempo/src/main/ipc.ts`, `apps/tempo/src/preload/index.ts`
  - Dialog patterns: `StopDialog.tsx` (reuse for break stop with break-specific title/copy), `SavedSessionDialog.tsx`
  - Focus stop flow in `App.tsx`: `requestStop`, `handleSaveStop`, `handleDiscardStop`, `freezeRunningSession`
  - Settings merge in `apps/tempo/src/helpers/settings.helper.ts`
- **New modules:**
  - `apps/tempo/src/renderer/src/components/BreakOfferDialog.tsx` — duration + Start break / Not now
  - `apps/tempo/src/helpers/break.helper.ts` — resolve/create default Break SavedSession, build break start input, active-session guards, **`migrateRestSessionToBreak()`**
  - Extend `records.repository.ts` with role-aware queries and break start/stop paths
- **Import boundaries:** all logic stays in `apps/tempo`; no `@repo/*` changes.

### Data layer

- **Schema changes:** add column to `records`:
  - `record_role TEXT NOT NULL DEFAULT 'focus' CHECK (record_role IN ('focus', 'break'))`
- **Migration:** extend `migrateRecordsTable()` in `apps/tempo/src/main/db.ts` — add column if missing; backfill existing rows to `'focus'`. Then call `migrateRestSessionToBreak()` from `initDatabase()` (after table migrations, before returning).
- **Rest → Break data migration** (`migrateRestSessionToBreak()` in `break.helper.ts`, invoked from `sessions.repository.ts` or `db.ts`):
  - Lookup: `getSavedSessionByName('Rest')` and `getSavedSessionByName('Break')` — **case-insensitive** (reuse existing name lookup).
  - **Rest only:** `UPDATE sessions SET name = 'Break' WHERE id = ?`; then `UPDATE records SET name = 'Break', record_role = 'break' WHERE session_id = ?`.
  - **Rest + Break:** `UPDATE records SET session_id = ?, name = 'Break', record_role = 'break' WHERE session_id = ?` (break id, rest id); `DELETE FROM sessions WHERE id = ?` (rest id). Skip delete if rest is active-linked and break merge would violate uniqueness — in practice merge first, then delete rest row.
  - **Break only / neither:** no-op (Break lazy-created on first break start as today).
  - Idempotent: after success, no session named **Rest** remains; re-running finds nothing to do.
- **Seed:** lazy-create `SavedSession` named **Break** (deterministic color via `pickDefaultSessionColor('Break')`) on first break start if no session with that exact name exists. Migration may create **Break** earlier via rename; do not create a duplicate.
- **Queries / persistence:**
  - Replace `getActiveRecord()` usage for focus paths with `getActiveFocusRecord()` (`ended_at IS NULL AND record_role = 'focus' LIMIT 1`).
  - Add `getActiveBreakRecord()` (`ended_at IS NULL AND record_role = 'break' LIMIT 1`).
  - Add `getActiveSessionState()` returning `{ focus, break }` for renderer refresh (single IPC call preferred).
  - `startBreakSession(plannedSeconds)` — validates: no active break; if active focus exists it must be paused (`segmentStartedAt === null`); inserts break record with `mode: 'timer'` **regardless of active focus mode**.
  - `pauseBreakSession()` — fold break segment (same as focus pause, scoped to break record).
  - `stopBreakSession()` — finalize break record (`buildStoppedRecord` on break row).
  - `discardBreakSession()` — delete active break record.
  - `pauseSession` / `resumeSession` — operate only on active **focus** record (unchanged semantics).

### API & contracts

- **IPC additions** (extend `TempoApi` in `apps/tempo/src/shared/tempo-api.types.ts`):

| Channel | Request | Response | Notes |
|---------|---------|----------|-------|
| `records:getActiveState` | — | `{ focus: FocusRecord \| null; break: FocusRecord \| null }` | replaces single `getActive` for renderer (keep `getActive` as focus-only alias or deprecate internally) |
| `records:startBreak` | `{ plannedSeconds: number }` | `FocusRecord` | starts break countdown |
| `records:pauseBreak` | — | `FocusRecord` | pause running break before save/discard dialog |
| `records:stopBreak` | — | `FocusRecord \| null` | save break to history |
| `records:discardBreak` | — | `void` | discard active break without saving |

- **Shared types:** extend `FocusRecord` with `recordRole: 'focus' | 'break'` in `apps/tempo/src/shared/records.types.ts`.
- **Validation:** `plannedSeconds` for break uses existing `TIMER_MIN_PLANNED_SECONDS` / `TIMER_MAX_PLANNED_SECONDS` (1–60 minutes).

### Frontend

- **Routes / pages:** no new screens; extend Focus view in `apps/tempo/src/renderer/src/App.tsx`.
- **Components:**
  - `BreakOfferDialog` — triggered after successful pause or save-stop when `offerBreakTimer` is on; **not gated on focus `TimerMode`** (`ModeToggle` selection).
  - Reuse or extend `StopDialog` for break end — props: `title="Stop break?"`, break-specific body copy; wired via `requestBreakStop(elapsedSeconds, confirmOnStop)`.
  - Active UI states in `App.tsx`:
    - `focusPausedBreakRunning` — show paused focus summary (name, elapsed) + prominent break countdown + **Stop break** → save/discard dialog.
    - `breakOnlyRunning` — post-complete or manual idle break; reuse countdown display; **Stop break** → same save/discard dialog.
  - Separate auto-stop effect for break record (mirror focus timer auto-stop → pause → save/discard).
  - `BacklogPicker` — ensure default Break session appears once created; play disabled when not idle (unchanged guard uses focus-only idle check).
- **State & data fetching:** `refreshState()` loads `getActiveState`; derive:
  - `isIdle` → no active focus AND no active break
  - `isFocusPausedWithBreak` → focus paused + break running
  - Auto-stop effect watches **break** record separately from focus auto-stop.
- **Styling:** Tailwind + existing `@/components/ui` patterns; break card visually distinct (e.g. muted panel + break label) but no new design system.

### Auth & permissions

N/A — local single-user Electron app.

### Error handling & edge cases

| Case | Behavior |
|------|----------|
| User pauses, declines break | Focus stays paused; no break record |
| User pauses, starts break, break completes | End sound → Stop break? dialog → Save or Discard; focus still paused |
| User clicks Stop break early | Pause break → Stop break? dialog → Save (partial elapsed) or Discard |
| User resumes focus while break running | Block resume until break is saved/discarded (break must not be running) |
| User stops focus while break running | Not reachable — focus must be paused before break starts in dual mode |
| App quit with paused focus + no break | Persist as today |
| App quit with active break | Break survives restart; renderer restores break countdown |
| `offerBreakTimer` off | No dialog; no break IPC from pause/complete |
| User deletes Break Regular Session while idle | Next break start recreates **Break** session |
| User renames Break Regular Session | Records keep `sessionId`; new default created only if name **Break** missing |
| Legacy **Rest** session with history | One-time migration moves records to **Break**; **Rest** row removed or renamed |
| **Rest** and **Break** both have records | All **Rest** records reassigned to **Break**; **Rest** session deleted |
| Focus in **Stopwatch** mode, user pauses | Break offer shown same as Timer mode; break still countdown |
| Focus in **Stopwatch** with optional goal | Break offer on pause/complete unchanged; goal notification unrelated to break |
| User expects break stopwatch | Not supported — break always countdown; focus mode toggle does not apply to break |

### Testing

- **Unit / integration** (`apps/tempo/src/helpers/`, repository tests):
  - `validateStartSession` / new `validateStartBreak` — rejects break when focus running; allows when focus paused or absent.
  - Concurrent state: paused focus + active break inserts succeed; second break fails.
  - Break auto-stop caps elapsed at `plannedSeconds`.
  - Default Break SavedSession lazy-create idempotent.
  - Migration sets `record_role = 'focus'` on existing rows (except Rest-linked rows updated to `'break'` by Rest migration).
  - **`migrateRestSessionToBreak`:** Rest-only → rename session + re-point record names/roles; Rest+Break → merge records, delete Rest; no Rest → no-op; idempotent second run.
- **E2E:** none for v1.
- **Manual checks:**
  1. Pause with setting on (focus **Timer**) → break offer → works as today.
  2. Pause with setting on (focus **Stopwatch**) → break offer → countdown break works; focus stays paused.
  3. Complete **Stopwatch** session → break offer → Save/Discard break works.
  4. Stop break early → Save with partial time → History; Discard → no History row.
  5. Setting off → pause/complete unchanged in both focus modes.
  6. Play Break from backlog when idle → Stop break → Save/Discard.
  7. Menu bar shows break remaining during break.
  8. Restart app mid-break → break restores; stop still offers Save/Discard.
  9. DB with **Rest** session + 3 history records → after upgrade, Analytics/History show under **Break** only; total seconds unchanged.
  10. DB with both **Rest** and **Break** → all **Rest** records under **Break**; **Rest** session gone.

### Deployment & ops

- **Env vars:** none.
- **Scripts / commands:** none beyond normal Tempo dev/build.
- **Rollout notes:** SQLite migration is additive; backwards compatible. Existing users get `record_role = 'focus'` on all historical records except legacy **Rest** backlog rows (migrated to `'break'`). **Rest** Regular Session is consolidated into **Break** automatically.

## UX / UI

### Break offer dialog (pause & complete)

```
Take a break?
[ 10 ] min   (duration input, 1–60)

[ Not now ]  [ Start break ]
```

- Appears **after** pause succeeds or **after** stop-save succeeds — for focus sessions in **Timer** or **Stopwatch** mode.
- Modal; dismiss via Not now or backdrop (same as Not now).
- Break duration is always countdown; focus **ModeToggle** does not affect break behavior.

### Focus screen — paused focus + running break

- Primary clock: **break remaining** (countdown).
- Secondary strip: paused focus session name + elapsed so far.
- Controls: **Stop break** → save/discard dialog; **Resume** disabled while break is running.
- Copy: "Break" label on countdown area.

### Stop break dialog (manual stop & countdown complete)

```
Stop break?

Save keeps this break in history. Discard removes it.

[ Discard ]  [ Save ]
```

- Same layout and behavior as focus `StopDialog`; `canSave` false when elapsed is 0.
- Shown after **Stop break** click or when countdown reaches zero (after end sound).

### Focus screen — break only (post-complete or manual)

- Standard countdown UI; session name **Break** from backlog.
- **Stop break** opens save/discard dialog (does not re-trigger break-offer).

### Settings (`SettingsSection.tsx`)

- Toggle: **Offer break timer** (default on) — controls both pause and complete prompts.
- Number/select: **Default break duration** — 10 minutes default.

## Dependencies & risks

- **Dual active records** touches repository, IPC, renderer, and menu bar — regression risk on single-focus paths. Mitigation: role-specific helpers; keep focus pause/resume/stop code paths on focus record only.
- **`getActiveRecord()` widely assumed singleton** — audit all call sites (`status-tray.ts`, `App.tsx`, tests). Mitigation: rename to `getActiveFocusRecord()` and add explicit break queries.
- **Resume blocked during break** may feel restrictive — intentional for v1 to avoid two running clocks; document in UI if user tries Resume (tooltip or inline hint).
- **Break Regular Session name collision** — user may already have a session named "Break" for another purpose. Mitigation: reuse existing session by exact name match on create.

## Open questions

- [ ] Split `offerBreakTimer` into separate pause vs complete toggles later if users ask?
- [ ] Separate `confirmOnStopBreak` setting later, or always reuse `confirmOnStop`? (PRD assumes reuse.)

## Success criteria

- Pausing or completing a focus session offers break when setting enabled — **both Timer and Stopwatch focus modes**.
- Accepting break on pause starts concurrent countdown without clearing paused focus.
- Accepting break on complete starts standalone countdown break.
- Break is always countdown; focus mode toggle does not change break timer type.
- Break time appears in History and Analytics under the **Break** Regular Session only when the user chooses **Save**.
- Discarded breaks leave no history entry.
- Legacy **Rest** history appears under **Break** after upgrade with no duplicate rows and unchanged durations.
- With setting disabled, behavior matches current Tempo exactly.
- No regression: only one focus session can be active; user cannot start a second focus session while one is paused.

## Implementation checklist

- [ ] Add `recordRole` to types + DB migration in `db.ts`
- [ ] Implement `migrateRestSessionToBreak()` + call from `initDatabase()`
- [ ] Refactor `records.repository.ts` — focus/break queries, `startBreakSession`, `pauseBreakSession`, `stopBreakSession`, `discardBreakSession`, `getActiveSessionState`
- [ ] Add break validation/builders in `break.helper.ts` + tests
- [ ] Lazy-create default Break `SavedSession` in `break.helper.ts` or `sessions.repository.ts`
- [ ] Extend IPC + preload + `TempoApi`
- [ ] Add `breakDurationMinutes` and `offerBreakTimer` to settings types/helper/defaults
- [ ] Build `BreakOfferDialog.tsx`
- [ ] Wire pause/complete flows in `App.tsx`; dual-timer UI state; `requestBreakStop` + break save/discard handlers (reuse `StopDialog`)
- [ ] Update `status-tray.ts` to prefer break clock when break active
- [ ] Update `assertSavedSessionNotInUse` to consider active break linked session
- [ ] Unit tests for repository + helpers
- [ ] Manual QA per test plan above
