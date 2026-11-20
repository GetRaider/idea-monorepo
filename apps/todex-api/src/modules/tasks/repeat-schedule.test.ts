import { describe, expect, it } from "vitest";
import type { TaskRecurrence } from "@repo/api/todex";

import { recurrenceForGeneratedTask, repeatSchedule } from "./repeat-schedule";

const weekly: TaskRecurrence = {
  frequency: "weekly",
  interval: 1,
  weekdays: ["FR"],
  timeZone: "UTC",
  end: { type: "never" },
};

describe("repeatSchedule", () => {
  it("schedules an unscheduled task at 09:00 in the rule time zone", () => {
    const plan = repeatSchedule({
      recurrence: weekly,
      slots: [],
      dueDate: null,
      now: new Date("2026-11-20T15:00:00.000Z"),
    });

    expect(plan.anchor).toBe("2026-11-20T09:00:00.000Z");
    expect(plan.slots).toEqual([
      {
        startAt: "2026-11-20T09:00:00.000Z",
        endAt: "2026-11-20T10:00:00.000Z",
      },
    ]);
    expect(plan.slotOffsets).toEqual([
      { dayOffset: 0, startLocal: "09:00", endLocal: "10:00" },
    ]);
  });

  it("uses the due date when the task has no active slot", () => {
    const retired = {
      id: "old",
      startAt: "2026-11-01T09:00:00.000Z",
      endAt: "2026-11-01T10:00:00.000Z",
      retiredAt: "2026-11-02T00:00:00.000Z",
    };
    const plan = repeatSchedule({
      recurrence: weekly,
      slots: [retired],
      dueDate: "2026-11-21T00:00:00.000Z",
      now: new Date("2026-11-20T15:00:00.000Z"),
    });

    expect(plan.anchor).toBe("2026-11-21T00:00:00.000Z");
    expect(plan.slots).toEqual([
      retired,
      {
        startAt: "2026-11-21T00:00:00.000Z",
        endAt: "2026-11-21T01:00:00.000Z",
      },
    ]);
  });

  it("keeps an existing active slot as the series anchor", () => {
    const plan = repeatSchedule({
      recurrence: weekly,
      slots: [
        {
          id: "later",
          startAt: "2026-11-22T09:00:00.000Z",
          endAt: "2026-11-22T10:00:00.000Z",
          retiredAt: null,
        },
        {
          id: "sooner",
          startAt: "2026-11-21T09:00:00.000Z",
          endAt: "2026-11-21T10:00:00.000Z",
          retiredAt: null,
        },
      ],
      dueDate: null,
    });

    expect(plan.anchor).toBe("2026-11-21T09:00:00.000Z");
    expect(plan.slots).toBeNull();
    expect(plan.slotOffsets).toBeNull();
  });
});

describe("recurrenceForGeneratedTask", () => {
  it("copies the rule onto the root occurrence and leaves subtasks unrepeated", () => {
    expect(recurrenceForGeneratedTask(null, weekly)).toEqual(weekly);
    expect(recurrenceForGeneratedTask("parent", weekly)).toBeNull();
  });
});
