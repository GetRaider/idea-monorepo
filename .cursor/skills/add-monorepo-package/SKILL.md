---
name: add-monorepo-package
description: Add a new workspace package under packages/ with package.json, tsconfig extending @repo/typescript-config, turbo pipeline task, and pnpm-workspace registration. Use when creating a new shared package, library, or @repo/* module in the monorepo.
---

# Add Monorepo Package

## Checklist

### 1. Directory

`packages/<name>/` with `src/index.ts` barrel.

### 2. package.json

Reference `packages/shared/package.json` or `packages/api/package.json`:

```json
{
  "name": "@repo/<name>",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "build": "tsc -b -v",
    "clean": "rm -rf dist && rm -rf .turbo",
    "clean:hard": "pnpm run clean && rm -rf node_modules",
    "lint": "eslint \"{src}/**/*.ts\""
  }
}
```

- Use `catalog:` for shared deps in `pnpm-workspace.yaml`
- `workspace:*` for `@repo/eslint-config`, `@repo/typescript-config`

### 3. tsconfig.json

- Library (no React): extend `@repo/typescript-config/nestjs.json` or `base.json`
- React library: extend `@repo/typescript-config/react-library.json` (see `packages/ui/tsconfig.json`)

Set `outDir: dist`, `rootDir: src`, `include: ["src/**/*.ts"]`.

### 4. ESLint

Copy `.eslintrc.js` from sibling package (e.g. `packages/shared/.eslintrc.js`).

### 5. pnpm-workspace.yaml

Already includes `packages/*` — no change unless using a non-standard path.

### 6. turbo.json

Default tasks (`build`, `lint`, `test`, `clean`) inherit from root `turbo.json` — no entry needed unless custom task.

Ensure `build.dependsOn: ["^build"]` applies via root config.

### 7. Wire consumers

Add `"@repo/<name>": "workspace:*"` to consuming app `package.json`.

Update root dev scripts if the package is required for a dev filter (see `dev:take-and-do` pattern).

### 8. Verify

```bash
pnpm install
pnpm build --filter=@repo/<name>
pnpm lint --filter=@repo/<name>
```

## Package types in this repo

| Type | Example | tsconfig |
|------|---------|----------|
| TS utilities | `@repo/shared` | nestjs.json |
| API models/helpers | `@repo/api` | custom + ESM |
| React components | `@repo/ui` | react-library.json |
| Config only | `@repo/eslint-config` | n/a |

Do not add packages under `apps/` — shared code belongs in `packages/`.
