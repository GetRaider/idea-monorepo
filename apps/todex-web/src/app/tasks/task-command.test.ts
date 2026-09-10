import { describe, expect, it } from "vitest";
import { TaskPriority, TaskStatus } from "@repo/api/todex";
import type { Task, TaskBoard } from "@repo/api/todex";

import { hrefForTask } from "./task-command.href";

describe("hrefForTask", () => {
  const boards: TaskBoard[] = [
    {
      id: "board-1",
      workspaceId: "ws",
      folderId: null,
      name: "Inbox",
      emoji: null,
      createdAt: "2026-09-10T00:00:00.000Z",
      updatedAt: "2026-09-10T00:00:00.000Z",
    },
  ];
  const task = {
    id: "task-1",
    workspaceId: "ws",
    taskBoardId: "board-1",
    taskKey: "T-1",
    summary: "Do it",
    description: "",
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    dueDate: null,
    scheduleDate: null,
    estimation: null,
    parentTaskId: null,
    createdAt: "2026-09-10T00:00:00.000Z",
    updatedAt: "2026-09-10T00:00:00.000Z",
  } satisfies Task;

  it("uses the schedule URL when the current schedule already loaded the task", () => {
    expect(
      hrefForTask(task, boards, { kind: "schedule", schedule: "today" }, new Set(["task-1"])),
    ).toBe("/tasks/schedule/today/T-1");
  });

  it("falls back to the board URL when the task is not in the schedule set", () => {
    expect(
      hrefForTask(task, boards, { kind: "schedule", schedule: "today" }, new Set()),
    ).toBe("/tasks/board/Inbox/T-1");
  });

  it("uses the board URL from a board view", () => {
    expect(
      hrefForTask(
        task,
        boards,
        { kind: "board", boardId: "board-1", boardName: "Inbox" },
        new Set(["task-1"]),
      ),
    ).toBe("/tasks/board/Inbox/T-1");
  });
});
