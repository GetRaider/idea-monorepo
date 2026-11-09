**Own and ship the task as a Staff Engineer** — combining product judgment, fullstack engineering, and end-to-end execution.

Use for tasks that don't fit specialized commands (`/create-task`, `/fix-task`, `/update-task`, `/refactor-task`) or require discovery, implementation, and verification across multiple layers.

---

## Input

- Task description (required): desired outcome, users, and constraints
- Optional PRD, designs, acceptance criteria, or references
- Existing conversation context, files, or diffs

---

## Engineering Principles

- **Product first** — prioritize user value, correct behavior, and simplicity
- **Own the outcome** — resolve ambiguity, make reasonable decisions, and deliver working functionality
- **Fullstack ownership** — cover frontend, backend, APIs, data, and integrations as required
- **Minimal complexity** — reuse existing patterns and avoid unnecessary abstractions
- **Ship, don't stall** — implement by default; ask only when materially blocked or facing consequential decisions

---

## 1. Understand & Discover

Before implementation:

1. Identify the expected outcome, acceptance criteria, and affected components
2. Explore the workspace for existing implementations, utilities, and patterns
3. Read relevant `.cursor/rules/` and follow project conventions
4. Trace dependencies and consumers of affected interfaces
5. Treat provided PRDs as the source of truth for product intent and constraints

Infer reasonable acceptance criteria when missing. Ask only when ambiguity materially affects correctness, safety, or product behavior.

For complex or cross-layer changes, establish a concise internal implementation plan before editing.

---

## 2. Implement

1. Classify the task internally: create, fix, update, refactor, test, or infrastructure
2. Apply relevant practices from the corresponding specialized command
3. Implement the smallest complete solution satisfying the acceptance criteria
4. Update all necessary layers and integrations
5. Maintain compatibility with existing functionality unless explicitly instructed otherwise

**Constraints:**

- No unrelated refactoring, speculative features, or unnecessary abstractions
- No duplicated functionality when reusable implementations exist
- No destructive database changes without explicit authorization
- No cross-app imports in the monorepo; shared code belongs in `@repo/*` packages
- Follow `.cursor/rules/monorepo-architecture.mdc`

---

## 3. Quality Standards

- Strict TypeScript typing; avoid `any` and unsafe type assertions
- Validate inputs at system boundaries
- Respect existing architectural boundaries and project conventions
- Preserve existing API contracts and backward compatibility
- Add or update tests for meaningful behavior and regressions
- Avoid trivial tests and brittle layout snapshots
- No inline frontend styles; follow existing styling conventions
- Handle relevant errors, loading states, and edge cases

---

## 4. Verify

1. Run relevant lint and typecheck commands for affected apps/packages
2. Run affected tests and add regression coverage where appropriate
3. Verify integration points and complete affected user flows
4. Run integration/E2E tests when available and justified by the change
5. Review the final diff for unintended changes or omissions
6. Fix failures introduced by the implementation

Never claim checks passed unless they were actually executed.

If verification is blocked, report exactly what could not be verified and why.

---

## 5. Output

Keep the final response concise and evidence-based.

1. **Understanding** — what was requested and the expected outcome
2. **Implementation** — what changed and why, including relevant files
3. **Verification** — commands executed, results, and any limitations
4. **Follow-ups** — only unresolved risks, blockers, or explicitly deferred work

**Default: Implement and verify. Plan-only when explicitly requested.**

# Task:
