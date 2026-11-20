import { describe, expect, it } from "vitest";
import { collectHtmlMentions } from "@repo/api/todex";

import { dependsOnWouldCycle, orderRelatedTo } from "./relation-graph";

describe("orderRelatedTo", () => {
  it("stores one canonical direction for either caller order", () => {
    const goal = { type: "doc" as const, id: "goal-1" };
    const task = { type: "task" as const, id: "task-1" };
    expect(orderRelatedTo(goal, task)).toEqual({ source: goal, target: task });
    expect(orderRelatedTo(task, goal)).toEqual({ source: goal, target: task });
  });

  it("rejects a self link", () => {
    const task = { type: "task" as const, id: "task-1" };
    expect(orderRelatedTo(task, task)).toBeNull();
  });
});

describe("dependsOnWouldCycle", () => {
  it("rejects the opposite edge and a longer cycle", () => {
    expect(
      dependsOnWouldCycle(
        [{ sourceId: "b", targetId: "a" }],
        "a",
        "b",
      ),
    ).toBe(true);
    expect(
      dependsOnWouldCycle(
        [
          { sourceId: "a", targetId: "b" },
          { sourceId: "b", targetId: "c" },
        ],
        "c",
        "a",
      ),
    ).toBe(true);
  });

  it("allows a new edge that does not reach the source", () => {
    expect(
      dependsOnWouldCycle([{ sourceId: "a", targetId: "b" }], "a", "c"),
    ).toBe(false);
  });
});

describe("collectHtmlMentions", () => {
  it("does not treat a mention as a dependency", () => {
    expect(
      collectHtmlMentions(
        '<p><span data-target-type="task" data-target-id="b">@B</span></p>',
      ),
    ).toEqual([{ targetType: "task", targetId: "b" }]);
  });
});
