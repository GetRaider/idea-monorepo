---
name: release
description: Prepare an application or workspace package release with scope, semver, changelog, checks, and safe Git operations. Use only when the user explicitly requests a release.
disable-model-invocation: true
---
# Release preparation

1. Inspect the release target, current version, tags, deployment process, `commitlint.config.cjs`, and Git branch rules. Do not assume all apps share a version.
2. Summarize intended version bump, compatibility, changes since the last release, and rollout risks before changing release metadata.
3. Update only the relevant version and existing changelog/release notes conventions; avoid introducing a new release tool.
4. Run `pnpm verify:affected --build` plus the target's release-specific validations.
5. Prepare a compliant branch and commit only when explicitly asked; confirm before tagging, publishing, deploying or modifying production data.
6. Report scope, versions, verification and any steps still requiring user authorization.
