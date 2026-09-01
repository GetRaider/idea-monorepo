# Todex (TDX)

Unified AI context for Tasks, Calendar, and Docs. Successor to Take & Do. **v0:** local Docker (Postgres only), Google auth, empty `/overview`, live **Tasks list**. Calendar / Docs / GCal / guests / mentions / labels / Redis / Kanban / AI later.

| Field   | Value                                                    |
| ------- | -------------------------------------------------------- |
| Status  | Draft                                                    |
| Scope   | **TDX** (register in commitlint/branchlint when wiring)  |
| Apps    | `apps/todex-api`, `apps/todex-web` (+ `@repo/api/todex`) |
| Created | 2026-08-31                                               |

**Diagram:** [todex-architecture-v1.excalidraw](./todex-architecture-v1.excalidraw)

| Doc                                  | Contents                                                                     |
| ------------------------------------ | ---------------------------------------------------------------------------- |
| [prd.md](./prd.md)                   | v0 slice, goals, build order                                                 |
| [architecture.md](./architecture.md) | Split, Zod `@repo/api/todex`, Docker Postgres, deferred Redis/guests/GCal/AI |
| [impl-plan-v0.md](./impl-plan-v0.md) | Phased implementation plan + acceptance checklist                            |
| [data-model.md](./data-model.md)     | v0 entities vs later                                                         |
| [flows.md](./flows.md)               | Auth + Tasks CRUD now; rest later                                            |
