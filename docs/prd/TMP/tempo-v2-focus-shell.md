# Tempo v2 Focus shell

| Field           | Value |
| --------------- | ----- |
| Status          | Draft |
| Scope           | TMP |
| Apps / packages | `apps/tempo` |
| Created         | 2026-09-10 |
| Visual spec     | **Pixel still:** [`mocks/v4/image.png`](./mocks/v4/image.png) (this screenshot). **CSS source:** [`Tempo-v2.html`](../../../Tempo-v2.html) (`.t2-*` rules = implementer measurements). When still and HTML disagree on look, **match the still**; HTML wins on exact px/token values that the still cannot encode. |
| Supersedes      | [`ui-visual-redesign.md`](./ui-visual-redesign.md) (v2 composer + sidebar). Absorbs Focus / copy / History-filter / Analytics-split work from [`ux-interaction-redesign.md`](./ux-interaction-redesign.md) |

Break-offer **when** it appears stays in [`break-timer-on-pause.md`](./break-timer-on-pause.md). This PRD owns layout, copy, and which controls exist in each Focus state.

## Problem

Focus is a setup form beside a fake analog dial: `00:00:00` labeled “secs”, duration encoded as `"25m"`, five Starts (composer + per-card play), a collapsible sidebar that fights a 720×640 always-on-top window, and “Regular Session” language that does not match how the user thinks about the list. Running / paused / break reuse the idle composer.

`Tempo-v2.html` is the intended product: clock-first stage, top nav, duration chips, progress rail, footer activities. Ship that shell, keep Tempo’s real persistence (Stop + confirm, breaks, SQLite activities).

## Goals

- Focus idle and Focus active share one stage: mode, name, digital clock, progress rail, primary + Stop, duration chips, always-visible scope, footer **My Activities**.
- **One Start** (center). Activity pills **select only**.
- User-facing term is **activity** / **My Activities** everywhere Regular Session appears today.
- **Scope** stays a visible textarea (current `SessionScopeField`), not the HTML `+ Scope` disclosure.
- Secondary running action is **Stop** (save/discard dialogs). Do not ship HTML **Reset**.
- App chrome is the HTML **top bar** on every screen. Sidebar and `⌘B` collapse go away.
- Full visual pass: Focus, History, Analytics, Settings, dialogs — **screenshot palette + type** (see Design system). Tailwind + Radix; drop `styled-components`. Do not keep IBM Plex / old purple `#9b5cff` / `#07050c` chrome.
- Focus is a **state machine**: idle / running / paused / paused+break / break-only. Analytics **Focus time** vs **Break time** split from the UX PRD.

## Non-goals

- Analog ring / `DurationDial` / v5 dashboard form.
- HTML Reset (wipe elapsed without a record).
- Per-activity stored duration column (sessions still have `name` + `color` only).
- `@repo/ui` Dialog/Button (zinc / Next `"use client"`). App-local primitives.
- Pomodoro auto-loop, auto-resume after break.
- Changing break-offer timing (`offerBreakTimer`).
- Menu-bar glyph redesign.
- Productivity scores / analytics formulas beyond the focus/break split.

## User stories

### Clock-first Focus

**As a** focus user, **I want** the digital clock in the center of the window, **so that** I can read time at a glance on a small always-on-top window.

**Acceptance criteria**

- [ ] Idle and active Focus use the same stage layout as `Tempo-v2.html` (top bar → stage → My Activities footer).
- [ ] Clock uses HTML `fmt`: `MM:SS` until `>= 3600s`, then `H:MM:SS`. **Bricolage Grotesque 250**, tabular nums, size `clamp(78px, 17vw, 168px)`. No `secs` / `mins` unit row. `DurationDial` unmounted and deleted.
- [ ] Progress rail: stopwatch fill = `elapsed / goal` (goal from duration chips; empty goal → rail at 0, right label omitted or “no goal”); timer fill = `elapsed / duration`, left label **left**, right label duration / **goal reached**.
- [ ] Header pip + label: idle **Ready**; running **Running** (live pip); paused **Paused**. Break running uses **Break** (or **Running** with break identity in the title).

### Type name and scope as text

**As a** user, **I want** session name and scope as normal text fields, **so that** I do not hunt a disclosure for notes I always write.

**Acceptance criteria**

