---
paths:
  - "packages/typescript-config/**"
---

# @repo/typescript-config

Configs: `base.json`, `nextjs.json`, `react-library.json`, `nestjs.json`. Apps extend one via `"extends": "@repo/typescript-config/<name>.json"`.

- `base.json` is strict: `strict`, `noUncheckedIndexedAccess`, `isolatedModules`, NodeNext modules, ES2022.
- `nextjs.json` / `react-library.json`: Bundler resolution, `jsx` set, no emit for Next.
- `nestjs.json` is deliberately **looser**: `strictNullChecks: false`, `noImplicitAny: false`, decorators on. Don't tighten it without migrating every Nest app.
- Keep `base.json` minimal; put framework-specific options in the framework config.
- Don't disable a strict flag in `base.json` to make one app compile; override in that app's `tsconfig.json`.
