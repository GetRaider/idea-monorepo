---
name: scaffold-nestjs-resource
description: Add a resource, endpoint or module in any NestJS app in this monorepo. Use for new NestJS API capabilities; discover the target app and its conventions first.
---
# NestJS resource

- Determine target app from the request and inspect a nearby working module/controller/service; do not assume `devinity-api`.
- Follow that app's DI tokens, database schema/Drizzle conventions, validation strategy (Zod or class-validator), auth guards and error mapping.
- Put business logic in services and keep controllers thin. Avoid introducing an alternative HTTP/DTO framework for the same boundary.
- Shared contracts only go to a workspace package if consumers actually require sharing; respect export boundaries.
- Consider migrations, idempotency, rollback and permissions for mutating operations.
- Add behavior and API contract tests using existing Vitest/Supertest patterns, then run affected verification, plus E2E where supported.
