# Tray actions and hidden-window alerts

| Field           | Value |
| --------------- | ----- |
| Status          | Draft |
| Scope           | TMP |
| Apps / packages | `apps/tempo` |
| Created         | 2026-09-11 |
| Companion       | [`focus-composer-ux.md`](./focus-composer-ux.md) (picker, duration, zoom, logo, dictation) |
| Supersedes      | Tray menu **Show + Quit only** in [`tempo-v2-focus-shell.md`](./tempo-v2-focus-shell.md) (tooltip FR 11 stays). Does **not** change break-offer timing. |

## Problem

Timer end and stopwatch-goal chimes are **Web Audio in the renderer**, driven by `setInterval(250)` in `App.tsx`. When the laptop lid/display sleeps or Chromium throttles a background window, the tick stalls — auto-stop is late and **there is no sound**. The menu bar already ticks every 1s in **main** (`status-tray.ts`) but the context menu is only **Show Tempo** / **Quit**. Pause/Stop exist as IPC and are unused from the tray. Renderer never subscribes to session mutations from main, so tray-driven Pause/Stop would desync the UI.

## Goals

- Timer/break auto-stop and stopwatch-goal **evaluated in main** (same 1s tray loop or shared ticker).
- **Visible window:** existing Web Audio (`playTimerEndedSound` / `playGoalReachedSound`).
- **Hidden / minimized / occluded:** macOS (and Electron) **Notification** with system sound; skip renderer oscillators.
- Tray submenu: **Pause / Resume / Stop & save / Discard**, plus Show / Quit.
- Renderer refreshes when main mutates records (`session:changed`).

## Non-goals

- Playing audio through **full system sleep** (impossible without keeping the machine awake). `powerSaveBlocker` is **out**.
- Replacing Web Audio when the window **is** visible.
- Composer UX (companion PRD).
- Changing `confirmOnStop` for in-window Stop (tray **bypasses** it).
- Menu-bar glyph redesign.
- Windows-only toast work beyond Electron `Notification` (best-effort if someone runs non-mac).

## User stories

### Hear the chime when Tempo is in the background

**As a** user with the window closed or the lid down but the Mac still running (clamshell / lock / display off), **I want** a system notification when the timer ends or a stopwatch goal hits, **so that** I am not dependent on Web Audio.

**Acceptance criteria**

- [ ] Main detects timer auto-stop (`shouldAutoStopTimer`) and stopwatch goal (`shouldNotifyStopwatchGoal`) from live records + `Date.now()`, **even if the renderer is throttled**.
- [ ] On timer/break end: same persistence as today (pause then auto-save or leave paused+dialog **only if the window is visible and `confirmOnStop`**). When **hidden**: **save** the completed timer (do not open Stop dialog behind the user’s back). Stopwatch goal: notify once per record id; do not auto-stop (today’s rule).
- [ ] If `soundEnabled` and window **not** focused/visible: `new Notification({ title, body, silent: false })`. Title = session name; body = “Timer ended” / “Goal reached” / “Break ended”. No scope text.
- [ ] If `soundEnabled` and window **visible and focused**: renderer Web Audio only (no duplicate Notification).
- [ ] If `soundEnabled` false: no Notification sound and no Web Audio (Notification without sound is optional — **prefer no notification if muted**, still persist the record).
- [ ] Deduplicate with renderer `handledAutoStopRecordId` / `handledGoalRecordId` — **one** end action per record. Main is source of truth; renderer must not pause/save twice.

### Pause and stop from the menu bar

**As a** user, **I want** Pause, Resume, Stop & save, and Discard in the tray, **so that** I do not open the window.

**Acceptance criteria**

