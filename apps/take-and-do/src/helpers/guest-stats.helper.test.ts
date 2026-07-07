import { describe, expect, it } from "vitest";

import { TaskPriority, TaskStatus, type Task } from "@/types/task";

import { deriveGuestTaskStats } from "./guest-stats.helper";

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: "1",
    taskBoardId: "board-1",
    summary: "Task",
    description: "",
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    ...overrides,
  };
}

describe("deriveGuestTaskStats", () => {
  it("counts status, priority, and overdue tasks including subtasks", () => {
    const stats = deriveGuestTaskStats([
      task({ id: "1", status: TaskStatus.TODO }),
      task({
        id: "2",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
      }),
      task({
        id: "3",
        status: TaskStatus.DONE,
        subtasks: [
          task({
            id: "3a",
            status: TaskStatus.TODO,
            dueDate: new Date("2020-01-01"),
          }),
        ],
      }),
    ]);

    expect(stats).toEqual({
      total: 4,
      todo: 2,
      inProgress: 1,
      done: 1,
      highPriority: 1,
      overdue: 1,
    });
  });

  it("ignores completed tasks when counting overdue", () => {
    const stats = deriveGuestTaskStats([
      task({
        status: TaskStatus.DONE,
        dueDate: new Date("2020-01-01"),
      }),
    ]);

    expect(stats.overdue).toBe(0);
  });
});
