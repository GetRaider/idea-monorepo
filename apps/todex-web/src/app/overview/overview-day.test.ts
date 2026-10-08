import { describe, expect, it } from "vitest";
import { TaskPriority, TaskStatus } from "@repo/api/todex";
import type { Task } from "@repo/api/todex";

import {
  localDayKey,
  localDays,
  organizingTasks,
  overviewTasks,
  upcomingBounds,
} from "./overview-day";

describe("upcomingBounds", () => {
  it("covers tomorrow through Sunday when today is midweek", () => {
    const bounds = upcomingBounds(new Date(2026, 9, 8));
    expect(localDayKey(bounds.from)).toBe("2026-10-09");
    expect(localDayKey(bounds.to)).toBe("2026-10-12");
    expect(localDays(bounds.from, bounds.to).map(localDayKey)).toEqual([
      "2026-10-09",
      "2026-10-10",
      "2026-10-11",
    ]);
  });

  it("includes only Sunday when today is Saturday", () => {
    const bounds = upcomingBounds(new Date(2026, 9, 10));
    expect(localDays(bounds.from, bounds.to).map(localDayKey)).toEqual([
      "2026-10-11",
    ]);
  });

  it("shows tomorrow when today is Sunday", () => {
    const bounds = upcomingBounds(new Date(2026, 9, 11));
    expect(localDays(bounds.from, bounds.to).map(localDayKey)).toEqual([
      "2026-10-12",
    ]);
  });
});

describe("organizingTasks", () => {
  const boards = new Map([
    ["inbox-board", "Inbox"],
    ["growth", "Software Growth"],
  ]);

  it("puts Inbox-board tasks in Inbox and other unscheduled tasks with their board", () => {
    const organized = organizingTasks(
      [
        task({ id: "inbox", taskBoardId: "inbox-board" }),
        task({
          id: "growth",
          taskBoardId: "growth",
          dueDate: "2026-10-20T00:00:00.000Z",
        }),
        task({
          id: "scheduled",
          taskBoardId: "growth",
          scheduleDate: "2026-10-08T09:00:00.000Z",
        }),
        task({ id: "done", taskBoardId: "inbox-board", status: TaskStatus.DONE }),
      ],
      boards,
    );
    expect(organized.inbox.map((item) => item.id)).toEqual(["inbox"]);
    expect(organized.unscheduled.map((item) => item.id)).toEqual(["growth"]);
  });
});

describe("overviewTasks", () => {
  it("hides cancelled tasks and sorts by schedule", () => {
    const tasks = overviewTasks([
      task({ id: "later", scheduleDate: "2026-10-08T15:00:00.000Z" }),
      task({
        id: "cancelled",
        status: TaskStatus.CANCELLED,
        scheduleDate: "2026-10-08T08:00:00.000Z",
      }),
      task({ id: "earlier", scheduleDate: "2026-10-08T09:00:00.000Z" }),
    ]);
    expect(tasks.map((item) => item.id)).toEqual(["earlier", "later"]);
  });
});

function task(overrides: Partial<Task>): Task {
  return {
    id: "id",
    workspaceId: "ws",
    taskBoardId: "board",
    taskKey: "T-1",
    summary: "Task",
    description: "",
    acceptanceCriteria: [],
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    dueDate: null,
    scheduleDate: null,
    recurrence: null,
    areaId: "area",
    progressStageId: null,
    estimation: 30,
    actualTime: 0,
    color: null,
    parentTaskId: null,
    goalId: null,
    position: 0,
    createdAt: "2026-10-08T00:00:00.000Z",
    updatedAt: "2026-10-08T00:00:00.000Z",
    ...overrides,
  };
}