- [ ] Idle: Pause/Resume/Stop/Discard **disabled** (or omitted). Show Tempo + Quit remain.
- [ ] Focus running: **Pause**, **Stop & save**, **Discard**.
- [ ] Focus paused (no break): **Resume**, **Stop & save**, **Discard**.
- [ ] Break running (including paused-focus+break): labels act on **break** — Pause/Resume break, Stop & save break, Discard break. Do not Stop focus from the tray while a break is active.
- [ ] Stop & save = `stopSession` / `stopBreakSession` immediately (**ignore** `confirmOnStop`).
- [ ] Discard = `discardSession` / `discardBreakSession` immediately (destructive; label **Discard**, not Stop).
- [ ] After any tray action: tray title/tooltip refresh; renderer `refreshState` via push event.

## Functional requirements

1. Extract or reuse `shouldAutoStopTimer` / `shouldNotifyStopwatchGoal` / `getDisplayedElapsedSeconds` from `elapsed.helper.ts` in **main** (already importable — not renderer-only).
2. Single completion handler in main: persist, notify if hidden, emit `session:changed`.
3. Rebuild tray `Menu` every tick (or on state change) with enabled flags from `getActiveSessionState()` + `resolveFocusViewState`.
4. `BrowserWindow.isVisible()`, `isMinimized()`, `isFocused()` (and `isOccluded()` if available) gate Notification vs “let renderer play”.
5. Preload: `onSessionChanged(callback)` using `ipcRenderer.on('session:changed')`. `App.tsx` subscribes and calls existing `refreshState`.
6. Renderer auto-stop `useEffect` becomes a **fallback** only if main did not already handle that record id (or **remove renderer auto-stop** and keep renderer for UI clock + Web Audio when main sends `session:chime` while focused). **Prefer: main always persists; main sends `session:chime` with `{ kind: 'timer-ended' | 'goal-reached' }` when window focused; renderer plays Web Audio. Hidden → Notification, no chime IPC.**

## Technical requirements

### Architecture

- **Apps / packages:** `apps/tempo` main + preload + `App.tsx` + `timer-sound.helper.ts`.
- **Reuse (required):**
  - `status-tray.ts` `setInterval(refreshStatusTray, 1000)` — extend this loop (do not add a second 1s timer)
  - `records.repository.ts` `pauseSession`, `stopSession`, `discardSession`, break variants, `getActiveSessionState`
  - `elapsed.helper.ts` auto-stop / goal / elapsed
  - `focus-view.helper.ts` `resolveFocusViewState`
  - `getAppSettings().soundEnabled` / `soundVolume` (volume applies to Web Audio only)
  - `playTimerEndedSound` / `playGoalReachedSound` / `unlockTimerSound`
  - `ipc.ts` existing pause/stop/discard handles
- **New modules:**
  - `apps/tempo/src/main/session-tick.ts` — due-time + notify + emit (keep `status-tray.ts` thin if it gets large)
  - `apps/tempo/src/helpers/session-alert.helper.ts` — pure: should notify vs chime given visibility + settings (unit test)
- **Import boundaries:** `Notification` from `electron` in main, not renderer `new window.Notification` (main can show while renderer is frozen).

### Data layer

- **Schema:** none.
- **Migration:** none.
- **Persistence:** hidden timer end **saves** (`stopSession`) so a killed renderer cannot leave a live segment running forever. Visible + `confirmOnStop`: keep today’s pause + Stop dialog (main may pause and send `session:confirm-stop` **or** leave renderer effect for the visible path only). **Simplest correct split:**  
  - Hidden: main `stopSession`/`stopBreakSession` (save).  
  - Visible: renderer keeps current auto-stop + dialog behavior; main **does not** double-stop. Implement with a `handledAutoStopIds` Set in main **and** skip renderer auto-stop when `document.hidden` — actually renderer hidden is exactly when main must work. **Visible path:** renderer continues as today. **Hidden path:** main saves. If both think they’re responsible, use main-only completion always and have renderer only show dialog when main sends `session:prompt-stop` while visible+confirmOnStop. **Ship main-only completion** to avoid dual writers.

**Ship this:** Main is the only auto-stop/goal writer. Renderer clock is display-only for those events. On timer end: main pauses+stops/saves unless `confirmOnStop && windowVisible` → main pauses, emits `session:prompt-stop`, renderer opens `StopDialog`. On goal: main emits `session:chime` `{ kind: 'goal-reached' }` once; renderer plays if focused else main Notification.

