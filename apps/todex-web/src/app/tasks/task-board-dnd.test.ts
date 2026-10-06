import { TaskStatus } from "@repo/api/todex";
import { describe, expect, it } from "vitest";

import { boardDropId } from "./task-board-dnd";

describe("boardDropId", () => {
  it("namespaces drop ids by board so stacked boards do not collide", () => {
    const work = boardDropId({
      type: "reorder",
      kind: "gap",
      status: TaskStatus.TODO,
      index: 0,
      boardId: "work",
    });
    const inbox = boardDropId({
      type: "reorder",
      kind: "gap",
      status: TaskStatus.TODO,
      index: 0,
      boardId: "inbox",
    });
    expect(work).not.toBe(inbox);
  });
});
