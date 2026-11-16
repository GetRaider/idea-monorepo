Generate a commit message from the staged diff (`git diff --cached`), or a change description if no staged diff was requested.

Read `commitlint.config.cjs` and `.cursor/rules/git-conventions.mdc` for the **current** allowed types, scopes, and limits. Choose the scope of the primary affected area; use GEN for genuinely cross-cutting changes.

Return **only** a compliant one-line header. Use an imperative subject. Do not execute `git commit`.
