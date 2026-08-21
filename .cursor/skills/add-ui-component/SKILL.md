---
name: add-ui-component
description: Add a new React component to packages/ui with Tailwind + Radix (shadcn pattern), barrel exports, and optional tests. Use when creating a shared UI component, button, dialog, or primitive for @repo/ui consumed by Next.js or Electron apps.
---

# Add UI Component

## Location

`packages/ui/src/components/<ComponentName>/`

| File | Required |
|------|----------|
| `<ComponentName>.tsx` | Yes — named export |
| `index.ts` | Yes — re-export component |

Optional: `pnpm generate:component` in `packages/ui` (turbo gen) as a starting point — rewrite generated styled-components to Tailwind if the generator is still legacy.

Do **not** add `*.styles.tsx` or `styled-components`.

## Component pattern

shadcn: Radix primitive (when needed) + Tailwind + `cva` + `cn()`.

```typescript
"use client";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        solid: "bg-primary text-primary-foreground",
        ghost: "hover:bg-muted",
      },
    },
    defaultVariants: { variant: "solid" },
  },
);

export function ComponentName({ className, variant, ...props }: ComponentNameProps) {
  return (
    <button className={cn(buttonVariants({ variant }), className)} {...props} />
  );
}

interface ComponentNameProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}
```

- Named exports only (no anonymous default)
- Wrap `@radix-ui/react-*` primitives, not `@radix-ui/themes`
- Props interface at end of file
- `"use client"` for interactive components

## Styles

- Tailwind on the JSX; variants via `cva`
- Merge with `cn()` from `src/lib/cn.ts`
- No inline `style={{}}` except runtime CSS variables
- Forward `className`

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
- No styled-components
- Keep components composable and accessible
