import { afterEach, describe, expect, it, vi } from "vitest";
import { TaskPriority, TaskStatus } from "@repo/api/todex";

import {
  compareTasksForListSort,
  dateInputToLocalDayStartIso,
  isInboxTask,
  isOverdueTask,
  isUnscheduledTask,
  isoToDateInput,
  localDayScheduleQuery,
  sortNestedTasks,
  tasksByCompletedDescending,
  tasksByCreatedAtDescending,
  type NestedTask,
} from "./task-helpers";

describe("localDayScheduleQuery", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns [local start, next local start) as ISO", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 10, 15, 30, 0));
    const query = localDayScheduleQuery(0);
    expect(new Date(query.scheduleFrom)).toEqual(
      new Date(2026, 8, 10, 0, 0, 0, 0),
    );
    expect(new Date(query.scheduleTo)).toEqual(
      new Date(2026, 8, 11, 0, 0, 0, 0),
    );
  });

  it("offsets tomorrow by one local day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 10, 15, 30, 0));
    const query = localDayScheduleQuery(1);
    expect(new Date(query.scheduleFrom)).toEqual(
      new Date(2026, 8, 11, 0, 0, 0, 0),
    );
    expect(new Date(query.scheduleTo)).toEqual(
      new Date(2026, 8, 12, 0, 0, 0, 0),
    );
  });
});

describe("date input local-day conversion", () => {
  it("stores the start of the local calendar day", () => {
    const iso = dateInputToLocalDayStartIso("2026-09-10");
    expect(iso).not.toBeNull();
    expect(new Date(iso!)).toEqual(new Date(2026, 8, 10, 0, 0, 0, 0));
  });

  it("round-trips through the date input", () => {
    const iso = dateInputToLocalDayStartIso("2026-09-10");
    expect(isoToDateInput(iso)).toBe("2026-09-10");
  });

  it("clears an empty date input", () => {
    expect(dateInputToLocalDayStartIso("")).toBeNull();
  });
});

describe("quick access", () => {
  const now = new Date(2026, 8, 10, 15, 0, 0);

  it("treats an untriaged todo as inbox and unscheduled", () => {
    const untriaged = task({ id: "inbox" });
    expect(isInboxTask(untriaged)).toBe(true);
    expect(isUnscheduledTask(untriaged)).toBe(true);
    expect(isOverdueTask(untriaged, now)).toBe(false);
  });

  it("keeps a dated todo out of inbox and marks a past due date overdue", () => {
    const planned = task({
      id: "planned",
      scheduleDate: "2026-09-10T00:00:00.000Z",
      dueDate: "2026-09-09T00:00:00.000Z",
    });
    expect(isInboxTask(planned)).toBe(false);
    expect(isUnscheduledTask(planned)).toBe(false);
    expect(isOverdueTask(planned, now)).toBe(true);
  });

  it("excludes done tasks from inbox, unscheduled, and overdue", () => {
    const done = task({
      id: "done",
      status: TaskStatus.DONE,
      dueDate: "2026-09-01T00:00:00.000Z",
    });
    expect(isInboxTask(done)).toBe(false);
    expect(isUnscheduledTask(done)).toBe(false);
    expect(isOverdueTask(done, now)).toBe(false);
  });

  it("orders recent and completed tasks", () => {
    const older = task({
      id: "older",
      createdAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-02T00:00:00.000Z",
      status: TaskStatus.DONE,
    });
    const newer = task({
      id: "newer",
      createdAt: "2026-09-08T00:00:00.000Z",
      updatedAt: "2026-09-09T00:00:00.000Z",
      status: TaskStatus.DONE,
    });
    const open = task({ id: "open", createdAt: "2026-09-10T00:00:00.000Z" });
    expect(tasksByCreatedAtDescending([older, open, newer], 2).map((item) => item.id)).toEqual([
      "open",
      "newer",
    ]);
    expect(tasksByCompletedDescending([older, open, newer], 5).map((item) => item.id)).toEqual([
      "newer",
      "older",
    ]);
  });
});

describe("list sort", () => {
  it("sorts by scheduleDate, not dueDate, and puts unscheduled last", () => {
    const later = task({
      id: "later",
      summary: "Later",
      scheduleDate: "2026-09-12T00:00:00.000Z",
      dueDate: "2026-09-10T00:00:00.000Z",
    });
    const sooner = task({
      id: "sooner",
      summary: "Sooner",
      scheduleDate: "2026-09-11T00:00:00.000Z",
      dueDate: "2026-09-20T00:00:00.000Z",
    });
    const unscheduled = task({
      id: "none",
      summary: "None",
      scheduleDate: null,
      dueDate: "2026-09-01T00:00:00.000Z",
    });
    expect(compareTasksForListSort(sooner, later, "schedule")).toBeLessThan(0);
    expect(compareTasksForListSort(unscheduled, sooner, "schedule")).toBeGreaterThan(
      0,
    );
    const sorted = sortNestedTasks([later, unscheduled, sooner], {
      enabled: true,
      field: "schedule",
      direction: "asc",
    });
    expect(sorted.map((node) => node.id)).toEqual(["sooner", "later", "none"]);
  });
});

function task(overrides: Partial<NestedTask>): NestedTask {
  return {
    id: "id",
    workspaceId: "ws",
    taskBoardId: "board",
    taskKey: "T-1",
    summary: "Task",
    description: "",
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    dueDate: null,
    scheduleDate: null,
    estimation: null,
    parentTaskId: null,
    createdAt: "2026-09-10T00:00:00.000Z",
    updatedAt: "2026-09-10T00:00:00.000Z",
    children: [],
    ...overrides,
  };
}
