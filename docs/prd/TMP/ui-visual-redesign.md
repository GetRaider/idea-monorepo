# Tempo UI visual redesign

| Field           | Value                                      |
| --------------- | ------------------------------------------ |
| Status          | Draft                                      |
| Scope           | TMP                                        |
| Apps / packages | `apps/tempo`                               |
| Created         | 2026-09-04                                 |
| Mocks           | [`mocks/v1`](./mocks/v1) (superseded) · [`mocks/v2`](./mocks/v2) (**target**) |

Companion: flows, states, IA, and copy are [`ux-interaction-redesign.md`](./ux-interaction-redesign.md). Implement that state machine first or in the same branch; this PRD owns **how it looks**, density, a11y chrome, and **Tailwind + Radix** migration. Visual target is **v2** (no analog dial, no bloom, one Start, cards select-only). Do not change break-offer **behavior** ([`break-timer-on-pause.md`](./break-timer-on-pause.md)).

## Problem

Focus is visually finished as an idle poster and unfinished as a product: `00:00:00` labeled “secs”, duration shown as `1m`, a 280px setter-dial pretending to be a timer, a 4.5rem empty Scope box, and five glowing Starts. Running/break states reuse the setup chrome. styled-components (Focus/History/Settings/dialogs) sit next to Tailwind (Analytics). Dialogs and the duration slider fail basic a11y. Window min 720×640 cannot hold dial + 3-col cards.

## Goals

- **One clock language:** `ClockDisplay` (H:M:S + caption) in every Focus state. **No analog `DurationDial`.** Idle timer/goal uses the number field + the same digital clock (`00:25:00` planned or `00:00:00` elapsed). Purple fill on **one** accent at a time (Start *or* active nav), no bloom.
- Duration/goal is a **number + “min”**, 1–60. Stop encoding `"25m"` in the input value. Stopwatch label **Goal (optional)**; timer label **Duration**.
- Scope is a **disclosure** (“Add scope”), not a permanent textarea.
- Regular Session cards: select-only (dot + name; Break may show `10 min`). **No play control on cards.** One composer Start. 12px card radius; 8–10px buttons (pills only for mode toggle).
- Layout **responds** below ~900px: stack clock under composer; Regular Sessions 2-col then 1-col. Hide mode toggle during break.
- **Migrate** Focus chrome + dialogs + remaining styled-components to Tailwind + Radix primitives (app-local, Tempo tokens). Remove `styled-components` from Tempo when unused.
- Visible `:focus-visible` rings, `color-scheme: dark`, `prefers-reduced-motion`, dialogs with `aria-modal` + focus trap + Escape.

## Non-goals

- New product states or start-path rules (UX PRD).
- Analytics metric formulas (UX PRD).
- Changing pause/complete break-offer **when** it appears.
- Adopting `@repo/ui` Dialog/Header (Next/`"use client"`, zinc theme). Tempo stays app-local.
- Bringing back the analog duration dial (v1 mock only).
- Redesigning the menu-bar glyph.

## User stories

### Read the clock without guessing units

**As a** user, **I want** a single H:M:S clock with a caption, **so that** “secs” under `00:12:34` never appears.

**Acceptance criteria**

- [ ] Idle: `ClockDisplay` shows planned time when timer (`formatTimerClock(minutes * 60)`) or `00:00:00` elapsed when stopwatch with caption “Ready” / “Elapsed”; **no** `secs`/`mins`.
- [ ] Non-idle: same `ClockDisplay` — remaining (timer/break) or elapsed (stopwatch); caption from UX PRD.
- [ ] `ClockDisplay` uses `tabular-nums` / mono digits; optional H:M:S unit row from existing `showUnits` if it helps, not a single “secs” word.

### Set duration without “1m”

**As a** user, **I want** a minutes field that looks like minutes, **so that** Goal/Duration is obvious.

**Acceptance criteria**

- [ ] Control is numeric (`inputMode="numeric"`, `name="durationMinutes"`), displayed as an integer, suffix **min** outside the value.
- [ ] Bounds 1–60 (timer required; stopwatch goal empty = 0 / unset). Empty stopwatch goal is valid.
- [ ] Number field is the duration/goal setter (arrow keys / stepper ±1). No analog dial.
- [ ] Break-offer duration field uses the same pattern (not `` `${n}m` ``).

### Focus fits the window

**As a** user on a 720×640 or always-on-top window, **I want** the layout to stack, **so that** Regular Sessions are not clipped.

**Acceptance criteria**

- [ ] Viewport `< 900px` (or `minWidth` 720): `SetupGrid` is one column; digital clock under fields.
- [ ] Regular Sessions: compact row / 3 columns default, 2 below 900px, 1 below 640px content width.
- [ ] Running/paused/break views: no composer; clock is the hero. Mode toggle hidden during break.
- [ ] Scope collapsed by default when empty; expanded textarea only after “Add scope” (or when `scope` has text).

### Chrome is keyboard- and AT-usable

**As a** keyboard user, **I want** focus rings, labeled nav, and trap-focused dialogs, **so that** Tempo is usable without a pointer.

