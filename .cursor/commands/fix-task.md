Fix a bug with minimal, targeted change.

---

## Required first step

- Reproduce the bug using:
  - existing tests OR
  - a newly created failing test that captures the issue accurately OR
  - a clear manual/browser reproduction when the bug is purely presentational (layout, CSS, spacing) and there is no meaningful unit-test surface

Do NOT proceed without reproduction.

---

## Fix rules

- Make the smallest possible change that fixes the root cause
- Do NOT expand scope beyond the reported issue
- Do NOT fix unrelated problems discovered during debugging
- If additional issues are found → document them separately
- **Do not extract helpers** (layout/class-name modules, one-off `getXClassName` functions) unless there is real variability, reuse across multiple call sites, or non-trivial logic worth testing — inline Tailwind/classes in the component for one-off fixes
- **Do not add tests** whose only purpose is to lock Tailwind strings on a layout helper; test behavior, pure logic, or config that has a real contract (e.g. Tailwind `content` paths, derived state)

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

## Verification

After applying the fix:

- run full test suite
- run project quality checks (lint/typecheck equivalents)
- confirm original failing case is resolved (test or manual repro)

---

## Output

1. Root cause
2. Reproduction method
3. Fix strategy
4. Risk notes

# Task:
