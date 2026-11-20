import { describe, expect, it } from "vitest";

import {
  CreateDocBodySchema,
  DocMentionTarget,
  DocType,
  GoalDocBodySchema,
  GoalStatus,
  collectMentions,
  projectProse,
  readGoalDocBody,
} from "@repo/api/todex";
import type { DocMentionRef, ProseDoc } from "@repo/api/todex";

describe("projectProse", () => {
  it("drops unknown mentions and renders resolved labels", () => {
    const projected = projectProse(
      paragraph([
        text("See "),
        mention(DocMentionTarget.TASK, "task-1"),
        text(" and "),
        mention(DocMentionTarget.TASK, "missing"),
        mention(DocMentionTarget.EVENT, "event-1", "Standup"),
      ]),
      (target) => target.targetId !== "missing",
      (target) =>
        target.targetType === DocMentionTarget.TASK
          ? "Ship docs"
          : (target.label ?? ""),
    );

    expect(projected.plainText).toBe("See Ship docs and Standup");
    expect(
      collectMentions(projected.doc).map((target) => target.targetId),
    ).toEqual(["task-1", "event-1"]);
  });

  it("keeps document tables and callouts readable for indexing", () => {
    const doc: ProseDoc = {
      type: "doc",
      content: [
        {
          type: "table",
          content: [
            {
              type: "tableRow",
              content: [
                { type: "tableHeader", content: [{ type: "paragraph", content: [text("Mode")] }] },
                { type: "tableHeader", content: [{ type: "paragraph", content: [text("Access")] }] },
              ],
            },
            {
              type: "tableRow",
              content: [
                { type: "tableCell", content: [{ type: "paragraph", content: [text("Ask")] }] },
                { type: "tableCell", content: [{ type: "paragraph", content: [text("Read only")] }] },
              ],
            },
          ],
        },
        {
          type: "callout",
          attrs: { variant: "info" },
          content: [{ type: "paragraph", content: [text("Keep writes approved")] }],
        },
        {
          type: "details",
          content: [
            { type: "detailsSummary", content: [text("Implementation")] },
            {
              type: "detailsContent",
              content: [{ type: "paragraph", content: [text("Use MCP")] }],
            },
          ],
        },
      ],
    };
    const projected = projectProse(doc, () => true, () => "");
    expect(projected.plainText).toContain("Mode\tAccess");
    expect(projected.plainText).toContain("Ask\tRead only");
    expect(projected.plainText).toContain("Keep writes approved");
    expect(projected.plainText).toContain("Implementation\nUse MCP");
    expect(projected.doc).toEqual(doc);
  });

  it("rejects a mention without a target", () => {
    const parsed = CreateDocBodySchema.safeParse({
      type: DocType.COMMON,
      title: "Notes",
      body: {
        content: paragraph([{ type: "mention" }]),
      },
    });
    expect(parsed.success).toBe(false);
  });
});

describe("doc bodies", () => {
  it("rejects goal fields on a common doc and extra goal fields", () => {
    expect(
      CreateDocBodySchema.safeParse({
        type: DocType.COMMON,
        title: "Notes",
        linkedTaskIds: ["task-1"],
      }).success,
    ).toBe(false);

    expect(
      GoalDocBodySchema.safeParse({
        why: emptyDoc(),
        successCriteria: [],
        preconditions: [],
        status: GoalStatus.ACTIVE,
        deadline: null,
        notes: "nope",
      }).success,
    ).toBe(false);
  });

  it("reads legacy goals and drops invalid status or deadline", () => {
    expect(
      readGoalDocBody({
        why: emptyDoc(),
        successCriteria: [],
        preconditions: [],
      }),
    ).toMatchObject({ status: GoalStatus.ACTIVE, deadline: null });

    expect(
      readGoalDocBody({
        why: emptyDoc(),
        successCriteria: [],
        preconditions: [],
        status: "later",
        deadline: "next week",
      }),
    ).toMatchObject({ status: GoalStatus.ACTIVE, deadline: null });

    expect(
      readGoalDocBody({
        why: emptyDoc(),
        successCriteria: [],
        preconditions: [],
        status: GoalStatus.PAUSED,
        deadline: "2026-12-01",
      }),
    ).toMatchObject({ status: GoalStatus.PAUSED, deadline: "2026-12-01" });
  });
});

function emptyDoc(): ProseDoc {
  return { type: "doc", content: [] };
}

function paragraph(content: ProseDoc["content"]): ProseDoc {
  return {
    type: "doc",
    content: [{ type: "paragraph", content }],
  };
}

function text(value: string) {
  return { type: "text", text: value };
}

function mention(
  targetType: DocMentionRef["targetType"],
  targetId: string,
  label?: string,
) {
  return {
    type: "mention",
    attrs: {
      targetType,
      targetId,
      ...(label ? { label } : {}),
    },
  };
}
