**Generate a polished UI/product design image** from my wishes. Optional current-design screenshot as reference.

## Input

- **Wishes (required)** — what the new design should look/feel like: layout, hierarchy, density, color, typography, components, mood, viewport (desktop/mobile), what to keep vs change.
- **Current design (optional)** — attached screenshot(s), or file path(s) to existing mockups. Treat these as the baseline to redesign, not as decoration.

If wishes are missing or too vague to compose a concrete mock, ask once — then generate. Do not invent a product I did not describe.

## Steps

1. Infer viewport and `aspect_ratio`: desktop/app chrome → `16:9`; mobile/phone → `9:16`; square icon/card → `1:1`; tall marketing/hero → `3:4`; default `16:9`.
2. If a current design is attached or a path is given, pass it as `reference_image_paths`. Preserve information architecture, identifiable branding, and real copy when visible unless I asked to change them.
3. Infer **SCOPE** (`GEN`, `TAD`, `TDX`, `DVN`, `PRT`, `TMP`) from the product/app in the wishes or the focused file — see `.cursor/rules/git-conventions.mdc`.
4. Call `GenerateImage` (`cursor` namespace) once with a detailed `description`. Filename: `design-<kebab-slug>.png` (no directory — the tool writes to Cursor assets).
5. **Copy into this repo.** `GenerateImage` does not write to the workspace. `cp` the returned absolute path to:
   - the folder I named or have focused, if obvious (e.g. `docs/prd/TDX/`)
   - otherwise `docs/prd/<SCOPE>/design-<kebab-slug>.png`
   Create the directory if missing. Do not leave the only copy in `.cursor/projects/.../assets/`.
6. Do not implement app code. Do not paste the image as Markdown — the client renders it. Reply with the **repo-relative path**.

## Prompt quality

The `description` must read as a **high-fidelity product mock**, not a concept collage:

- Specific screen (e.g. tasks board, settings, landing hero) with real-looking UI chrome
- Clear layout: nav, main, panels, cards, tables, empty states as relevant
- Cohesive palette and type; generous spacing; shadcn/Radix-like modern SaaS unless I specified otherwise
- Match `.cursor/rules/frontend-styling.mdc` aesthetic when the target is this monorepo (Tailwind + shadcn, not Material or iOS-only)
- Legible placeholder copy; no garbled fake text; no watermarks, no extra frames around the mock
- Honor explicit wishes over defaults

## Output

The generated image, the **repo path** (e.g. `docs/prd/TDX/design-todex-tasks-premium-bw.png`), plus **2–4 sentences**: what changed vs the reference (or what was invented if greenfield), aspect ratio used, and any assumption you had to make.

## Examples

**Input:** attach board screenshot + "darker, denser kanban, sticky column headers, subtler tags"

**Action:** `GenerateImage` + `cp` → `docs/prd/TAD/design-kanban-dense-dark.png`

**Input:** "mobile onboarding for Tempo, 3 screens in one 9:16 mock, warm neutrals, no screenshot"

**Action:** greenfield `GenerateImage` + `cp` → `docs/prd/TMP/design-tempo-onboarding.png`
