# Todex — PRD (v0)

| Field   | Value      |
| ------- | ---------- |
| Status  | Draft      |
| Scope   | TDX        |
| Created | 2026-08-31 |

## Summary

Unified AI context for Tasks, Calendar, and Docs. Todex replaces Take & Do with a Nest API + Next web client, workspace tenancy, and shared Zod DTOs. **v0 ships Overview (empty) + Tasks list**, local Docker Postgres, Google auth. Calendar, Docs, GCal, guests, mentions, labels, Redis, and AI features come later — the mention graph is the substrate for that context.

## Problem

Take & Do is a Next fullstack app with `userId` tenancy, anonymous auth, and no docs/mention graph. Todex rewrites the split and tenancy first.

## Goals (product)

1. Individuals (later teams) manage tasks — then calendars and docs.
2. Google auth; workspace tenancy.
3. Shared Zod wire (`@repo/api/todex`); local Docker Postgres.
4. Task estimates in **days** (`estimationDays`).
5. Later: bidirectional Google Calendar, guests, EntityLink / unified AI context.

## v0 scope (what we build now)

**In**

- Register `todex-api` / `todex-web` in pnpm-workspace + turbo + `dev:todex`
- Docker Compose: Postgres only (local; no Redis, no cloud DB, no AI containers)
- `@repo/api/todex` Zod; Next **15** (catalog), Nest **11**
- Google auth — **dev signup on** (self-register); **prod `disableSignUp`**; identity scopes only
- Workspace on first signup; tenancy via sole membership (no `X-Workspace-Id`)
- `/overview` empty; home after login
- `/tasks` live **list** (folders, boards, tasks; `T-{n}` keys; plain description; deeper subtask trees)
- shadcn via `@repo/ui` (no Radix Themes)
- Calendar / Docs **disabled in sidebar**
- Git scope **TDX**

**Out of v0**

- Redis / in-memory cache
- Labels / TaskLabel
- Kanban (list only in v0)
- `X-Workspace-Id` (multi-workspace later)
- Guests / IndexedDB / import (incl. merge policy — decide later)
- Google Calendar (later bidirectional); no calendar OAuth scopes
- Docs CRUD, EntityLink / mentions
- TipTap task descriptions (v0.1)
- Focus, voice, LLM in Docker, LaunchDarkly
- Next BFF, anonymous, email/password
- `class-validator` for Todex DTOs
- Next 16 / Nest 12 / `nestjs-zod`

## Functional requirements

### v0

1. B2C; workspace + `WorkspaceMember`.
2. Pages: `/overview` (empty), `/tasks` (live). Calendar/Docs in nav but disabled.
3. CRUD Tasks (incl. folders/boards, deeper `parentTaskId` trees). List view only.
4. Task `description` = plain string; `estimationDays`; `taskKey` = `T-{n}` (workspace counter, stable).

### Later

5. CRUD Calendar (`common` / `timeBlock`) + task overlay; `scheduleEnd` TBD.
6. CRUD Docs; mentions / EntityLink.
7. Bidirectional Google Calendar sync (registered).
8. Guests: local Tasks/Docs/calendar in IndexedDB; no GCal; no `/v1`.
9. from-text parser; AI context over EntityLink.

## Non-functional

| Axis                              | Target                                                |
| --------------------------------- | ----------------------------------------------------- |
| Consistency                       | Strong for Tasks CRUD                                 |
| Traffic / latency / region / cost | As before (~100–300 RPS, p95 ≤ 200ms CRUD, EU, cheap) |
| Local dev                         | Docker Compose mandatory                              |

## Edge cases (later phases)

1. GCal dual-write → etag LWW (when GCal ships).
2. Mention target deleted → drop EntityLink (when mentions ship).
3. Guest wipe / import merge (when guests ship).

## Build order

See [impl-plan-v0.md](./impl-plan-v0.md) for the phased plan.

1. Monorepo wire + Docker Compose
2. `@repo/api/todex` + Drizzle
3. Auth + Workspace
4. `/overview` + shell (Calendar/Docs disabled in sidebar)
5. Tasks API + Tasks UI
6. _(later)_ Calendar → bidirectional GCal → Docs → Links → guests
