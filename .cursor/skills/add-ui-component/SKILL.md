---
name: add-ui-component
description: Add a new React component to packages/ui with ComponentName.component.tsx, styles file, barrel exports, and optional tests. Use when creating a shared UI component, button, dialog, or primitive for @repo/ui consumed by Next.js apps.
---

# Add UI Component

## Location

`packages/ui/src/components/<ComponentName>/`

| File | Required |
|------|----------|
| `<ComponentName>.component.tsx` | Yes — named export |
| `<ComponentName>.styles.tsx` | Yes if custom styling beyond Radix |
| `index.ts` | Yes — re-export component |

Optional: use `pnpm generate:component` in `packages/ui` (turbo gen) as starting point.

## Component pattern

```typescript
"use client";

import { ReactNode } from "react";
import { Button as ButtonRadix } from "@radix-ui/themes";

interface ComponentNameProps {
  children: ReactNode;
}

export const ComponentName = ({ children }: ComponentNameProps) => (
  <ButtonRadix>{children}</ButtonRadix>
);
```

- Named exports only (no anonymous default)
- Wrap `@radix-ui/themes` primitives
- Props interface at end of file (repo convention)
- `"use client"` for interactive components

## Styles

- `styled-components` in separate `.styles.tsx`
- Transient props: `$prefix` for non-DOM props
- Tailwind utilities via `cn()` from `src/lib/cn.ts` where appropriate

## Exports

1. `packages/ui/src/components/<ComponentName>/index.ts`
2. Add to `packages/ui/src/index.ts` barrel
3. `package.json` exports already map `./components/*` → `./src/components/*/index.ts`

## Consumption

```typescript
import { ComponentName } from "@repo/ui";
// or
import { ComponentName } from "@repo/ui/components/ComponentName";
```

## Tests

`@repo/ui` has no test script today. If adding tests:

- Add vitest config mirroring `@repo/shared`
- Co-locate `*.test.tsx` with component
- Use `@testing-library/react` + jsdom

## Verify

```bash
cd packages/ui && pnpm lint && pnpm build
```

Rebuild is required before apps pick up types — root dev filters include `@repo/ui` with watch.

## Constraints

- No business logic or app-specific domain types
- No inline styles
- Keep components composable and accessible
