# Create or refine a product requirements document (read-only for application code)

Understand the problem, users, intended outcome, scope, and relevant existing implementation. Use provided requirements and designs; do not invent features or achievements.

- Ask targeted questions only for high-impact missing product decisions. For non-blocking uncertainty, state assumptions and record open questions; don't force an exhaustive interview before writing.
- Record goals and non-goals, user journeys, behavior/permissions, empty/loading/error states, and **testable** acceptance criteria.
- Include technical constraints and affected architecture only when known from the repo or explicitly required. Do not pre-decide implementation details without evidence.
- Identify dependencies, risks, success criteria, and unresolved decisions.
- Save to `docs/prd/` in a relevant existing project subfolder, otherwise `docs/prd/GEN/`; use a concise kebab-case filename. Do not modify application code.
- Reply with the saved path and the most consequential assumptions/open questions.

When refining an existing PRD, preserve valid decisions and update it rather than creating a duplicate.
