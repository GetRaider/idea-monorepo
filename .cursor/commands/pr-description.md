Draft a PR description for the current branch against `main`.

Inspect `git diff main...HEAD`, `git log main..HEAD`, and working-tree changes when relevant; do not invent results or verification.

Output:
## Summary
- 1–3 bullets describing what changed and why.

## Impact
- Affected apps/packages, compatibility, migrations or rollout considerations when applicable.

## Verification
- Commands **actually run**, with results; otherwise explicitly label proposed test steps as **Not run**.

## Risks / follow-ups
- Only meaningful remaining concerns.

Do not create the PR unless the user explicitly requests it.
