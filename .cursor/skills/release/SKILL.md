---
name: release
description: Cut a release with version bump, changelog update, and release branch/commit following release/<SCOPE>-<version> and release(<SCOPE>): subject conventions. Use when releasing, tagging a version, preparing a changelog, or cutting v1.2.0 for TAD/DVN/GEN/PRT.
---

# Release

## Branch

Format: `release/<SCOPE>-<version>`

| SCOPE | App |
|-------|-----|
| `GEN` | Monorepo-wide |
| `TAD` | take-and-do |
| `DVN` | devinity |
| `PRT` | personal-website |

Examples: `release/GEN-v1`, `release/TAD-1.2.0`, `release/DVN-2.0.0-notes`

Max **50** characters. Types allowed in branch prefix: use `release` type.

## Commit

Format: `release(<SCOPE>): <subject>`

- Max header **70** chars
- No body, no footer (commitlint enforced)

Examples:

- `release(GEN): cut v1.0.0`
- `release(TAD): bump to 1.2.0`

## Workflow

### 1. Create release branch

```bash
git checkout -b release/<SCOPE>-<version>
```

### 2. Version bump

Update `version` in the relevant `package.json`:

- App-only release: `apps/<app>/package.json`
- Monorepo tooling: root `package.json` if applicable

Follow semver.

### 3. Changelog

Add entry to `CHANGELOG.md` if it exists for that app; otherwise create or update app README release notes section.

Include: version, date, added/changed/fixed bullets from commits since last release.

### 4. Verify

```bash
pnpm build --filter=<affected>...
pnpm test --filter=<affected>...
pnpm codeCheck
```

Use `pre-pr-check` skill for full validation.

### 5. Commit and tag (if tagging)

```bash
git add -A
git commit -m "release(<SCOPE>): cut v<version>"
git tag v<version>   # optional — confirm user wants tag
```

### 6. PR / merge

Open PR with summary of version changes. Do not force-push `main`.

## Constraints

- `release` type is in commitlint `type-enum`
- Match SCOPE to the app being released
- Do not bump unrelated app versions in the same commit unless intentional monorepo release (`GEN`)
