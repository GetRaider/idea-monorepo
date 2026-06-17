Create a new feature, module, or capability.

---

## Pre-check (mandatory)

Before writing anything new:
- Search the entire workspace for existing implementations, utilities, components, services, or modules that may already solve part or all of the requirement
- Prefer reuse over creation
- Do NOT assume something does not exist without checking first

---

## Architecture rules

Follow existing project structure and conventions:

- Match the established structure for backend modules (controllers/services/DTOs or equivalents)
- Match the established structure for frontend routes/components and UI composition
- Reuse shared utilities, components, or domain logic whenever they already exist
- Place shared logic in shared/common/reusable modules if it is used in more than one place
- Do NOT duplicate logic across different parts of the system
- Do NOT import directly across unrelated applications or top-level boundaries

---

## Quality rules

- Strict typing (no implicit any or weak types)
- Validate external inputs at system boundaries
- Add tests alongside implementation:
  - unit/integration tests for logic
  - end-to-end tests for user-facing behavior when applicable

---

## Execution step

When finished:
- run project quality checks (lint/typecheck equivalents)
- run full test suite
- fix all failures before completion

---

## Optional context

A PRD (Product Requirements Document) may be provided.

If present:

- Treat it as the primary source of intent and constraints

- Ensure all implementation decisions align with PRD requirements

- Resolve ambiguity using PRD before inspecting code or making assumptions

If not present:

- Infer intent from description and existing system structure

---

## Output

1. Short implementation plan
2. Files/modules impacted
3. Execution steps

No full implementation unless explicitly requested.

# Task:
