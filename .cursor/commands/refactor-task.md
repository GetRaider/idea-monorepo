Refactor existing code without changing behavior.

---

## Baseline requirement

- Ensure current behavior is understood and stable before changes (tests define baseline)

---

## Strict constraints

- NO changes in external behavior (inputs, outputs, side effects, public interfaces)
- NO renaming of externally visible APIs unless explicitly requested
- NO structural changes outside the minimal necessary scope
- If a test must change, this indicates behavior change → stop and report

---

## Rules

- Keep diff minimal
- Avoid unnecessary reorganization
- Do not introduce new abstractions unless explicitly required for correctness or clarity
- Preserve all existing contracts

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

- run project quality checks (lint/typecheck equivalents)
- run full test suite

---

## Output

1. Refactor scope
2. Risk areas
3. Step-by-step change plan

# Task:
