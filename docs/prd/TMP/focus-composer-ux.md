# Focus composer UX

| Field           | Value |
| --------------- | ----- |
| Status          | Draft |
| Scope           | TMP |
| Apps / packages | `apps/tempo` |
| Created         | 2026-09-11 |
| Companion       | [`tray-notifications.md`](./tray-notifications.md) (menu bar actions + hidden-window chimes) |
| Supersedes      | [`tempo-v2-focus-shell.md`](./tempo-v2-focus-shell.md) **My Activities footer**, duration chip sets (FR 3, FR 15 wrap-footer), brand mark as CSS circle. Break-offer **when** still [`break-timer-on-pause.md`](./break-timer-on-pause.md). |

## Problem

The Focus stage still spends chrome on a permanent **My Activities** footer (always on, A–Z, no reorder). Duration chips disagree by mode (`10/30/50` vs `15/25/45`) with no Custom. The window is a static 980×720 box (clock `clamp`s; nothing else scales). The top-bar “logo” is a CSS circle, not the generated app ring. Scope is type-only. Saved activity order cannot be changed.

## Goals

- Idle Focus has **no activity footer**. Activities open via **⌘/Ctrl+K** and a control on the session title.
- Activity **order is user-defined**, persisted, drag-reorderable **inside the picker**.
- Duration chips are always **10m / 30m / 1h + Custom**; planned time stays **1–60 minutes**.
- Window **reflows and modestly zooms** between min size and larger frames.
- Top bar shows **ring icon + Tempo** wordmark.
- Scope has a **toggle microphone** that appends dictation.

## Non-goals

- Menu-bar Pause/Stop/Discard and Notification-when-hidden (companion PRD).
- Raising `TIMER_MAX_PLANNED_SECONDS` above 60 minutes.
- Calendar / shadcn Date Picker for duration (duration Popover only).
- Analog dial, pomodoro loops, `@repo/ui`.
- Pinning Break first (Break is a normal reorderable row).
- Redesigning History / Analytics / Settings chrome beyond duration-preset labels.

## User stories

### Open activities without a footer

**As a** focus user, **I want** activities behind a picker, **so that** the clock owns the stage.

**Acceptance criteria**

- [ ] Idle: no `FocusStage` footer / `ActivityPills` strip. Running/paused/break: picker closed and not required.
- [ ] Open via **⌘K** (macOS) / **Ctrl+K** (Windows/Linux) when Focus is the active screen, and by clicking a control on/next to the session title (e.g. chevron or “Activities”).
- [ ] Palette lists saved sessions in `sort_order`. Search filters by name (case-insensitive). Empty: “No saved activities yet. Name one and optionally save it.”
- [ ] Select = today’s `onSelect` (fill name, lock name, hide Save-as-activity, Break hides/inerts mode toggle). Click selected row again deselects (name stays). Escape / click-outside closes without changing selection.
- [ ] Edit / Delete overflow stays on each row (same confirm-delete as pills). Picker is idle-only for select/edit/delete.

### Reorder activities in the picker

**As a** user, **I want** to drag activities, **so that** frequent ones stay on top.

**Acceptance criteria**

- [ ] Drag handle per row; drop updates order immediately (optimistic) then `sessions:reorder`.
- [ ] Order survives restart. New activities append at **end**. Delete does not leave gaps that scramble remaining order (renumber or dense ranks).
- [ ] Keyboard: optional but recommended — same list still selectable without dragging.

### Set 10 / 30 / 1h or Custom

**As a** user, **I want** the same chips in timer and stopwatch, **so that** I am not relearning presets.

**Acceptance criteria**

- [ ] Chips: **10m**, **30m**, **1h** (`60`). Same arrays for both modes. Delete mode-split `STOPWATCH_DURATION_CHIPS` / `TIMER_DURATION_CHIPS`.
- [ ] **Custom** opens a Popover (Radix, shadcn composition — **not** Calendar). Minutes input 1–60; optional hours+minutes UI that still **clamps to 60**. Apply sets `durationMinutes`. Invalid → keep previous + inline error.
- [ ] Highlight matching chip; if value is not `{10,30,60}`, Custom looks selected and the popover trigger shows the minutes (e.g. `12m`).
- [ ] Settings Default duration: `last` | `10` | `30` | `60` (drop `25` / `50`). Stored `"25"`/`"50"` parse → `last` or clamp to nearest allowed — **prefer map 25→30, 50→60** once then persist new enum.
- [ ] Timer Start still requires 1–60. Stopwatch goal 0 remains valid (no chip / Custom empty).

### Scale the window

**As a** user, **I want** Tempo to grow and shrink with the window, **so that** a larger frame is not empty padding around a postage stamp.

**Acceptance criteria**

- [ ] Keep `minWidth: 720`, `minHeight: 640`. Design reference **980×720**.
- [ ] Fluid: top nav wraps (do not hide History/Settings); chips wrap; title/scope `min(…vw)`.
- [ ] Modest zoom: `webContents.setZoomFactor` from current size vs 980×720, clamp **0.85–1.25**. Do **not** CSS-`zoom` / `transform: scale` the app shell (breaks Radix popover hit testing).
- [ ] Clock may keep `clamp(78px, 17vw, 168px)` *in addition* to zoom.

### Show the logo

**As a** user, **I want** the real Tempo ring next to the wordmark, **so that** the top bar matches the dock icon.

**Acceptance criteria**

- [ ] `AppTopBar` left: generated ring (`encodeAppIconPng` or equivalent PNG/data URL, ~16–20px CSS) + **Tempo**. Remove the CSS-only `h-4 w-4 rounded-full border-2` stand-in.

### Dictate scope

**As a** user, **I want** a mic toggle on scope, **so that** I can speak the session note.

**Acceptance criteria**

- [ ] Toggle on the scope field: start `webkitSpeechRecognition` / `SpeechRecognition`, **append** transcripts, tap again or `onend` to stop. Idle only.
- [ ] Listening visual (accent on the button). Permission denied / API missing: inline error, Start still works.
- [ ] Packaged macOS: `NSMicrophoneUsageDescription` and `NSSpeechRecognitionUsageDescription` in Electron entitlements / Info.plist. No recognition without the toggle gesture.

## Functional requirements

1. Remove `FocusStage` `<footer>` My Activities. Replace with `ActivityCommand` (cmdk-style Dialog or Combobox + list).
2. `SavedSession.sortOrder: number`. `listSavedSessions` `ORDER BY sort_order ASC, name COLLATE NOCASE`.
3. `sessions:reorder` accepts ordered `id[]` of **all** sessions; reject length/id mismatch.
4. Duration chips constant `[10, 30, 60]`. Custom Popover writes integer minutes 1–60 into existing `durationMinutes` state.
5. `DurationPreset` = `"last" | "10" | "30" | "60"`. `resolveDurationMinutes` matches.
6. On `BrowserWindow` `resize`, compute zoom factor; apply via `webContents.setZoomFactor`.
7. Dictation hook lives in renderer; never in main except entitlements.
8. Keep select-then-Start; no play control on activity rows.

## Technical requirements

### Architecture

- **Apps / packages:** `apps/tempo` only. No other apps. No `@repo/ui`.
- **Reuse (required):**
  - `FocusStage.tsx` composer (title, clock, rail, Start, chips slot, scope, save-as-activity)
  - `ActivityPills.tsx` overflow Edit/Delete/confirm — fold into picker rows or keep as child list
  - `App.tsx` `handleSelectBacklog` / `onSelectActivity`
  - `DurationChips.tsx` — rewrite chip set + Custom trigger
  - `sessions.repository.ts` list/create/update/delete
  - `encodeAppIconPng` (`icon.helper.ts`)
  - `parseMinutesInput` / `assertPlannedSeconds` (still 60–3600s)
  - `AppTopBar.tsx`
  - `cn.ts`, existing Radix Dialog/Dropdown
- **New modules:**
  - `apps/tempo/src/renderer/src/components/ActivityCommand.tsx` — Dialog/Command + search + dnd list
  - `apps/tempo/src/renderer/src/components/DurationCustomPopover.tsx` — Popover + minutes field
  - `apps/tempo/src/renderer/src/components/ui/popover.tsx` — Radix Popover, Tempo tokens (same pattern as `dialog.tsx`)
  - `apps/tempo/src/renderer/src/hooks/useScopeDictation.ts`
  - optional `apps/tempo/src/helpers/window-zoom.helper.ts` — `resolveZoomFactor(width, height)` + unit tests
  - `apps/tempo/src/helpers/session.helper.ts` — reorder validation
- **Import boundaries:** `@dnd-kit/core` + `@dnd-kit/sortable` in Tempo only. `cmdk` **or** filter-in-Dialog — pick one; do not add both. Prefer Dialog + input if cmdk fights Electron.

### Data layer

- **Schema:** `sessions.sort_order INTEGER NOT NULL`.
- **Migration:** `migrateSessionsTable` in `apps/tempo/src/main/db.ts`: `ALTER TABLE` if missing; backfill `ROW_NUMBER()` by current `name COLLATE NOCASE` (preserves today’s A–Z once).
- **Queries:** `createSavedSession` sets `sort_order = MAX(sort_order)+1` (or 0 if empty). `reorderSavedSessions(ids: string[])` transaction updates all ranks `0..n-1`.
- **Types:** `SavedSession.sortOrder`.

### API & contracts

- **IPC:** `sessions:reorder` `(ids: string[]) => SavedSession[]`.
- **Preload / `TempoApi`:** `reorderSessions(ids: string[])`.
- **Settings:** `DurationPreset` enum change in `settings.types.ts` + `parseDurationPreset`.
- **Validation:** reorder — unique ids, same set as DB. Duration custom — integer 1–60. Dictation text — append raw transcript; `normalizeScope` on Start unchanged.

### Frontend

- **Entry:** `FocusStage` title row: input + activities trigger (`aria-haspopup="dialog"`, `aria-expanded`).
- **Shortcut:** `useEffect` keydown on Focus screen; ignore if target is the command palette search (don’t re-open). Do not steal when Settings/History/Analytics focused unless you also want global — **Focus screen only**.
- **State:** `selectedSessionId` unchanged. `durationMinutes` unchanged.
- **Styling:** Tailwind + Radix + `cva`/`cn`. Logo: `style` only if needed for runtime PNG — prefer `<img src={…}>`.
- **Zoom:** listen in **main** (`win.on('resize')`) and `setZoomFactor`; or renderer `visualViewport` — prefer **main** so DevTools and popovers share factor.

### Auth & permissions

Local app. Mic/speech: OS TCC via Info.plist strings. No network requirement (recognition may still use OS services).

### Error handling & edge cases

| Case | Behavior |
|---|---|
| Reorder IPC fail | Revert list to last server order; toast/inline error |
| Duplicate names | Unchanged unique-name rule |
| Custom 0 / 61 / NaN | Reject; do not Start with invalid timer duration |
| Speech unsupported | Mic disabled + “Dictation unavailable” |
| Shortcut while typing scope | ⌘K still opens picker (standard) |
| Min window | Zoom 0.85 floor; no horizontal clip |

### Testing

- **Unit:** `resolveZoomFactor`; `parseDurationPreset` legacy 25/50; `reorderSavedSessions` validation; duration chip highlight helper (`isPresetMinutes` / Custom).
- **Integration:** sessions list order after create/reorder/delete (repository tests if you have a sql.js harness; otherwise helper + mocked IPC).
- **E2E:** none required.
- **Manual:** resize 720×640 → 1400×900; ⌘K select Break + Start; Custom 12m rail; drag two activities, relaunch; mic deny; popover + zoom (click targets lined up).

### Deployment & ops

- **Env vars:** none.
- **electron-builder.yml / entitlements:** mic + speech usage strings for macOS.
- **Rollout:** sqlite migrate on `initDatabase` / `reloadDatabaseFromFile` (already calls `migrateSessionsTable`).

## UX / UI

Idle: top bar (logo + nav + pip) → mode → **title + activities control** → clock → rail → Start → chips (10/30/1h/Custom) → scope + mic → save-as-activity. No bottom pill bar.

Picker: search, draggable rows (dot + name + Break minutes + ⋯), empty state.

Custom popover: minutes field, Apply. Dark Tempo tokens.

## Dependencies & risks

- SpeechRecognition in Electron is best-effort — degrade, don’t block Start.
- `setZoomFactor` + Radix: keep overlays in the same `webContents`.
- cmdk vs Radix Dialog focus trap — test ⌘K twice.

## Open questions

- [x] Placement: command palette (⌘K + title).
- [x] Duration cap: 1h.
- [x] Reorder surface: picker only.

## Success criteria

- Footer gone; picker selects activities; order persists.
- Chips 10/30/1h + Custom 1–60; settings presets match.
- Window zoom+reflow; logo is the ring; scope mic toggle works or fails visibly.

## Implementation checklist

- [ ] `sort_order` migration + repository list/create/reorder + IPC/preload/types
- [ ] `ActivityCommand` + remove footer; wire `App.tsx` shortcut
- [ ] `@dnd-kit` reorder in picker
- [ ] Duration chips + Custom Popover + settings preset enum
- [ ] `setZoomFactor` from window size
- [ ] `AppTopBar` ring image
- [ ] `useScopeDictation` + macOS usage strings
- [ ] Unit tests + manual resize / picker / custom / dnd / mic
