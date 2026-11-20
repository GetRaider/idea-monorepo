---
name: debug-root-cause
description: Diagnose reproducible or intermittent bugs using evidence, trace the root cause, apply a minimal fix and verify regression coverage. Use for debugging failures, races, incorrect state, or flaky behavior.
---
# Root-cause debugging

1. Establish expected vs observed behavior and impact. Capture the failing input, logs, stack, or user flow. If direct reproduction is impractical, say so and construct a grounded hypothesis.
2. Trace the execution path and state transitions. Test competing hypotheses, starting with the smallest relevant surface. Do not change unrelated code.
3. Fix the underlying cause with the smallest complete change. Preserve public contracts unless changing them is the requirement.
4. Add a regression test when a reliable behavioral test can be written; avoid tests of styling strings or mocks that merely assert implementation.
5. Run the failing scenario and relevant tests, then lint/typecheck through the normal verification workflow.
6. Report cause, fix, verified evidence, and any residual uncertainty. Never claim a bug was reproduced if it was not.
