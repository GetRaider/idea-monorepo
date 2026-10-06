import { describe, expect, it } from "vitest";

import {
  completeRecurringTask,
  formatTaskRecurrence,
  TaskStatus,
} from "@repo/api/todex";
import type { TaskRecurrence } from "@repo/api/todex";

describe("completeRecurringTask", () => {
  it("advances daily, weekly, and monthly dates in the task time zone", () => {
    expect(
      advance({
        scheduleDate: "2026-10-06T00:00:00.000Z",
        recurrence: rule({ frequency: "daily", interval: 3 }),
      }).scheduleDate,
    ).toBe("2026-10-09T00:00:00.000Z");

    expect(
      advance({
        scheduleDate: "2026-10-05T00:00:00.000Z",
        recurrence: rule({
          frequency: "weekly",
          weekdays: ["MO", "WE"],
        }),
      }).scheduleDate,
    ).toBe("2026-10-07T00:00:00.000Z");

    expect(
      advance({
        scheduleDate: "2026-01-31T00:00:00.000Z",
        recurrence: rule({ frequency: "monthly" }),
      }).scheduleDate,
    ).toBe("2026-02-28T00:00:00.000Z");

    expect(
      advance({
        scheduleDate: "2024-02-29T00:00:00.000Z",
        recurrence: rule({ frequency: "yearly" }),
      }).scheduleDate,
    ).toBe("2025-02-28T00:00:00.000Z");
  });

  it("uses the task time zone instead of the UTC calendar day", () => {
    const next = advance({
      scheduleDate: "2026-10-05T22:00:00.000Z",
      recurrence: rule({
        frequency: "daily",
        timeZone: "Europe/Warsaw",
      }),
    });
    expect(next.scheduleDate).toBe("2026-10-06T22:00:00.000Z");
  });

  it("keeps the gap between schedule and due", () => {
    const next = advance({
      scheduleDate: "2026-10-05T00:00:00.000Z",
      dueDate: "2026-10-07T00:00:00.000Z",
      recurrence: rule({ frequency: "weekly", weekdays: ["MO"] }),
    });
    expect(next.scheduleDate).toBe("2026-10-12T00:00:00.000Z");
    expect(next.dueDate).toBe("2026-10-14T00:00:00.000Z");
  });

  it("skips a week when the interval is 2", () => {
    expect(
      advance({
        scheduleDate: "2026-10-05T00:00:00.000Z",
        recurrence: rule({
          frequency: "weekly",
          interval: 2,
          weekdays: ["MO"],
        }),
      }).scheduleDate,
    ).toBe("2026-10-19T00:00:00.000Z");
  });

  it("decrements the remaining count and resets the checklist", () => {
    const next = advance({
      recurrence: rule({ end: { type: "count", count: 3 } }),
      acceptanceCriteria: [{ id: "a", text: "Reviewed", done: true }],
    });
    expect(next.type).toBe("advance");
    if (next.type !== "advance") return;
    expect(next.recurrence.end).toEqual({ type: "count", count: 2 });
    expect(next.acceptanceCriteria).toEqual([
      { id: "a", text: "Reviewed", done: false },
    ]);
  });

  it("finishes after the last count or past the until date", () => {
    expect(
      completeRecurringTask(
        snapshot({ recurrence: rule({ end: { type: "count", count: 1 } }) }),
      ).type,
    ).toBe("finish-series");
    expect(
      completeRecurringTask(
        snapshot({
          scheduleDate: "2026-10-05T00:00:00.000Z",
          recurrence: rule({
            frequency: "daily",
            end: { type: "until", until: "2026-10-05" },
          }),
        }),
      ).type,
    ).toBe("finish-series");
  });

  it("leaves an undated task done without dropping the rule", () => {
    expect(
      completeRecurringTask(
        snapshot({
          scheduleDate: null,
          recurrence: rule({}),
        }),
      ),
    ).toEqual({ type: "complete" });
  });
});

describe("formatTaskRecurrence", () => {
  it("describes weekdays, interval, and remaining count", () => {
    expect(
      formatTaskRecurrence(
        rule({
          interval: 2,
          weekdays: ["MO", "WE", "FR"],
          end: { type: "count", count: 4 },
        }),
      ),
    ).toBe("Every 2 weeks on Mon, Wed, Fri, 4 times left");
  });
});

function advance(
  overrides: Partial<{
    scheduleDate: string | null;
    dueDate: string | null;
    recurrence: TaskRecurrence;
    acceptanceCriteria: Array<{ id: string; text: string; done: boolean }>;
  }>,
) {
  const result = completeRecurringTask(snapshot(overrides));
  expect(result.type).toBe("advance");
  if (result.type !== "advance") {
    throw new Error("expected the series to advance");
  }
  return result;
}

function snapshot(
  overrides: Partial<{
    scheduleDate: string | null;
    dueDate: string | null;
    recurrence: TaskRecurrence | null;
    acceptanceCriteria: Array<{ id: string; text: string; done: boolean }>;
  }>,
) {
  return {
    status: TaskStatus.TODO,
    scheduleDate: "2026-10-05T00:00:00.000Z" as string | null,
    dueDate: null as string | null,
    recurrence: rule({}) as TaskRecurrence | null,
    acceptanceCriteria: [] as Array<{ id: string; text: string; done: boolean }>,
    ...overrides,
  };
}

function rule(overrides: Partial<TaskRecurrence>): TaskRecurrence {
  return {
    frequency: "weekly",
    interval: 1,
    weekdays: ["MO"],
    timeZone: "UTC",
    end: { type: "never" },
    ...overrides,
  };
}
