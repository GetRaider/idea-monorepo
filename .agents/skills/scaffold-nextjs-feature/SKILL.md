---
name: scaffold-nextjs-feature
description: Add or extend a Next.js route, UI feature or full-stack endpoint in any monorepo Next.js app using its existing patterns.
---
# Next.js feature

- Identify the target application and inspect comparable routes, components, hooks and API handlers before editing; do not assume Devinity or Take&Do.
- Prefer server components where consistent with the target app; use client components for interactions. Respect existing data-fetching, query caching, authentication and validation approaches.
- Reuse local components and `@repo/ui` primitives where appropriate. Use Tailwind and existing component patterns without forcing a styling migration outside scope.
- For API changes, trace client, DTO, service and persistence consumers; handle permissions, errors and loading/empty states.
- Add focused behavioral tests and E2E for critical flows when a configured runner is available.
- Run affected verification and optionally a build and browser check.