- [ ] Name is a centered title input (`t2-title`): placeholder `Untitled session`; required to Start (disable + “Enter a session name to start”).
- [ ] Scope is a textarea always visible under the duration chips (current placeholder “What you'll work on this session”). Not `+ Scope` / hidden by default.
- [ ] Blank scope still persists as `null` (`normalizeScope`).
- [ ] Name locked when an activity is selected (same as today). Scope editable while idle.

### Select an activity, then Start

**As a** user, **I want** My Activities to prepare the composer, **so that** I am not starting from two places.

**Acceptance criteria**

- [ ] Footer label **My Activities** (not Quick start / Regular Sessions).
- [ ] Pills: color dot + name; Break also shows `{breakDurationMinutes}m`. Click selects (highlight `t2-q.on`), fills name, hides Save-as-activity. Click selected again deselects (name stays).
- [ ] No play control on pills. Center Start launches (`handleStart` / Break → `startBreak`).
- [ ] Overflow Edit / Delete remain on each pill (HTML has no ⋯ — keep them compact so activities stay manageable).
- [ ] Empty: “No saved activities yet. Name one and optionally save it.”
- [ ] Pills non-interactive while not idle.

### Stop persists; HTML Reset does not ship

**As a** user, **I want** Stop to save or discard through the existing dialogs, **so that** History stays truthful.

**Acceptance criteria**

- [ ] Idle: primary **Start** only (no Reset, no disabled secondary).
- [ ] Focus running: **Pause** + **Stop**. Paused (no break): **Resume** + **Stop**.
- [ ] Stop still uses `StopDialog` / `confirmOnStop`; Escape on Stop dialog does not save.
- [ ] Break running: **Stop break** only as the destructive action; no focus Stop. Resume disabled with “Finish break to resume” when focus is paused under a break.

### Top bar on every screen

**As a** user, **I want** Focus / History / Analytics / Settings in a single top nav, **so that** the clock can use the full width.

**Acceptance criteria**

- [ ] Shell matches `.t2-top`: brand | nav | state pip. Nav `aria-current="page"`.
- [ ] Sidebar removed. Settings control and `⌘/Ctrl+B` for `sidebarCollapsed` removed from UI. Stored `sidebarCollapsed` may remain parsed so old settings JSON does not throw.
- [ ] History / Analytics / Settings render in `<main>` under the same top bar, restyled to v2 tokens (not the old sidebar page chrome).

### Activity language everywhere

**As a** user, **I want** one word for saved named sessions, **so that** Settings, Focus, and History agree.

**Acceptance criteria**

- [ ] Replace user-visible “Regular Session(s)” / “Save as Regular” / “Save new names to Regular Sessions”.
- [ ] Focus checkbox: **Save as activity** (hidden when an activity is selected).
- [ ] Settings: **Save new names as activities**.
- [ ] Manual record dialog: activity select label **Activity**; checkbox **Save as activity**.
- [ ] History / Analytics filter: **All activities** (internal helper names like `filterRecordsByBacklogSession` may stay).

## Functional requirements

1. `resolveFocusViewState(focus, break)` → `idle` | `focusRunning` | `focusPaused` | `focusPausedBreakRunning` | `breakOnly`. Render only that state’s controls. Never show the idle Start + activity Starts while a record is active.
2. Activity pill body = `onSelect` only. Drop `onPlay` from the pill UI. Selecting default Break: hide or inert mode toggle; Start calls `startBreak` with `settings.breakDurationMinutes`.
3. Duration chips (HTML): stopwatch `[10m, 30m, 50m]`; timer `[15m, 25m, 45m]`. Click sets `durationMinutes` (1–60 clamp). Highlight chip whose minutes equal current value; if launch/settings value is not in the set, no chip selected but the value still applies (progress rail / plannedSeconds use it). No `"25m"` string in inputs.
4. Scope: always-visible `<textarea>`. Do not port `t2-scopebtn`.
5. Clock captions: idle timer “Ready”; running timer remaining implied by rail **left**; stopwatch running uses rail **elapsed**; goal hit “goal reached” on rail right + clock accent color (`--tempo-accent`). Break: “Break remaining” / “Break paused”.
6. Hide mode toggle during break. Hide duration chips and Save-as-activity while not idle. Name/scope/chips disabled while not idle.
7. Paused focus chip: muted, not danger (`ErrorText` red banned for “{name} paused”).
8. `buildAnalyticsMetrics`: **Focus time** = completed `recordRole === 'focus'`; **Break time** separate; Daily Average / session stats **focus-only**. Time by Day = focus seconds. Time by Activity may include Break as a row.
9. History: period presets matching Analytics (`today` | `week` | `month` | `custom` date inputs); activity `<select>`; day groups; Break badge; drop timer/stopwatch badges from the default row.
10. Settings: confirm-on-stop with Defaults/Session group (not Window-only); break duration 1–60; Import confirm before overwrite. Remove Sidebar collapsed. Window group keeps always-on-top / menu bar clock.
11. Tray tooltip: `{name} · {clock}` (break preferred when active).
12. Implement the **Design system** section (tokens, type, radii, chrome). Electron `BrowserWindow.backgroundColor` = `--tempo-bg` (`#08090C`), not `#0c0814`.
13. Stage glow (`.t2-glow`): idle opacity ~0.5, running ~0.9. Screenshot idle is a *soft* violet wash behind the clock — do not crank it to a neon bloom. `prefers-reduced-motion: reduce` → glow opacity 0 or static.
14. `:focus-visible` rings (accent, ~2px). `color-scheme: dark`. `html`/`body` `overflow: hidden`.
15. Window: keep `minWidth: 720`, `minHeight: 640`. Stage stacks; My Activities wraps. No horizontal clip. HTML `@media (max-width:640px)` hides nav — **do not** hide History/Settings in Electron; wrap or shrink the top nav instead.

## Technical requirements

### Architecture

- **Apps / packages:** `apps/tempo` renderer + existing helpers. No `@repo/ui`. No other apps.
- **Reuse (required):**
  - `App.tsx` IPC handlers (`handleStart`, `handlePause`, `handleResume`, `requestStop`, `requestBreakStop`, `handleSelectBacklog`)
  - `ClockDisplay.tsx` — restyle; still the only clock (extend `value` formatting via helper)
  - `isDefaultBreakSessionName` (`break.helper.ts`)
  - `elapsed.helper.ts` — add `formatStageClock(seconds)` matching HTML `fmt` (unit tests)
  - `analytics.helper.ts` / `history.helper.ts` / `session.helper.ts` `parseMinutesInput` / `normalizeScope`
  - Dialogs: `StopDialog`, `BreakOfferDialog`, `ManualRecordDialog`, `SavedSessionDialog` — behavior unchanged, restyle
  - `cn.ts`
- **New modules:**
  - `apps/tempo/src/helpers/focus-view.helper.ts` — `resolveFocusViewState` + tests
  - `apps/tempo/src/renderer/src/focus/FocusIdleView.tsx`
  - `apps/tempo/src/renderer/src/focus/FocusActiveView.tsx` (or one `FocusStage` with state discriminant — KISS, prefer one stage + conditional controls)
  - `apps/tempo/src/renderer/src/components/ui/{button,dialog,dropdown-menu}.tsx` — `cva` + Radix
  - `apps/tempo/src/renderer/src/components/AppTopBar.tsx`
  - `apps/tempo/src/renderer/src/components/DurationChips.tsx`
  - `apps/tempo/src/renderer/src/components/ProgressRail.tsx`
  - `apps/tempo/src/renderer/src/components/ActivityPills.tsx` — replaces `BacklogPicker` card grid (move overflow/delete confirm here; delete `BacklogPicker` + styles when unused)
  - `apps/tempo/src/renderer/src/components/PeriodFilter.tsx` — History + Analytics
  - `apps/tempo/src/helpers/history.helper.ts` — `buildHistoryDayGroups`; `HistoryEntry.recordRole`
- **Import boundaries:** Radix primitives + Tailwind in Tempo only.

### Data layer

- **Schema:** none. No activity duration column.
- **Migration:** none.
- **Settings:** stop writing `sidebarCollapsed` from UI; keep parse in `settings.helper.ts`.
- **Queries:** existing `getActiveState`, `listRecords`, `listSessions`.

### API & contracts

- **IPC:** none new.
- **Shared types:** `FocusViewState` in helpers (not necessarily `records.types.ts`).
- **AnalyticsMetrics:** `focusSeconds`, `breakSeconds`; do not leave `totalSeconds` as focus+break.
- **Validation:** duration chips and settings break duration 1–60; timer Start still requires `durationMinutes >= 1`.

### Frontend

- **Routes:** in-app `AppScreen` (`focus` | `history` | `analytics` | `settings`).
- **Shell:** `App.tsx` = providers/state + `AppTopBar` + screen body. Focus JSX out of the 1200-line blob.
- **Styling:** enable `@tailwind base` in `styles.css`; map tokens on `:root`. Tailwind `preflight` may stay off if Radix + existing reset is cleaner — but drop `App.styles.tsx` styled components. Delete renderer `*.styles.tsx` after migrate.
- **Delete:** `DurationDial.tsx`, sidebar styled pieces, `NavIcon` if unused (top nav is text links like HTML).
- **Deps:** `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `class-variance-authority`, `@fontsource/inter-tight` (400/500/600), `@fontsource/bricolage-grotesque` (opsz 12–96, weights **200–700** — clock needs ~250). Remove `styled-components` when unused.
- **State:** `durationMinutes`, `name`, `scope`, `selectedSessionId`, `saveToBacklog` unchanged semantically.

### Auth & permissions

N/A — local single-user Electron.

### Error handling & edge cases

| Case | Behavior |
|---|---|
| Empty name | Start disabled + helper under controls |
| Stopwatch goal 0 | Rail empty; Start allowed; no “goal reached” |
| Timer duration 0 | Start disabled (required) |
| Chip set ≠ current minutes | No `.on` chip; value still used |
| Break selected | Mode inert; Start → `startBreak` |
| Both Stop and Stop break | Never; break wins |
| `prefers-reduced-motion` | No glow pulse / button scale |
| Long activity names | `truncate` on pills |
| 720px window | Footer wraps; clock `clamp` as HTML |
| Import cancel | No-op |

### Testing

- **Unit:** `resolveFocusViewState` (five states). `formatStageClock` (0, 59, 60, 3599, 3600, 3601). `buildAnalyticsMetrics` focus/break split. `buildHistoryEntries` `recordRole`. History day groups. Existing session/elapsed tests still pass (no `"25m"` in Focus UI — parser can remain).
- **E2E:** none.
- **Manual:** idle select → Start; Break select → countdown; Pause → break offer; rest layout; Resume disabled + hint; Stop Escape; History day groups + Break badge; Analytics week with a break; top nav all four screens; resize 720; reduced-motion; tab order top bar → stage → pills; VoiceOver dialog titles. **Visual:** idle Focus side-by-side with `mocks/v4/image.png` (type, clock weight, white Start, accent chip, dots, hairlines, no purple sidebar).

### Deployment & ops

- **Env:** none.
- **Scripts:** `pnpm --filter tempo codeCheck` + `test`.
- **Rollout:** renderer + helpers; SQLite compatible. Move or keep `Tempo-v2.html` as the visual spec (do not delete).

## Design system

Screenshot (`mocks/v4/image.png`) mapped to `Tempo-v2.html` `.t2-root` variables. **Replace** current `App.styles.tsx` `colors` and IBM Plex.

### Color

| Role | CSS variable | Value | Screenshot |
|---|---|---|---|
| Canvas | `--tempo-bg` | `#08090C` | Near-black, **neutral** (not purple `#07050c`) |
| Text | `--tempo-text` | `#F4F3F0` | Clock, active nav, session title, Start fill |
| Muted | `--tempo-muted` | `#7E828C` | Inactive nav, “elapsed” / “goal · 10m”, unselected chips, Ready |
| Faint | `--tempo-faint` | `#4B4E58` | Footer label, unselected mode (“Timer”), pip idle, duration suffix on pills, placeholders |
| Hairline | `--tempo-line` | `rgba(255,255,255,.08)` | Top/footer rules, unselected chip/pill borders, mode-on border, rail track |
| Hairline strong | `--tempo-line-2` | `rgba(255,255,255,.16)` | Secondary button (Stop) border, hover borders |
| Panel | `--tempo-panel` | `rgba(255,255,255,.03)` | Selected mode pill fill, hover, scope field fill |
| Accent | `--tempo-accent` | `#8B7CFF` | Logo ring, selected `10m` chip border, rail fill, Deep Work dot, selected activity border |
| Accent wash | `--tempo-accent-wash` | `rgba(139,124,255,.1)` | Selected chip background |
| Glow | — | `radial-gradient(circle, rgba(139,124,255,.20), transparent 62%)` | Soft violet behind clock; 560px, blur 30px |
| Live | `--tempo-live` | `#5FE0AE` | Running pip + halo; Break dot; goal-reached rail/clock |
| Primary invert | `--tempo-on-primary` | `#0B0B0E` | Text on Start |
| Danger | `--tempo-danger` | `#f87171` | Stop/delete only — **not** in the idle still |

**Activity dots in the still** (defaults when creating samples / Break): Deep Work `#8B7CFF`, Break `#5FE0AE`, Job Search `#5AA9FF`, Personal `#F5B454`. Existing saved `session.color` stays as stored.

**Grain:** `.t2-root::before` fractal-noise overlay, `opacity: .4`, `mix-blend-mode: overlay`, `pointer-events: none`. Keep it — the still is not a flat fill.

**Do not use:** `#9b5cff` / `#7c3aed` purple buttons, `#f4eefe` lilac text, IBM Plex, analog dial bloom.

### Type

| Use | Family | Weight | Size / tracking | Screenshot |
|---|---|---|---|---|
| UI (nav, chips, buttons, scope, pills) | **Inter Tight** | 400 / 500 / 600 | `letter-spacing: -0.01em`; `-webkit-font-smoothing: antialiased` | Tight grotesque, not Plex |
| Wordmark “Tempo” | **Bricolage Grotesque** | 600 | 19px | Left of top bar |
| Clock `00:00` | **Bricolage Grotesque** | **250** | `clamp(78px, 17vw, 168px)`; `line-height: 0.9`; `letter-spacing: -0.05em`; `font-variant-numeric: tabular-nums`; `font-feature-settings: 'tnum' 1` | Huge, thin, round terminals |
| Session title | Inter Tight | 500 | 18px, centered | “Software Growth” |
| Nav links | Inter Tight | inherit | 14px; gap 26px | Active = `--tempo-text`; idle = `--tempo-muted` |
| Ready / pip label | Inter Tight | inherit | 13px | `--tempo-muted` |
| Rail meta | Inter Tight | inherit | 12px | “elapsed” / “goal · 10m” |
| Duration chips | Inter Tight | 500 | 12.5px | `10m` selected vs `30m`/`50m` muted |
| `+ Scope` in still | — | — | — | **Do not ship**; scope is a 14px textarea (`t2-scope`) always visible |
| Footer label | Inter Tight | 500 | 12px | Still says “Quick start” → ship **My Activities** at this style (`--tempo-faint`) |
| Pill name | Inter Tight | 500 | 13px | `--tempo-text` |
| Pill minutes | Inter Tight | normal | 11.5px | `--tempo-faint` (still `<em>`) |

Bundle fonts locally (`@fontsource/*` or files). No Google Fonts in packaged app. `font-display: swap`.

### Geometry (from HTML; matches still)

| Element | Spec |
|---|---|
| Top bar | CSS grid `1fr auto 1fr`; padding `20px 32px`; bottom border `--tempo-line`; sticky; `backdrop-filter: blur(14px)`; bg `rgba(8,9,12,.6)` |
| Logo mark | 16×16 circle, `border: 2px solid var(--accent)`, no fill |
| Mode switch | Pill radius **20px**; selected: panel fill + line border; unselected: transparent, faint text |
| Clock | Centered; color `--tempo-text`; `.done` → `--tempo-accent` |
| Rail | Width `min(440px, 86vw)`; track 3px `--tempo-line`; fill `--tempo-accent` (`.done` → `--tempo-live`); head 11px `--tempo-text` circle, `box-shadow: 0 0 0 4px var(--tempo-bg)` |
| Start | Radius **12px**; padding `14px 40px`; 15px/600; bg `--tempo-text`; color `--tempo-on-primary`; hover opacity 0.86 |
| Stop (maps still’s Reset slot) | Radius 12px; padding `14px 22px`; 15px/500; transparent; border `--tempo-line-2`; color `--tempo-muted`; idle: **omit** (still shows disabled Reset — we don’t) |
| Duration chips | Radius **8px**; padding `7px 13px`; gap 6px; selected: accent border + accent wash |
| Scope textarea | Width `min(440px, 86vw)`; radius **11px**; padding `12px 14px`; panel + line; 2 rows |
| Footer | Padding `18px 32px`; top border; same blur/bg as top; gap 18px label→pills |
| Activity pills | Radius **10px**; padding `8px 14px`; gap 9px inner; 7px color dot; selected: accent border |
| Stage | `flex: 1`; column; center; padding `40px 24px`; gap **22px** |

### Chrome mapping (still → ship)

| Still | Ship |
|---|---|
| Quick start | **My Activities** (same faint 12px label) |
| Reset | **Stop** when a session is active; idle = Start only |
| `+ Scope` | Always-visible scope textarea (still’s field chrome, not the toggle) |
| 10m / 30m / 50m | Stopwatch chips; timer 15/25/45 |
| Hollow accent logo | Keep |

History / Analytics / Settings: same bg, type, hairlines, inputs/buttons using these tokens — not a second theme.

## UX / UI

**Idle (screenshot + overrides)**

```
[Tempo]     Focus  History  Analytics  Settings     ○ Ready

        [ Stopwatch | Timer ]
        [ session name ]
        [ MM:SS ]
        elapsed ────────── goal · 10m
        [ Start ]
        [ 10m ] [ 30m ] [ 50m ]
        [ scope textarea ]
        [ ] Save as activity     (if no activity selected)

My Activities   (dot) Deep Work  (dot) Break 10m  …
```

**Focus running / paused**

Same stage. Title = session name (read-only). Chips / save / activity pills inert or hidden. Primary Pause | Resume. Secondary **Stop**.

**Paused + break**

Clock = break remaining. **Stop break**. Chip: `{focus name} paused · {hms}` muted. Resume disabled + “Finish break to resume”.

**Break only**

Break identity + remaining + **Stop break**.

**Do not**

- `+ Scope` toggle
- Reset
- Per-pill Start
- Sidebar
- Analog dial
- IBM Plex / old `#9b5cff` glow buttons / purple `#07050c` canvas

## Dependencies & risks

- **Break PRD** data (`recordRole`, dual records) must already be in main — it is.
- **`App.tsx` size** — extract stage or the shell will stay bolted on.
- **Font licensing** — Bricolage Grotesque / Inter Tight are OFL; bundling is fine.
- **Select-only pills** — if one-click start is missed later, add it then; not this PRD.
- Old PRDs: treat this file as the implementer spec. Do not implement `ui-visual-redesign.md` v2 composer layout.

## Open questions

- [ ] None blocking.

## Success criteria

- Focus matches [`mocks/v4/image.png`](./mocks/v4/image.png): Inter Tight + Bricolage 250 clock, `#08090C` canvas, `#8B7CFF` accent, white Start, hairline chips/pills — with scope always visible and Stop instead of Reset.
- Zero Regular Session user-facing strings in Tempo renderer.
- `DurationDial` gone; `styled-components` gone from Tempo `package.json`.
- One Start path; activity click does not start.
- Analytics Daily Average does not include break seconds.
- 720×640: no horizontal clip; History/Analytics/Settings reachable from the top bar.
- Break offer on pause/complete unchanged.

## Implementation checklist

- [ ] Tokens + Inter Tight / Bricolage + grain + glow + `color-scheme` + reduced-motion in `styles.css`; `backgroundColor` `#08090C`; Tailwind on Focus shell
- [ ] `AppTopBar`; remove sidebar, `⌘B`, Settings collapsed control
- [ ] `formatStageClock` + `ClockDisplay` restyle; delete `DurationDial`
- [ ] `ProgressRail` + `DurationChips` + always-visible scope + Save as activity
- [ ] `resolveFocusViewState` + extract Focus stage; Pause/Resume/Stop mapping; break layout
- [ ] `ActivityPills` select-only; rename copy globally (Settings, dialogs, History, Analytics)
- [ ] Radix dialogs + dropdown; restyle History / Analytics / Settings to tokens
- [ ] PeriodFilter + analytics focus/break split + History day groups / Break badge
- [ ] Tray tooltip name + clock
- [ ] Remove `styled-components` and unused `*.styles.tsx`
- [ ] `pnpm --filter tempo codeCheck` + `test` + manual QA list
