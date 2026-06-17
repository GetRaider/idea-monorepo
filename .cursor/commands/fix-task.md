Fix a bug with minimal, targeted change.

---

## Required first step

- Reproduce the bug using:
  - existing tests OR
  - a newly created failing test that captures the issue accurately

Do NOT proceed without reproduction.

---

## Fix rules

- Make the smallest possible change that fixes the root cause
- Do NOT expand scope beyond the reported issue
- Do NOT fix unrelated problems discovered during debugging
- If additional issues are found → document them separately

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
- confirm original failing case is resolved

---

## Output

1. Root cause
2. Reproduction method
3. Fix strategy
4. Risk notes

# Task:
