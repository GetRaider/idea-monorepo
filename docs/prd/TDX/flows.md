# Todex — Flows

| Field   | Value      |
| ------- | ---------- |
| Status  | Draft      |
| Scope   | TDX        |
| Created | 2026-08-31 |

## Auth (Google) — v0

1. Web: `authClient.signIn.social({ provider: "google" })` → API `/api/auth`.
2. Callback sets httpOnly cookie on API origin; redirect to `/overview`.
3. **Dev:** signup allowed → `Workspace` + owner `WorkspaceMember` (self-register for first users).
4. **Prod:** `disableSignUp` — existing users only.
5. Web: `getSession()` + credentials. Nest `AuthGuard` on `/v1`.

No guest import in v0. No GCal consent in v0.

## CRUD Tasks (v0)

1. Guard session.
2. Membership for `X-Workspace-Id`.
3. Mutate folders / boards / tasks in one Postgres transaction.
4. Bump `workspace.updatedAt`.

p95 ≤ 200ms on this path. Zod validate request/response via `@repo/api/todex`.

## Guests (later)

1. No session → IndexedDB. No `/v1`.
2. Local Tasks / Docs / calendar. GCal off.
3. Sign-in → import (merge policy TBD) → wipe local.

## Calendar grid (later)

Load events + `scheduleDate` overlay. Duration/`scheduleEnd` TBD. No persisted `type: "task"` events.

## Google Calendar sync (later)

**Bidirectional.** Registered only. Webhook + poll; etag LWW; unique `googleEventId`.

## Mentions (later)

EntityLink rewrite on save; peek + deep-links.
