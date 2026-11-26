# Todex — Desktop app (tech spec)

| Field   | Value                                      |
| ------- | ------------------------------------------ |
| Status  | Draft                                      |
| Scope   | TDX                                        |
| Apps    | `apps/todex-desktop` (new), `apps/todex-web`, `apps/todex-api` (unchanged) |
| Created | 2026-11-26                                 |

Companion: [architecture.md](./architecture.md), [flows.md](./flows.md), [mcp-server-mvp.md](./mcp-server-mvp.md).

**Summary:** An Electron shell that opens the already-running local Todex web app in its own window. No changes to `todex-web` or `todex-api`. Local dogfooding only; no production deploy, no distribution.

## Why this shape

`todex-web` is effectively a client-side SPA on Next 15: no server actions, no route handlers, no middleware, no `next/headers`; 102 of 108 `.tsx` files are `"use client"`. All logic lives in `todex-api` (NestJS). So the cheapest correct desktop client is a window onto the dev stack.

Production schema is not final, so nothing is deployed. Everything stays local and the DB can be wiped or migrations squashed freely.

## Goals

- Todex in its own window with its own dock/taskbar icon.
- Zero code changes in `todex-web` / `todex-api` / `@repo/api`.
- Reuse Airove's tooling (electron-vite, main / preload / renderer layout).

## Non-goals (v0)

- Distribution: no installers, signing, notarization, or auto-update.
- Bundling Postgres, Redis, SearXNG, or the API inside the app.
- Static export of `todex-web` (needs `generateStaticParams` for ~8 dynamic routes, no `redirects()`, and an auth rework).
- Google sign-in and Google Calendar linking inside Electron (see Auth).
- Offline mode.

## Architecture

```
Electron main ── BrowserWindow ──► http://localhost:3002  (todex-web, next dev)
                                         │ credentials: include
                                         ▼
                                   http://localhost:8091  (todex-api)
                                         │
                                   Postgres + Redis (docker compose)
```

- The window loads the **same origin** the API already trusts (`WEB_BASE_URL=http://localhost:3002`). CORS and `trustedOrigins` stay as they are.
- `localhost:3002` and `localhost:8091` are same-site (ports ignored), so Better Auth cookies with `SameSite=lax` work unchanged. `crossSiteSession` is false because `API_BASE_URL` is `http://`.
- The desktop app does **not** start the stack. The developer runs `pnpm dev:todex` plus `pnpm --filter todex-api docker:up`.

## Package layout

```
apps/todex-desktop/
  package.json            # name: todex-desktop; electron-vite, electron ^37 (match airove)
  electron.vite.config.ts
  tsconfig.json / tsconfig.node.json
  eslint.config.js / vitest.config.ts
  src/
    main/
      index.ts            # app lifecycle, window, single-instance lock
      config.ts           # TODEX_WEB_URL, TODEX_API_URL, defaults
      readiness.ts        # poll web + API until up (pure, testable)
      policy.ts           # navigation allowlist, external-link handling (pure, testable)
      window-state.ts     # persist and restore bounds
    preload/
      index.ts            # empty in v0 (no IPC surface)
    renderer/
      stack-down.html     # "Stack not running" screen with retry
```

Root `package.json`: add `"dev:todex-desktop": "turbo run dev --filter=todex-desktop"`. Git scope is already **TDX**.

## Behavior

### Startup

1. Take the single-instance lock; focus the existing window on a second launch.
2. Show the window immediately with a loading view.
3. Poll `GET {TODEX_API_URL}/health` (public via `@AllowAnonymous`) and `GET {TODEX_WEB_URL}/sign-in` every 1s, up to 60s.
4. Both up: `loadURL(TODEX_WEB_URL)`. Timeout: show `stack-down.html` listing which URL failed, with a Retry button.

### Config

| Var              | Default                 | Notes                                                    |
| ---------------- | ----------------------- | -------------------------------------------------------- |
| `TODEX_WEB_URL`  | `http://localhost:3002` | Must equal the API's `WEB_BASE_URL`                      |
| `TODEX_API_URL`  | `http://localhost:8091` | Must equal `NEXT_PUBLIC_API_BASE_URL`                    |

### Window

- Default 1280x800, min 960x600; persist bounds across launches.
- Standard menu with Reload, DevTools (dev only), Zoom, Quit.

### Security

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.
- `setWindowOpenHandler` and `will-navigate`: allow only the origins of `TODEX_WEB_URL` and `TODEX_API_URL`. Any other `https:` URL opens with `shell.openExternal`; anything else is denied. Follow Airove's `policy.ts` pattern.
- No IPC channels in v0, so the page cannot reach Node.

## Auth

- **Use dev login.** Set `TODEX_DEV_LOGIN=true` on the API and `NEXT_PUBLIC_TODEX_DEV_LOGIN=true` on web, then sign in with the seeded `dev@todex.test` user.
- Web only honors dev login when `NODE_ENV !== "production"` (`lib/env.ts`), so the web app must run via `next dev` (`pnpm dev:todex`), not `next start`.
- **Google sign-in does not work in an embedded Electron window** (Google rejects embedded webviews). Out of scope in v0.
- **Google Calendar linking (`linkSocial`) is unsupported.** The navigation policy sends Google to the system browser, so the resulting session never reaches Electron.
- Never enable dev login in production; `assertDevLoginConfig` already throws if `NODE_ENV=production`.

## Testing

- Vitest unit tests for `readiness.ts` (timeouts, partial availability) and `policy.ts` (allowed, external, denied URLs).
- `pnpm verify:affected` for lint, unit tests, and typecheck. No automated e2e in v0.
- Manual acceptance below.

## Acceptance checklist

- [ ] `pnpm dev:todex-desktop` opens a window that reaches `/sign-in` with the stack running.
- [ ] Dev login works; session persists after quitting and relaunching.
- [ ] Planning (board, list, calendar), Knowledge (Tiptap doc and database table), and Execution all work.
- [ ] Agent widget streaming works (`credentials: "include"` fetch).
- [ ] With the stack stopped, the window shows the stack-down screen and Retry recovers once started.
- [ ] External `https:` links open in the system browser; the window cannot navigate to other origins.
- [ ] Second launch focuses the existing window.
- [ ] Bounds restored on relaunch.

## Phase 2 (after v0)

- `todex://` protocol for the Cursor / Claude task handoff (see mcp-server-mvp.md).
- Tray icon and global quick-capture shortcut.
- Optional: spawn the web dev server from main so only `docker:up` and the API are needed.

## When to revisit

Once a hosted deployment exists, either point `TODEX_WEB_URL` at the hosted app (still no web changes) or move to a static export. The latter needs `generateStaticParams` for the dynamic routes, removal of `next.config.ts` `redirects()`, API CORS / `trustedOrigins` for the app origin, and a token or deep-link auth flow.

## Open questions

- Does the agent widget's streaming behave the same in Electron's Chromium? (Expected yes; verify in acceptance.)
- Should main spawn `next dev` itself in phase 2, or stay a pure client?
