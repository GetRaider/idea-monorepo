---
name: add-monorepo-package
description: Add a reusable pnpm workspace package in packages/ with exports, TypeScript configuration and checks; use when code genuinely needs cross-app sharing.
---
# Add a workspace package

- First establish whether an existing `@repo/*` package is the right home; do not create one for a single consumer without a concrete reason.
- Inspect `pnpm-workspace.yaml`, `turbo.json`, and a similar current package for scripts, package exports, module format and tsconfig.
- Create the package with only necessary files and correct `workspace:*` consumer dependencies. `packages/*` is already included in pnpm workspace patterns.
- Export public modules through package exports, not relative imports from other package source directories.
- Add meaningful tests for domain logic and update any relevant consumers.
- Run `pnpm install` only when dependency resolution changes. Verify affected build and checks via `pnpm verify:affected --build`.
