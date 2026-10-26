import { describe, expect, it } from "vitest";
import { DocType, GoalStatus } from "@repo/api/todex";

import { mapDocSummary } from "./mappers";

describe("mapDocSummary", () => {
  it("leaves goal fields empty on a common doc", () => {
    expect(mapDocSummary(row(DocType.COMMON))).toMatchObject({
      goalStatus: null,
      goalDeadline: null,
      progressPercent: null,
    });
  });

  it("reads goal status and deadline and uses the given progress", () => {
    expect(
      mapDocSummary(
        row(DocType.GOAL, {
          why: { type: "doc", content: [] },
          successCriteria: [],
          preconditions: [],
          status: GoalStatus.DONE,
          deadline: "2026-04-01",
        }),
        50,
      ),
    ).toMatchObject({
      goalStatus: GoalStatus.DONE,
      goalDeadline: "2026-04-01",
      progressPercent: 50,
    });
  });
});

function row(
  type: typeof DocType.COMMON | typeof DocType.GOAL,
  body: unknown = {},
) {
  return {
    id: "doc-1",
    workspaceId: "workspace-1",
    folderId: null,
    type,
    docKey: "D-1",
    title: "Notes",
    body,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  };
}
