import { describe, expect, it } from "vitest";
import {
  TaskPriority,
  TaskStatus,
  type CalendarEvent,
  type Task,
} from "@repo/api/todex";

import { blocksForRange, taskIdsCoveredByEvents } from "./calendar-blocks";

describe("event task scope", () => {
  it("ignores tasks on a cancelled event", () => {
    expect([
      ...taskIdsCoveredByEvents([
        event({ taskScope: ["task-1"], cancelled: false }),
        event({ taskScope: ["task-2"], cancelled: true }),
      ]),
    ]).toEqual(["task-1"]);
  });

  it("hides a scheduled task that is on an event and keeps one that is not", () => {
    const rangeStart = new Date("2026-10-07T00:00:00.000Z");
    const rangeEnd = new Date("2026-10-08T00:00:00.000Z");
    const blocks = blocksForRange(
      [event({ id: "event-1", taskScope: ["scoped"], cancelled: false })],
      [
        task({ id: "scoped", scheduleDate: "2026-10-07T10:00:00.000Z" }),
        task({ id: "loose", scheduleDate: "2026-10-07T12:00:00.000Z" }),
      ],
      [],
      [],
      rangeStart,
      rangeEnd,
      rangeEnd,
      "UTC",
    );
    expect(blocks.flatMap((block) => (block.taskId ? [block.taskId] : []))).toEqual([
      "loose",
    ]);
  });
});

function event(overrides: Partial<CalendarEvent>): CalendarEvent {
  return {
    id: "event",
    workspaceId: "workspace",
    seriesEventId: null,
    title: "Event",
    start: "2026-10-07T10:00:00.000Z",
    end: "2026-10-07T11:00:00.000Z",
    allDay: false,
    timeZone: "UTC",
    recurrence: null,
    rawRrule: null,
    description: "",
    taskScope: [],
    participants: [],
    rsvpStatus: null,
    spaceId: null,
    googleEventId: null,
    googleEtag: null,
    organizerSelf: true,
    originalStart: null,
    cancelled: false,
    createdAt: "2026-10-07T00:00:00.000Z",
    updatedAt: "2026-10-07T00:00:00.000Z",
    ...overrides,
  };
}

function task(overrides: Partial<Task>): Task {
  return {
    id: "task",
    workspaceId: "workspace",
    spaceId: "space",
    taskKey: "T-1",
    summary: "Task",
    description: "",
    acceptanceCriteria: [],
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    dueDate: null,
    scheduleDate: null,
    recurrence: null,
    sectionId: "section",
    progressStageId: null,
    estimation: 60,
    actualTime: 0,
    parentTaskId: null,
    epicId: null,
    goalId: null,
    position: 0,
    createdAt: "2026-10-07T00:00:00.000Z",
    updatedAt: "2026-10-07T00:00:00.000Z",
    ...overrides,
  };
}
