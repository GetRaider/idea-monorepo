---
name: create-command
description: Creates a new Cursor slash command in .cursor/commands/ as a short saved prompt for explicit /name invocation. Use when the user wants a new command, slash command, saved prompt, or to add something under .cursor/commands/.
---

# Create Command

Create **slash commands** — one-shot prompts the user triggers with `/name`. Not skills, not rules.

## Command vs skill vs rule

| Mechanism | Path | Use when |
|-----------|------|----------|
| **Command** | `.cursor/commands/<name>.md` | User fires manually; single focused output; no multi-step workflow |
| **Skill** | `.cursor/skills/<name>/SKILL.md` | Agent discovers and runs a multi-step procedure (scaffold, pre-PR, release) |
| **Rule** | `.cursor/rules/<name>.mdc` | Passive standards auto-attached by glob or always-on |

If the request needs git diff analysis, file scaffolding, or running checks → **skill**, not command.  
If it's "given X, output Y" on demand → **command**.

## Gather requirements

Before writing, confirm:

1. **Name** — kebab-case, becomes `/name` (e.g. `commit-msg` → `/commit-msg`)
2. **Trigger phrase** — what the user types after invoking the command
3. **Input** — what the user provides (description, diff, nothing)
4. **Output** — exact format (only branch name? markdown template? single line?)
5. **Constraints** — repo rules to embed (git conventions, scopes, max lengths)
6. **Read-only vs agent actions** — may the agent run git/shell, or output only?

Infer from conversation when possible; ask only for gaps.

## File location

```
.cursor/commands/<name>.md
```

- Project scope only (checked into repo)
- Filename = slash command name (no spaces, lowercase, hyphens)
- No YAML frontmatter on command files
- Do not create commands in `~/.cursor/skills-cursor/`

## Command template

Match existing repo commands (`new-branch`, `commit-msg`, `pr-description`):

```markdown
<One-line purpose — imperative, what happens when invoked.>

## Input

<What the user provides, or what the agent should read (e.g. git diff).>

## Output

<Exact deliverable — "only X, no explanation unless asked".>

## Rules

<Constraints, formats, max lengths — pull from .cursor/rules/ when relevant.>

## Examples

<1–3 concrete input → output pairs if format is non-obvious>
```

### Section guidelines

- **Opening line** — bold the action; no fluff
- **Input** — optional; omit if command is self-contained (e.g. "use current diff")
- **Output** — be strict ("single line", "markdown only", "no preamble")
- **Rules** — link to source of truth (e.g. `commitlint.config.cjs`, `.cursor/rules/git-conventions.mdc`)
- **Steps** — use instead of Rules when the agent must run commands first (see `pr-description.md`)
- Keep under ~50 lines; commands are prompts, not manuals

## Repo conventions to reuse

When the command touches git:

- Branch: `<type>/<SCOPE>-<slug>`, max **50** chars — see `.cursor/rules/git-conventions.mdc`
- Commit: `<type>(<SCOPE>): <subject>`, max **70** chars, no body/footer
- Scopes: `GEN`, `TAD`, `DVN`, `PRT`

Do not duplicate full rule files — reference them and include only what the command needs at invoke time.

## Workflow

```
- [ ] Confirm command (not skill/rule) is correct
- [ ] Pick unique kebab-case name; check .cursor/commands/ for collision
- [ ] Draft markdown following template
- [ ] Write .cursor/commands/<name>.md
- [ ] Tell user: invoke with /<name>
```

## Anti-patterns

- Multi-phase workflows (scaffold → lint → test) — use a skill
- Passive "always follow X" standards — use a rule with globs
- Duplicating an existing command — extend or replace instead
- Vague output ("help me with commits") — specify exact format
- Application code changes — commands live only under `.cursor/`

## Examples in this repo

| Command | Pattern |
|---------|---------|
| `new-branch.md` | Input description → single-line output, embedded git rules |
| `commit-msg.md` | Input summary → single-line output, commitlint rules |
| `pr-description.md` | Agent runs git → structured markdown template |

## After creation

Report to the user:

- File path created
- Slash invocation: `/<name>`
- One-line example of how to use it
