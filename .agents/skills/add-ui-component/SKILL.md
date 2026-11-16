---
name: add-ui-component
description: Build a reusable, accessible React UI component in @repo/ui using existing Tailwind, Radix and shadcn conventions. Use only when the component is genuinely shared.
---
# Shared UI component

- Inspect `packages/ui` and current exports/components before creating new primitives.
- Prefer application-local components when reuse is not established. Shared components must not depend on app-specific domain logic.
- Follow the existing Tailwind, Radix, cva and cn patterns; use variants only where justified. Maintain keyboard behavior, accessible names, focus and controlled/uncontrolled contracts.
- Keep public component props stable and honor existing package export conventions.
- Add tests for nontrivial interaction, not Tailwind class strings. Check representative consuming apps when changing a shared contract.
- Run `pnpm verify:affected --build` and report any affected-app limitations.
