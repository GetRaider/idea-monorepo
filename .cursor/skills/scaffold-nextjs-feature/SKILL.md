---
name: scaffold-nextjs-feature
description: Scaffold a new page, API route, controller, and client service in apps/devinity-web or apps/take-and-do, wiring @repo/ui components. Use when adding a Next.js feature, route, page, or full-stack endpoint to devinity-web or take-and-do.
---

# Scaffold Next.js Feature

## Choose app

| App | Pattern |
|-----|---------|
| **devinity-web** | Pages in `src/app/`, hooks in `src/hooks/`, optional `src/app/api/` routes |
| **take-and-do** | Full-stack: page + `app/api/` route + controller + api service + client service + Zod DTOs |

## devinity-web (frontend-focused)

1. **Page**: `src/app/<route>/page.tsx` + `page.styles.tsx`
2. **Components**: `src/app/components/` (page-scoped) or `src/components/` (shared)
3. **Data**: React Query hook in `src/hooks/<domain>/`
4. **API route** (if needed): `src/app/api/<resource>/route.ts`
5. **UI**: import from `@repo/ui`
6. **Auth**: wrap with `AuthGuard` where required

## take-and-do (full-stack)

Follow the focus/tasks pattern:

### 1. Zod DTOs

`src/db/dtos/<resource>.dto.ts` — export schemas used by controller.

Barrel-export in `src/db/dtos/index.ts`.

### 2. API service

`src/server/services/api/<resource>.api.service.ts` — Drizzle/DB logic.

Register in `src/server/services/api/index.ts`.

### 3. Controller

`src/server/controllers/<resource>.controller.ts` — extend `BaseController`:

```typescript
export class ExampleController extends BaseController {
  getAll = this.initRoute({
    responseDto: ExampleResponseDto,
    handler: async () => { /* ... */ },
  });
}
```

Export from `src/server/controllers/index.ts`.

### 4. Route handler

`src/app/api/<resource>/route.ts`:

```typescript
import { ExampleController } from "@/server/controllers";
const controller = new ExampleController();
export const GET = controller.getAll;
```

Add route constant in `src/constants/route.constant.ts` if used client-side.

### 5. Client service

`src/services/<resource>.client.service.ts` — typed `fetch` to `/api/...`.

Export from `src/services/index.ts`.

### 6. Page / UI

- Page: `src/app/<feature>/page.tsx`
- Components + `*.styles.tsx` (no inline styles)
- Hooks: `src/hooks/<feature>/`

### 7. DB migration (if schema changed)

```bash
cd apps/take-and-do && pnpm db:generate
```

## Verify

```bash
# take-and-do
cd apps/take-and-do && pnpm lint && pnpm typecheck && pnpm test

# devinity-web
cd apps/devinity-web && pnpm lint && pnpm test
```

## Constraints

- `lib/` is framework plumbing only — no domain logic
- Auth in take-and-do: `requireNonAnonymous` + `getAccessByAuth`
- Reuse `@repo/ui` before creating local primitives