**Acceptance criteria**

- [ ] Every control has `:focus-visible` ring (purple, ~2px). No `outline: none` without a replacement.
- [ ] Nav: `aria-current="page"` on the active item; collapsed items have `aria-label={label}`.
- [ ] Sidebar collapse: explicit chevron (or equivalent) in addition to the logo; keep ⌘/Ctrl+B.
- [ ] Duration/goal number input: Arrow keys ±1 when focused; no `DurationDial`.
- [ ] Dialogs: Radix Dialog (`role="dialog"`, `aria-modal`, focus trap, Escape = dismiss where backdrop-dismiss is allowed). Stop dialog: Escape does **not** save; treat as stay-open or Discard-equivalent — **Escape closes without saving** (user still paused; they can Stop again). Break offer Escape = Not now.
- [ ] Overflow menus: Radix Dropdown Menu (Escape, arrows, `aria-haspopup`).
- [ ] `html`/`body`: `color-scheme: dark`.
- [ ] Motion (sidebar width, glow, toggle glow): honor `prefers-reduced-motion: reduce` (duration 0 or opacity-only).

## Functional requirements

1. Remove `unitLabel` / `"secs"` / `"mins"` from Focus. Unmount `DurationDial` (delete the component once unused).
2. Stop setting duration inputs to `` `${durationMinutes}m` ``. Parse via `parseMinutesInput` on change; display the integer.
3. Mount `ClockDisplay` in **all** Focus view states.
4. Scope field is a `<details>` / Radix Collapsible / button+field; default closed if `scope === ""`.
5. Primary Start is a **fill** purple button (no glow). Cards are select-only (no play). Break card: muted + `{breakDurationMinutes} min` only.
6. Paused-focus chip: muted text, not `ErrorText` red (UX requires this; UI supplies the class).
7. Focus **Stop** and **Stop break** never appear as two equal `$variant="danger"` buttons. Visual: one danger action (UX hides the other).
8. Add Tempo tokens as CSS variables on `:root` (migrate `colors` from `App.styles.tsx`: `bg`, `sidebar`, `surface`, `purple`, `text`, `muted`, `danger`).
9. Replace styled-components in the renderer with Tailwind + `cn()` + `cva` variants. After the last consumer is gone, drop the `styled-components` dependency.
10. Add `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-collapsible`, `class-variance-authority` to `apps/tempo`.

## Technical requirements

### Architecture

- **Apps / packages:** `apps/tempo` renderer only. Do **not** import `@repo/ui` Dialog/Button (wrong theme). Reuse `apps/tempo/src/renderer/src/lib/cn.ts`.
- **Reuse (required):**
  - `ClockDisplay.tsx` — the only Focus clock
  - `AnalyticsSection.tsx` — already Tailwind; match its token classes or move to CSS variables
  - UX PRD view split (`FocusIdleView` / `FocusActiveView`) — style those files
- **New modules** (shadcn-style, app-local):
  - `apps/tempo/src/renderer/src/components/ui/button.tsx` — `cva` variants: `primary` | `ghost` | `danger` (no `glow`)
  - `apps/tempo/src/renderer/src/components/ui/dialog.tsx` — Radix Dialog wrapper (overlay, panel, title, body)
  - `apps/tempo/src/renderer/src/components/ui/dropdown-menu.tsx` — Radix Dropdown (replaces `OverflowMenu` internals)
  - `apps/tempo/src/renderer/src/components/ui/collapsible.tsx` — Radix Collapsible
  - `apps/tempo/src/renderer/src/styles.css` — `@tailwind base` if missing; `:root` tokens; `color-scheme: dark`; reduced-motion
- **Delete after migrate:** `DurationDial.tsx` (+ tests if any) and `*.styles.tsx` under `renderer/src` (`App.styles.tsx`, `BacklogPicker.styles.tsx`, `HistorySection.styles.tsx`, `SettingsSection.styles.tsx`, `ModeToggle.styles.tsx`, `OverflowMenu.styles.tsx`, `ManualRecordDialog.styles.tsx`, `CollapsibleSection.styles.tsx`, `ClockDisplay.styles.tsx`, `ColorPicker.styles.tsx`, `NavIcon.styles.tsx`). Keep logic components; restyle in-file.
- **Import boundaries:** Radix + Tailwind in Tempo; no new styled-components.

### Data layer

None.

### API & contracts

None. No IPC. Duration display is renderer-only; persisted value remains `lastDurationMinutes` / `plannedSeconds`.

### Frontend

- **Tokens** (from current `App.styles.tsx` `colors`):

  | Token | Value |
  |---|---|
  | `--tempo-bg` | `#07050c` |
  | `--tempo-sidebar` | `#06040a` |
  | `--tempo-surface` | `rgba(18, 12, 28, 0.92)` |
  | `--tempo-purple` | `#9b5cff` |
  | `--tempo-purple-deep` | `#7c3aed` |
  | `--tempo-text` | `#f4eefe` |
  | `--tempo-muted` | `#8f84a8` |
  | `--tempo-danger` | `#f87171` |
  | `--tempo-danger-bg` | `#be123c` |