### API & contracts

- **IPC invoke:** unchanged pause/stop/discard.
- **IPC events (main → renderer):**
  - `session:changed` — void; renderer `refreshState`
  - `session:chime` — `{ kind: 'timer-ended' | 'goal-reached' }`
  - `session:prompt-stop` — `{ target: 'focus' | 'break'; canSave: boolean }`
- **Preload:** `onSessionChanged`, `onSessionChime`, `onSessionPromptStop` (unsubscribe on unmount).
- **Validation:** tray Stop/Discard no-ops if no matching active record (catch repository throws; keep menu disabled instead).

### Frontend

- `App.tsx`: subscribe to the three events; `playEndSound` / `playGoalSound` only from `session:chime`; open Stop dialog from `session:prompt-stop`; **remove** (or no-op) renderer `shouldAutoStopTimer` effects so they cannot race main.
- Tray: `Menu.buildFromTemplate` with `{ enabled }` from view state.

### Auth & permissions

macOS Notification permission on first fire. If denied: persist still works; no sound — acceptable. Document in Settings later if needed; **this PRD does not require a Settings toggle beyond existing `soundEnabled`**.

### Error handling & edge cases

| Case | Behavior |
|---|---|
| Full sleep | No live chime; on wake, main tick saves if overdue and notifies once |
| `soundEnabled` false | Persist; no Notification; no Web Audio |
| Tray Discard with 0 elapsed | Same as in-app discard |
| Two windows | Tempo is single-window; use `BrowserWindow.getAllWindows()[0]` |
| confirmOnStop + hidden | Save, no dialog |
| Goal already notified | `handledGoalRecordId` in main |

### Testing

- **Unit:** `session-alert.helper` — visible+sound → chime IPC; hidden+sound → notify; muted → neither; goal vs timer.
- **Unit:** view-state → tray item enabled matrix (idle / running / paused / break).
- **Integration:** none required for Notification (unreliable in CI).
- **Manual:** start 1m timer, hide window, wait for Notification + saved History row; start timer focused, hear Web Audio, no notif; tray Pause/Resume/Stop&save/Discard with window closed then reopen (UI matches); confirmOnStop focused still shows dialog; break tray Stop does not stop focus.

### Deployment & ops

- **Env vars:** none.
- **Scripts:** none.
- **Rollout:** none. Dock icon already set.

## UX / UI

Tray (macOS status item) context menu, running focus example:

- Pause  
- Stop & save  
- Discard  
- —  
- Show Tempo  
- Quit  

Tooltip unchanged: `{name} · {clock}` (break preferred). Notification is system chrome.

## Dependencies & risks

- Renderer clock can lag while hidden; main `Date.now()` is truth.
- First Notification may be silent until macOS allows Tempo — user must allow in System Settings.
- `confirmOnStop` + main-only completion must be tested so focused users still get the dialog.

## Open questions

- [x] Hidden: Notification; visible: Web Audio.
- [x] Tray: Pause / Resume / Stop & save / Discard.

## Success criteria

- 1-minute timer ends with a Notification when Tempo is hidden; History has the saved row.
- Same timer focused plays Web Audio and does not duplicate a Notification.
- Tray can pause, resume, save, and discard without opening the window; Focus UI matches after Show Tempo.

## Implementation checklist

- [ ] `session:changed` / `chime` / `prompt-stop` IPC + preload + `App.tsx` subscriptions
- [ ] Move auto-stop/goal handling to main ticker (`session-tick.ts` + tray interval)
- [ ] Notification vs chime helper + `soundEnabled`
- [ ] Tray menu Pause/Resume/Stop & save/Discard with break vs focus
- [ ] Remove racing renderer auto-stop effects
- [ ] Unit tests for alert routing + tray enablement
- [ ] Manual hidden-timer, focused-timer, tray discard/save
