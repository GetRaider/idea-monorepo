# Repo instructions

Always-on rules (shared with Cursor; source of truth is `.cursor/rules/`):

@.cursor/rules/smart.mdc
@.cursor/rules/git-conventions.mdc
@.cursor/rules/monorepo-architecture.mdc
@.cursor/rules/frontend-styling.mdc

Path-scoped rules live in `.claude/rules/` (generated from `.cursor/rules/*.mdc`; edit the `.cursor` copy and regenerate).
Skills: `.claude/skills` → `.agents/skills`. Commands: `.claude/commands` → `.cursor/commands`.

Commits: header only, no body and no footer (commitlint). Never add `Co-Authored-By` lines.