- **BreakOfferDialog / StopDialog / ManualRecordDialog / SavedSessionDialog:** reimplement on `components/ui/dialog.tsx`. Preserve props and copy. Overlay click: offer = dismiss; Stop = no dismiss (same as today).
- **OverflowMenu:** keep the same `items` API; implement with Radix Dropdown. Portal + collision already handled by Radix (drop `getBoundingClientRect` reposition).
- **ModeToggle:** Tailwind compact segmented control; sentence case; `role="group"`; `aria-pressed`; **hidden during break**.
- **PeriodFilter (from UX PRD):** Tailwind, same chips as current Analytics.
- **Sidebar:** width transition listed properties only; reduced-motion disables width animation. No version string, no dark-mode toggle.
- **Brand:** logo remains; add a collapse chevron button with `aria-label` Expand/Collapse sidebar.
- **Fonts:** keep IBM Plex Sans / Mono; `font-display: swap` already. Clock: `font-variant-numeric: tabular-nums`.

### Auth & permissions

N/A.

### Error handling & edge cases

| Case | Behavior |
|---|---|
| `prefers-reduced-motion` | Sidebar snap; no bloom |
| Duration parse fail | Keep last valid minutes; do not write `0` except empty stopwatch goal |
| Long session names | `truncate` + `min-w-0` on cards and History rows (already on some) |
| 720×640 + Regular Sessions expanded | Scroll `Main` only; no horizontal overflow |

### Testing

- **Unit:** none required for visuals. Duration parse stays in `parseMinutesInput` tests.
- **No** visual snapshot suite required.
- **E2E:** none.
- **Manual:** resize to 720 width; tab through nav/composer/dialogs; VoiceOver: dialog titles, collapsed nav labels; Stop dialog Escape does not save; break-offer Escape dismisses; reduced-motion OS setting.

### Deployment & ops

- Add dependencies to `apps/tempo/package.json` (Radix dialog, dropdown-menu, collapsible, `class-variance-authority`).
- `pnpm --filter tempo typecheck` + `lint` + `test` after migration.
- Removing `styled-components` is the done signal — do not leave an unused dep.

## UX / UI

**Idle composer (density)**

- Mode toggle top, compact, sentence case (`py-2`).
- Name required; Scope behind “Add scope”.
- Goal/Duration row: `[ 25 ] min`. Digital `ClockDisplay` beside (or below on compact).
- One fill Start (no glow). Cards: color dot, name, ⋯. Break may show `10 min`. No ▶.

**Active / break**

- Centered `ClockDisplay` (~3rem digits). Caption under.
- Button row: Pause/Resume ghost/primary; single **outline** danger Stop / Stop break.
- Paused chip: `text-[var(--tempo-muted)]`, not danger.

**Do not**

- New illustrations or empty-state art this iteration.
- Neon on Regular Session cards. Analog dial.

## Dependencies & risks

- **UX PRD view split** — styling dead files if App.tsx is not extracted first. Land views, then migrate styles file-by-file.
- **Radix in Electron** — use `@radix-ui/react-*` primitives (not Themes). Portal to `document.body` is fine in the renderer.
- **Analytics already Tailwind** with hard-coded hex — migrate those classes onto CSS variables in the same PR so tokens are single-source.
- **Large diff** — migrate dialogs + App shell first (highest a11y win), then History/Settings/cards.

## Open questions

- [ ] None blocking. `ClockDisplay` `showUnits` (H:M:S letters) vs caption-only — implement caption-only; add unit row only if the clock reads ambiguous in QA.

## Success criteria

- No `secs`/`mins` under a clock. No `"25m"` as an input value.
- `ClockDisplay` in every Focus state; `DurationDial` gone.
- 720px-wide window: no horizontal clip on Focus.
- All renderer dialogs and overflow menus are Radix; keyboard Escape/arrows work.
- `rg styled-components apps/tempo` is empty except lockfile/history; package.json has no `styled-components`.
- Focus, History, Settings, Analytics share the same tokens and control look.

## Implementation checklist

- [ ] Add CSS variables + `color-scheme` + reduced-motion + `@tailwind base` in `styles.css`
- [ ] Add Radix + `cva`; create `components/ui/{button,dialog,dropdown-menu,collapsible}.tsx`
- [ ] Restyle `ClockDisplay` with Tailwind; wire it for **all** Focus states; unmount/delete `DurationDial`
- [ ] Duration number+min field; strip `Xm` encoding; same on BreakOfferDialog
- [ ] Scope disclosure; responsive SetupGrid; hide mode toggle on break
- [ ] Backlog cards: select-only, Break `10 min`; composer Start fill, no glow
- [ ] Paused chip muted; nav `aria-current` / collapse chevron / focus-visible
- [ ] Migrate dialogs → Radix Dialog; OverflowMenu → Radix Dropdown
- [ ] Migrate remaining `*.styles.tsx`; retokenize Analytics hex
- [ ] Remove `styled-components` from Tempo
- [ ] `pnpm --filter tempo codeCheck` + `test` + manual a11y/resize pass
