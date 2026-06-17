Modify existing behavior of the system.

This is NOT a bug fix and NOT a refactor.

---

## Pre-change analysis (mandatory)

Before making any change:
- Identify all consumers of the current behavior across the entire workspace:
  - internal usage
  - cross-module dependencies
  - tests
  - shared/public interfaces
- Understand how the change propagates through the system

---

## Change rules

- Preserve backward compatibility unless explicitly instructed otherwise
- If shared or reusable logic is affected:
  - identify all dependents and usage points
- Update existing tests to reflect new behavior instead of layering contradictory tests
- Keep changes aligned with existing architectural patterns

---

## Boundaries

- Do NOT fix unrelated issues discovered during implementation
- Do NOT perform refactors outside the scope of the change
- Report additional issues separately if found

---

## Execution step

After changes:
- run project quality checks (lint/typecheck equivalents)
- run full test suite
- resolve failures before completion

---

## Optional context

A PRD (Product Requirements Document) may be provided.

If present:
- Treat it as the primary source of intent and constraints
- Resolve ambiguities using the PRD before making assumptions
- Ensure implementation aligns with described user value and requirements

If not present:
- Infer intent from description and existing system behavior

---

## Output

1. Impact analysis across system
2. Description of change
3. Affected consumers
4. Execution steps

# Task:
