import { afterEach, describe, expect, it, vi } from "vitest";
import { TaskPriority, TaskStatus } from "@repo/api/todex";

import {
  acceptanceCriteriaAreMet,
  taskChecklistProgress,
  applyRootMove,
  compareTasksForListSort,
  dateInputToLocalDayStartIso,
  resolveCombinedOpenDrop,
  sameBoardDropIndex,
  isInboxTask,
  isOverdueTask,
  normalizeDescriptionHtml,
  projectCompletedTask,
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
    expect(
      tasksByCreatedAtDescending([older, open, newer], 2).map(
        (item) => item.id,
      ),
    ).toEqual(["open", "newer"]);
    expect(
      tasksByCompletedDescending([older, open, newer], 5).map(
        (item) => item.id,
      ),
    ).toEqual(["newer", "older"]);
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
    expect(
      compareTasksForListSort(unscheduled, sooner, "schedule"),
    ).toBeGreaterThan(0);
    const sorted = sortNestedTasks([later, unscheduled, sooner], {
      enabled: true,
      field: "schedule",
      direction: "asc",
    });
    expect(sorted.map((node) => node.id)).toEqual(["sooner", "later", "none"]);
  });
});

describe("board drop indexes", () => {
  const board = "board";
  const nodes = [
    { id: "a1", taskBoardId: board },
    { id: "b1", taskBoardId: "other" },
    { id: "a2", taskBoardId: board },
  ];

  it("counts same-board roots before the gap, skipping the dragged task", () => {
    expect(sameBoardDropIndex(nodes, "a2", board, 0)).toBe(0);
    expect(sameBoardDropIndex(nodes, "a2", board, 1)).toBe(1);
    expect(sameBoardDropIndex(nodes, "a2", board, 3)).toBe(1);
    expect(sameBoardDropIndex(nodes, "a1", board, 3)).toBe(1);
  });

  it("sends the boundary gap to the start of in progress", () => {
    const todo = [{ id: "t1", taskBoardId: board }];
    const inProgress = [{ id: "p1", taskBoardId: board }];
    expect(resolveCombinedOpenDrop(todo, inProgress, "t1", board, 1)).toEqual({
      status: TaskStatus.IN_PROGRESS,
      index: 0,
    });
    expect(resolveCombinedOpenDrop(todo, [], "t1", board, 1)).toEqual({
      status: TaskStatus.TODO,
      index: 0,
    });
  });

  it("rewrites positions inside the destination column", () => {
    const tasks = [
      task({ id: "a", position: 0 }),
      task({ id: "b", position: 1 }),
      task({ id: "c", position: 2 }),
    ];
    const moved = applyRootMove(tasks, "a", TaskStatus.TODO, 2);
    expect(moved.map((item) => [item.id, item.position])).toEqual([
      ["a", 2],
      ["b", 0],
      ["c", 1],
    ]);
  });

  it("appends when a root changes status", () => {
    const tasks = [
      task({ id: "a", status: TaskStatus.TODO, position: 0 }),
      task({ id: "b", status: TaskStatus.TODO, position: 1 }),
      task({ id: "c", status: TaskStatus.DONE, position: 0 }),
    ];
    const moved = applyRootMove(tasks, "a", TaskStatus.DONE, 1);
    expect(moved.find((item) => item.id === "a")).toMatchObject({
      status: TaskStatus.DONE,
      position: 1,
    });
    expect(moved.find((item) => item.id === "b")?.position).toBe(0);
    expect(moved.find((item) => item.id === "c")?.position).toBe(0);
  });
});

describe("acceptanceCriteriaAreMet", () => {
  it("is false when there are no criteria", () => {
    expect(acceptanceCriteriaAreMet([])).toBe(false);
  });

  it("is false while any criterion is open", () => {
    expect(
      acceptanceCriteriaAreMet([
        { id: "a", text: "Reviewed", done: true },
        { id: "b", text: "Deployed", done: false },
      ]),
    ).toBe(false);
  });

  it("is true when every criterion is done", () => {
    expect(
      acceptanceCriteriaAreMet([{ id: "a", text: "Reviewed", done: true }]),
    ).toBe(true);
  });
});

describe("taskChecklistProgress", () => {
  it("counts checked criteria and done subtasks together", () => {
    expect(
      taskChecklistProgress({
        acceptanceCriteria: [
          { id: "a", text: "Reviewed", done: true },
          { id: "b", text: "Deployed", done: false },
        ],
        subtasks: [
          { status: TaskStatus.DONE },
          { status: TaskStatus.TODO },
          { status: TaskStatus.IN_PROGRESS },
        ],
      }),
    ).toEqual({ done: 2, total: 5 });
  });

  it("is empty when the task has neither criteria nor subtasks", () => {
    expect(
      taskChecklistProgress({ acceptanceCriteria: [], subtasks: [] }),
    ).toEqual({ done: 0, total: 0 });
  });
});

describe("normalizeDescriptionHtml", () => {
  it("stores blank editor markup as an empty string", () => {
    expect(normalizeDescriptionHtml("")).toBe("");
    expect(normalizeDescriptionHtml("   ")).toBe("");
    expect(normalizeDescriptionHtml("<p></p>")).toBe("");
    expect(normalizeDescriptionHtml("<p><br></p>")).toBe("");
    expect(normalizeDescriptionHtml("<p>&nbsp;</p>")).toBe("");
  });

  it("keeps html that has visible text", () => {
    expect(normalizeDescriptionHtml("<p>Ship it</p>")).toBe("<p>Ship it</p>");
    expect(normalizeDescriptionHtml("<h2>Title</h2><p>Body</p>")).toBe(
      "<h2>Title</h2><p>Body</p>",
    );
  });
});

describe("projectCompletedTask", () => {
  const weekly = {
    frequency: "weekly" as const,
    interval: 1,
    weekdays: ["MO" as const],
    timeZone: "UTC",
    end: { type: "never" as const },
  };

  it("keeps the completed task done and adds the next occurrence", () => {
    const [done, next] = projectCompletedTask(
      [
        task({
          id: "repeat",
          status: TaskStatus.TODO,
          scheduleDate: "2026-10-05T00:00:00.000Z",
          recurrence: weekly,
          acceptanceCriteria: [{ id: "a", text: "Reviewed", done: true }],
        }),
      ],
      "repeat",
    );
    expect(done?.id).toBe("repeat");
    expect(done?.status).toBe(TaskStatus.DONE);
    expect(done?.recurrence).toBeNull();
    expect(done?.scheduleDate).toBe("2026-10-05T00:00:00.000Z");
    expect(next?.status).toBe(TaskStatus.TODO);
    expect(next?.scheduleDate).toBe("2026-10-12T00:00:00.000Z");
    expect(next?.acceptanceCriteria[0]?.done).toBe(false);
    expect(next?.recurrence).toEqual(weekly);
  });

  it("finishes the series on the last occurrence", () => {
    const [next] = projectCompletedTask(
      [
        task({
          id: "last",
          status: TaskStatus.IN_PROGRESS,
          scheduleDate: "2026-10-05T00:00:00.000Z",
          recurrence: { ...weekly, end: { type: "count", count: 1 } },
        }),
      ],
      "last",
    );
    expect(next?.status).toBe(TaskStatus.DONE);
    expect(next?.recurrence).toBeNull();
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
    acceptanceCriteria: [],
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    dueDate: null,
    scheduleDate: null,
    recurrence: null,
    estimation: null,
    parentTaskId: null,
    position: 0,
    createdAt: "2026-09-10T00:00:00.000Z",
    updatedAt: "2026-09-10T00:00:00.000Z",
    children: [],
    ...overrides,
  };
}
