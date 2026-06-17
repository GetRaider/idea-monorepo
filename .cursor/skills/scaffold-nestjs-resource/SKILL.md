---
name: scaffold-nestjs-resource
description: Scaffold a new NestJS feature module with controller, service, DTOs, and Vitest tests in apps/devinity-api or shared DTOs/models in packages/api. Use when adding a NestJS resource, REST endpoint module, or shared API model/DTO to devinity-api or @repo/api.
---

# Scaffold NestJS Resource

## When to use

- New REST resource in `apps/devinity-api`
- New shared model/DTO in `packages/api` (consumed by devinity-api + frontends)

## devinity-api module

### 1. Create feature folder

`apps/devinity-api/src/modules/<resource>/`

| File | Purpose |
|------|---------|
| `<resource>.module.ts` | Nest `@Module` — controllers, providers, exports |
| `<resource>.controller.ts` | HTTP only — delegate to service |
| `<resource>.service.ts` | Business logic, Drizzle, cache |

Reference: `src/modules/user/` (user.module, user.controller, user.service).

### 2. Register module

Add import to `src/modules/app.module.ts`.

### 3. Database (if needed)

- Schema in `src/db/` (Drizzle)
- Inject `@Inject(DRIZZLE_DB)` in service
- Run `pnpm db:generate` / `db:migrate` from devinity-api

### 4. DTOs

- App-local: feature folder or `src/db/`
- Cross-app shared: `packages/api/src/` — class-validator DTOs, models in `models/`, barrel `src/index.ts`

### 5. Tests

- Unit: `*.test.ts` next to service or under `test/`
- E2e: `test/<resource>.e2e-spec.ts` — Vitest + `@nestjs/testing` + supertest (see `test/app.e2e-spec.ts`)

### 6. Verify

```bash
cd apps/devinity-api && pnpm lint && pnpm test
```

## @repo/api addition

1. Add model/DTO under `packages/api/src/models/` or `src/links/dto/`
2. Export from `packages/api/src/index.ts`
3. Rebuild: `pnpm build --filter=@repo/api`
4. Import in devinity-api: `import { ... } from '@repo/api'`

## Constraints

- Follow existing `UserModule` patterns — no new frameworks
- External HTTP: `httpClient` from `@repo/api/helpers`
- Vitest only — not Jest
