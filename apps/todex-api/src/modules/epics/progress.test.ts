import { describe, expect, it } from "vitest";

import { TaskStatus } from "@repo/api/todex";

import { planningProgress } from "./progress";

describe("planningProgress", () => {
  it("is zero when there are no tasks", () => {
    expect(planningProgress([])).toEqual({
      totalTasks: 0,
      completedTasks: 0,
      progressPercent: 0,
    });
  });

  it("counts done tasks once and keeps cancelled tasks in the total", () => {
    expect(
      planningProgress([
        TaskStatus.DONE,
        TaskStatus.CANCELLED,
        TaskStatus.TODO,
        TaskStatus.DONE,
      ]),
    ).toEqual({
      totalTasks: 4,
      completedTasks: 2,
      progressPercent: 50,
    });
  });

  it("rounds to an integer percentage", () => {
    expect(
      planningProgress([TaskStatus.DONE, TaskStatus.TODO, TaskStatus.TODO])
        .progressPercent,
    ).toBe(33);
  });
});
