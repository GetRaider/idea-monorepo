import { describe, expect, it } from "vitest";

import {
  CreateDocBodySchema,
  DocMentionTarget,
  DocType,
  GoalDocBodySchema,
  collectMentions,
  projectProse,
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
        notes: "nope",
      }).success,
    ).toBe(false);
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
