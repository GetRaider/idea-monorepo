Design and implement tests for system behavior.

---

## Goal

Ensure meaningful behavior is properly covered by automated tests.

---

## Pre-analysis (mandatory)

- Identify required test coverage across the entire workspace
- Detect missing coverage areas and edge cases
- Understand existing test patterns and conventions
- Focus on behavior, not implementation

---

## Test rules

- Prefer testing observable behavior over internal implementation
- Reuse existing testing patterns and utilities
- Avoid duplicating existing coverage
- Focus on:
  - core logic paths
  - edge cases
  - integration boundaries
  - user-facing behavior when applicable

---

## Constraints

- Do NOT modify production code unless absolutely required to enable correct testing
- Do NOT over-test trivial logic
- Do NOT test implementation details

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

## Execution step

After implementing tests:
- run full test suite
- fix failures caused by incorrect test assumptions

---

## Output

1. Test coverage analysis
2. Test strategy
3. Files to create/modify
4. Edge cases covered

# Task:
