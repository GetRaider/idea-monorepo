Generate a Git branch name for the user's task.

Read `.husky/pre-commit`, `.husky/pre-push`, and `.cursor/rules/git-conventions.mdc` for current branch constraints and scopes. Use the relevant type and scope, and a short descriptive slug.

Return **only** a valid branch name. Do not create or check out a branch.
