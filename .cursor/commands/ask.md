**Answer a question — read-only clarification, no implementation.**

Use in **Ask Mode**. Do not edit, create, or delete files. Do not propose diffs or refactors unless I explicitly ask.

## Input

My question(s) — one or more things I want clarified about this repo, code, behavior, or design.

## Output

1. **Direct answer first** — the conclusion in the first sentence or two.
2. **Evidence** — only what supports the answer: file paths, code paths, config keys. Cite code when it helps.
3. **Caveats** — only if genuinely uncertain or the answer depends on context I didn't give.

No preamble. No recap of my question. No "great question". No filler, hedging, or motivational tone.

## Rules

- **No water** — every sentence must earn its place. If it doesn't add information, cut it.
- Verify against the actual codebase when the answer lives here — don't guess from memory.
- If you need to run a read-only command to be sure, do it; don't ask permission for harmless inspection.
- If the question is ambiguous, ask **one** sharp clarifying question — not a list of options unless tradeoffs are the point.
- If something looks broken while researching, mention it in one line at the end — don't fix it.

## Examples

**Q:** Where is task workspace view navigation handled?  
**A:** `useTasksWorkspaceViewNavigation` in `apps/take-and-do/src/hooks/tasks/` — consumed by `TasksLayout.tsx` to sync URL ↔ view state.

**Q:** Can I import from `apps/devinity-web` in take-and-do?  
**A:** No. Apps must not import other apps; use `@repo/*` packages instead (see `.cursor/rules/monorepo-architecture.mdc`).

---

# Question:
