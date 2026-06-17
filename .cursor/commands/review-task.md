Review code or changes for correctness, safety, and maintainability.

---

## Review order (mandatory)

1. Correctness
   - logic validity
   - edge cases
   - error handling

2. Security
   - input validation at boundaries
   - authentication/authorization concerns
   - sensitive data handling

3. Test coverage
   - coverage of new and changed behavior
   - missing edge cases
   - regression risk

4. Conventions
   - type safety (no implicit weak typing)
   - linting/formatting compliance
   - architectural boundaries respected
   - no cross-boundary imports

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

## Rules

- Assign severity to each issue:
  - blocker
  - should-fix
  - nit
- Do NOT rewrite code unless explicitly requested
- Provide reasoning for all findings

---

## Output

1. Findings grouped by category
2. Severity per issue
3. Recommended fixes (without implementation unless asked)

# Task:
