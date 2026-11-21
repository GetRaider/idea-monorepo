---
name: review-changes
description: Independently review a Git diff or PR against requirements for correctness, regressions, security and maintainability. Use for significant changes, ideally from a separate session or subagent, or when the user asks for a review.
disable-model-invocation: true
---
# Independent review (read-only)

1. Read the actual diff against the stated base (usually `main`), acceptance criteria, relevant code and tests. Do not modify files or claim to be independent when reviewing your own changes in the same conversation.
2. Prioritize correctness, state/async races, data integrity, auth/permissions, input validation, error paths, backward compatibility and missing behavioral tests. Review architectural choices only where they create actual risk.
3. Report actionable findings with exact file and line, scenario, why it matters, and suggested direction.
4. Severity: **blocker** (must fix before merge), **should-fix** (meaningful risk), **nit** (optional). Do not pad a report with hypothetical issues.
5. If no material findings, say so and state the review's limitations. Do not treat passing tests as proof of correctness.
