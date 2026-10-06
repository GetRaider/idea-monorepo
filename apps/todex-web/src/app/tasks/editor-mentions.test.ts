import { describe, expect, it } from "vitest";
import { DocMentionTarget } from "@repo/api/todex";

import {
  mentionEmptyLabel,
  mentionHref,
  mentionMenuItems,
  readMentionTrigger,
  type MentionCandidate,
} from "./editor-mentions";

const candidates: MentionCandidate[] = [
  {
    targetType: DocMentionTarget.TASK,
    id: "task-1",
    label: "Ship the editor",
    hint: "TDX-4",
    href: "/tasks/board/Inbox/TDX-4",
  },
  {
    targetType: DocMentionTarget.DOC,
    id: "doc-1",
    label: "Launch goal",
    hint: "Goal",
    href: "/docs/doc-1",
  },
];

describe("readMentionTrigger", () => {
  it("reads a query that continues after the scope", () => {
    expect(readMentionTrigger("See @docs launch")).toEqual({
      query: "docs launch",
      length: 12,
    });
  });

  it("ignores an @ in the middle of a word", () => {
    expect(readMentionTrigger("email@todex")).toBeNull();
  });
});

describe("mentionMenuItems", () => {
  it("offers tasks, docs, and events from a bare @", () => {
    expect(mentionMenuItems(candidates, "").map((item) => item.kind === "scope" ? item.token : item.id)).toEqual([
      "tasks",
      "docs",
      "events",
    ]);
  });

  it("narrows scopes while the query is still a prefix", () => {
    expect(mentionMenuItems(candidates, "do").map((item) => item.kind === "scope" ? item.label : item.id)).toEqual([
      "Docs",
    ]);
  });

  it("lists tasks after @tasks", () => {
    const items = mentionMenuItems(candidates, "tasks ship");
    expect(items).toEqual([
      {
        kind: "target",
        targetType: DocMentionTarget.TASK,
        id: "task-1",
        label: "Ship the editor",
        hint: "TDX-4",
        href: "/tasks/board/Inbox/TDX-4",
      },
    ]);
  });

  it("filters docs when the name is typed onto @docs", () => {
    const items = mentionMenuItems(candidates, "docsLaunch");
    expect(items.map((item) => (item.kind === "target" ? item.id : item.token))).toEqual([
      "doc-1",
    ]);
  });

  it("searches every kind when the query is not a scope", () => {
    expect(mentionMenuItems(candidates, "launch").map((item) => item.kind === "target" ? item.id : item.token)).toEqual([
      "doc-1",
    ]);
  });
});

describe("mentionHref", () => {
  it("builds doc, task, and event paths", () => {
    expect(
      mentionHref({ targetType: DocMentionTarget.DOC, targetId: "doc-1" }),
    ).toBe("/docs/doc-1");
    expect(
      mentionHref({
        targetType: DocMentionTarget.TASK,
        targetId: "task-1",
        taskKey: "TDX-4",
        boardName: "Inbox",
      }),
    ).toBe("/tasks/board/Inbox/TDX-4");
    expect(
      mentionHref({ targetType: DocMentionTarget.EVENT, targetId: "event-1" }),
    ).toBe("/calendar/events/event-1");
  });
});
describe("mentionEmptyLabel", () => {
  it("names the active scope", () => {
    expect(mentionEmptyLabel("events standup")).toBe("No events");
    expect(mentionEmptyLabel("missing")).toBe("Nothing matches");
  });
});
