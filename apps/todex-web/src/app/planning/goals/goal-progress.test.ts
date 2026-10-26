import { describe, expect, it } from "vitest";
import { TaskStatus } from "@repo/api/todex";

import { goalProgress, goalProgressLabel } from "./goal-progress";

describe("goalProgress", () => {
  it("is zero when nothing is linked", () => {
    expect(goalProgressLabel(goalProgress([]))).toBe("0/0 · 0%");
  });

  it("counts done tasks and ignores cancelled", () => {
    expect(
      goalProgress([
        TaskStatus.DONE,
        TaskStatus.TODO,
        TaskStatus.CANCELLED,
        TaskStatus.IN_PROGRESS,
      ]),
    ).toEqual({ totalTasks: 4, completedTasks: 1, progressPercent: 25 });
  });

  it("is 100 when every linked task is done", () => {
    expect(
      goalProgress([TaskStatus.DONE, TaskStatus.DONE]).progressPercent,
    ).toBe(100);
  });
});
