---
name: test-changes
description: Design and implement risk-based tests for changed TypeScript, React, NestJS or integration behavior using existing Vitest and Playwright conventions. Use when tests are requested or meaningful regression coverage is needed.
---
# Test changed behavior

- Trace the behavior and affected boundaries first; inspect existing tests and fixtures to avoid duplication.
- Choose the smallest trustworthy test layer: unit for pure logic, integration for API/data contracts, E2E for critical user flows where an E2E harness exists.
- Cover core path, relevant errors, authorization, data integrity, and realistic edge cases. Prioritize observable outcomes over implementation details, snapshots of Tailwind classes, or artificial coverage.
- Use the application's existing Vitest configuration and Playwright only where actually configured.
- Execute focused tests, fix test assumptions or implementation defects as appropriate, then run affected verification.
- Report added/updated tests and precisely which commands passed or were blocked. Never modify production behavior solely to make a flawed test pass.
