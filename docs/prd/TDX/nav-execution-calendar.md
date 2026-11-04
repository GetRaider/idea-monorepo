# Nav, execution status, and Calendar visibility

| Field           | Value                                      |
| --------------- | ------------------------------------------ |
| Status          | Draft                                      |
| Scope           | TDX                                        |
| Apps / packages | todex-web, todex-api, `@repo/api`         |
| Created         | 2026-11-04                                 |

## Problem

The left rail and the top-right execution control compete. Execution is a header button, not a page in the rail, and the rail order does not match how the product is used. Calendar is always visible even when the user does not want that module, and `@` still offers Events.

## Goals

- Overview uses the Lucide `layout-dashboard` glyph. Execution in the rail uses the Lucide `orbit` glyph.
- Execution is a rail item. With no active session, the top-right corner has no execution control.
- An active session stays in the top-right corner. Resume and Pause in that menu use the Lucide `play` and `pause` glyphs.
- Rail order is Overview, Knowledge, Planning, Execution. Calendar is last, and only when the account has turned it on.
- Calendar is off until the user enables it. The setting is stored on the account. While it is off, `/calendar` opens Overview, and `@` does not offer Events.

## Non-goals

- Do not delete calendar events, Google Calendar sync, or `/v1/calendar/*`.
- Do not hide Google Calendar settings.
- Do not change Overview sections, platform search, or the create menu. Those may still list or create events while the module is off.
- Do not rewrite saved event mentions, and do not block `/calendar/events/:eventId`.
- Do not add `lucide-react`. Glyphs stay hand-drawn SVGs in `apps/todex-web/src/components/icons.tsx`.
- Do not change Stop, Open, or the task switcher in the execution menu.

## User stories

### Rail matches the product order

**As a** signed-in user, **I want** Overview, Knowledge, Planning, and Execution in that order, **so that** Execution is a page like the others.

**Acceptance criteria**

- [ ] The rail lists Overview, Knowledge, Planning, Execution, in that order.
- [ ] Overview’s icon is Lucide `layout-dashboard`. Execution’s icon is Lucide `orbit`.
- [ ] Execution links to `/execution/execute` and is active for every `/execution` path, using the same active treatment as the other rail links.
- [ ] Knowledge and Planning icons and routes are unchanged.

### Execution status is not a second nav button

**As a** user, **I want** the header to show a running execution, **so that** I can pause or resume without a duplicate page button.

**Acceptance criteria**

- [ ] With no session, the top-right execution link is absent.
- [ ] With a session, the chip still shows the execution glyph, the clock, and the focused task title (or “Active execution”).
- [ ] The chip does not use the rail’s current-page highlight.
- [ ] The menu still has Open, Pause or Resume, Stop, and the task list.
- [ ] Pause shows the Lucide `pause` glyph beside the label. Resume shows the Lucide `play` glyph beside the label.

### Calendar is opt-in

**As a** user, **I want** Calendar off until I enable it, **so that** the rail and `@` stay limited to the modules I use.

**Acceptance criteria**

- [ ] A new account, and every existing account with no stored preference, has Calendar off.
- [ ] Settings has a Calendar control, separate from Google Calendar, that turns the module on and off.
- [ ] The value is stored per user and is the same in every browser where that account is signed in.
- [ ] While the preference is still loading, the rail does not show Calendar.
- [ ] While Calendar is off, the rail has no Calendar item. While it is on, Calendar is the last rail item.
- [ ] While Calendar is off, opening `/calendar` replaces the route with `/overview`.
- [ ] While Calendar is off, a bare `@` does not offer Events, `@events` does not list events, and event candidates are excluded from unscoped search.
- [ ] A mention already saved in task or doc text still renders and still opens `/calendar/events/:eventId` while Calendar is off.

## Functional requirements

1. Replace the Overview rail glyph with Lucide `layout-dashboard`, and add an orbit glyph for the Execution rail item. Both use the existing icon component shape: `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `strokeWidth="1.75"`.
2. Add Play and Pause glyphs the same way, and render the one that matches the session (`tracking` → Pause, otherwise Resume) inside the existing dropdown items in `ExecutionStatusBar`.
3. Render the rail from this order: `/overview`, `/knowledge`, `/planning`, `/execution/execute`, then `/calendar` only when `calendarEnabled` is true.
4. `ExecutionStatusBar` returns `null` when `session` is null.
5. Persist `calendarEnabled` on the user. Missing row means `false`. Do not default existing users to `true`.
6. Settings shows the control on `/settings`, above Google Calendar. Toggling it updates the account and the rail without a reload.
7. When `calendarEnabled` is false and the path is `/calendar` (not `/calendar/events/...`), replace the location with `/overview`.
8. `mentionMenuItems` omits the `events` scope and any `DocMentionTarget.EVENT` candidate when Calendar is off. Saved mention nodes and `mentionHref` for events stay as they are.

## Technical requirements

### Architecture

- **Apps / packages:** `apps/todex-web`, `apps/todex-api`, `packages/api` (`@repo/api/todex`).
- **Reuse (required):**
  - Rail: `apps/todex-web/src/components/AppNavRail.tsx`, icons in `apps/todex-web/src/components/icons.tsx`.
  - Status chip and menu: `ExecutionStatusBar` in `apps/todex-web/src/components/AppFrame.tsx`. Session actions stay `useExecution()` (`pause`, `resume`, `complete`, `focus`).
  - Settings shell: `apps/todex-web/src/app/settings/page.tsx`. Put the new control in a sibling of `GoogleCalendarSettings`, not inside it. Use `Checkbox` from `@repo/ui`.
  - Mentions: `mentionMenuItems` and `MENTION_SCOPES` in `apps/todex-web/src/app/planning/editor-mentions.ts`, called from `apps/todex-web/src/app/planning/task-description-editor.tsx`. `useMentionCandidates` in `editor-mentions.ui.tsx` does not load events today; still filter `EVENT` candidates so a later loader cannot leak them.
  - HTTP: `todexClient` in `apps/todex-web/src/lib/todex-client.ts`, `call()` plus Zod parse. Global prefix is `/v1`.
  - API shape: follow `WorkspaceController` (`WorkspaceGuard`, `request.userId`) and Zod schemas in `packages/api/src/todex`, re-exported from `packages/api/src/todex/index.ts`.
- **New modules:**
  - `packages/api/src/todex/user-preferences.ts` — `UserPreferencesSchema`, `UpdateUserPreferencesBodySchema`.
  - `apps/todex-api/src/modules/preferences/` — module, controller, service. Register the module in `apps/todex-api/src/modules/app.module.ts`.
  - `apps/todex-web/src/app/settings/calendar-module-settings.tsx` — the checkbox section.
  - A client hook, next to the settings section or under `apps/todex-web/src/app/settings/`, that reads the preference with React Query key `["user-preferences"]`. The rail, the calendar route guard, and the mention menu all use that hook.
- **Import boundaries:** web and api talk only through `@repo/api/todex` and HTTP. Do not import `apps/todex-api` from the web app.

### Data layer

- **Schema changes:** new table `user_preferences` in `apps/todex-api/src/db/schema.ts` (not `auth-schema.ts`, so Better Auth does not own the column).
  - `user_id` `text` primary key, references `users.id`, `onDelete: cascade`.
  - `calendar_enabled` `boolean` `not null` default `false`.
- **Migration:** `pnpm db:generate` in `apps/todex-api` after the Drizzle table exists. Do not hand-edit `_journal.json` if generate writes it. No backfill. No seed.
- **Queries / persistence:** `GET` returns `{ calendarEnabled: false }` when no row exists. `PATCH` upserts that user’s row. The flag is per user, not per workspace.

### API & contracts

- **Endpoints:** both require the signed-in user from `WorkspaceGuard`.
  - `GET /v1/preferences` → `UserPreferencesSchema` `{ calendarEnabled: boolean }`.
  - `PATCH /v1/preferences` body `UpdateUserPreferencesBodySchema` `{ calendarEnabled: boolean }` → the same schema after the upsert.
- **Shared types:** the two Zod schemas and their inferred types in `@repo/api/todex`.
- **Validation:** parse the patch body with `zodPipe` on the controller, matching `apps/todex-api/src/modules/calendar/calendar.controller.ts`.

### Frontend

- **Routes / pages:**
  - Rail hrefs: `/overview`, `/knowledge`, `/planning`, `/execution/execute`, `/calendar`.
  - `apps/todex-web/src/app/calendar/layout.tsx` (or a guard rendered there): if the preference has loaded, `calendarEnabled` is false, and the pathname is `/calendar` and not under `/calendar/events`, `router.replace("/overview")`. Event pages stay mounted so existing mentions still open.
- **Components:**
  - `OverviewIcon` path data becomes `layout-dashboard`. Add `OrbitIcon`, `PlayIcon`, and `PauseIcon` beside the other icons. The rail Execution item uses `OrbitIcon`. The status chip keeps `ExecutionIcon`.
  - `AppNavRail` `NAV` is built in the order above. Drop the unused `enabled: false` branch only if nothing else needs “Coming soon”; otherwise leave that branch and keep every shipped item `enabled: true`.
  - Menu rows: icon `size={16}` then the existing label, in a `flex items-center gap-2` row.
- **State & data fetching:** `useQuery` for `GET /v1/preferences`. The checkbox mutation patches, then invalidates `["user-preferences"]`. While `isPending`, treat Calendar as off.
- **Styling:** Tailwind only. No new visual system. Rail active classes stay the ones already on `AppNavRail` links.

### Auth & permissions

- Only the signed-in user can read or write their own row. `user_id` comes from `request.userId`, never from the body.

### Error handling & edge cases

- `GET` or `PATCH` failure: leave the rail as Calendar off. The settings checkbox shows the error with the existing `toast` pattern used in `google-calendar-settings.tsx` and does not flip the control.
- A preference that is still loading must not flash Calendar into the rail.
- `@events` while Calendar is off produces no event rows. `mentionEmptyLabel` may stay “No events”; do not add a new scope row.
- Turning Calendar off does not rewrite document HTML or task descriptions.

### Testing

- **Unit / integration:** extend `apps/todex-web/src/app/planning/editor-mentions.test.ts`. With events included, a bare `@` is still `tasks`, `docs`, `events`. With events excluded, that list is `tasks`, `docs`, and `@events standup` returns no targets. Add a service test that a missing row reads as `calendarEnabled: false` and a patch upserts `true` then `false`.
- **E2E:** none.
- **Manual checks:**
  - Signed out of a fresh session: rail is Overview, Knowledge, Planning, Execution. No Calendar. No execution control in the header until a session exists.
  - Start an execution: chip shows clock and title. Menu Pause has the pause glyph. After pause, the item is Resume with the play glyph. Open still goes to `/execution/execute`.
  - Settings: enable Calendar. Rail gains Calendar in last place. Disable it. Rail item disappears. Visiting `/calendar` lands on `/overview`. Visiting an existing `/calendar/events/:id` link still opens the event.
  - In a task description, `@` has no Events while Calendar is off, and Events returns after it is on. An already inserted event mention still renders and navigates.

### Deployment & ops

- **Env vars:** none.
- **Scripts / commands:** `pnpm db:migrate` in `apps/todex-api` before the web app depends on the table.
- **Rollout notes:** every account, including ones that already use Calendar, starts with the module hidden until they enable it in Settings. Event data and Google connections are left in place.

## UX / UI

Rail, top to bottom: Overview (`layout-dashboard`), Knowledge (current), Planning (current), Execution (`orbit`). Calendar (current glyph) is appended only when enabled.

Header right, no session: search and create only. Header right, session: the current chip and menu, plus play or pause on the Resume or Pause row. The chip is not drawn as the selected rail item.

Settings: a “Calendar” block with one sentence that the module is hidden until enabled, then a checkbox labeled so the on and off states are obvious. Google Calendar stays the next block.

## Dependencies & risks

- Drizzle migration must land before the preferences endpoints are called. Until then the client treats a failed `GET` as Calendar off.
- Hiding `/calendar` but leaving Overview, search, and the create menu able to surface events is intentional for this iteration. Users can still reach an event from those surfaces and from old mentions.

## Open questions

- None.

## Success criteria

- Rail order and glyphs match the list above.
- Execution is entered from the rail. The header shows a session only, with play and pause on the matching menu rows.
- Calendar is off by default, stored on the user, hidden from the rail and from `@`, and `/calendar` returns to Overview. Saved event mentions still open.

## Implementation checklist

- [ ] Add `user_preferences` and generate the Drizzle migration.
- [ ] Add Zod schemas, `GET`/`PATCH /v1/preferences`, and `todexClient.preferences`.
- [ ] Update Overview, orbit, play, and pause icons. Reorder the rail and append Calendar only when the preference is true.
- [ ] Remove the idle execution header link. Add play and pause to the session menu. Drop the current-page highlight from the chip.
- [ ] Add the Settings checkbox and the `/calendar` redirect. Leave `/calendar/events/:eventId` alone.
- [ ] Filter Events out of `mentionMenuItems` when Calendar is off. Update `editor-mentions.test.ts` and add the preferences read/upsert test.
- [ ] Run the todex-web mention tests and the new preferences test.
