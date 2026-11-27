import { describe, expect, it } from "vitest";
import { TaskStatus } from "@repo/api/todex";
import type { Counter, CounterDay, Task } from "@repo/api/todex";

import {
  dayClickChange,
  dayLabel,
  dayShare,
  formatLocalDate,
  groupBySpace,
  linkCandidates,
  progressLabel,
  streakLabel,
} from "./counter-helpers";

describe("progressLabel", () => {
  it("names the period after the recurrence", () => {
    expect(progressLabel(counter())).toBe("3 / 4 this week");
    expect(progressLabel(counter({ frequency: "daily" }))).toBe("3 / 4 today");
    expect(progressLabel(counter({ frequency: "daily", interval: 2 }))).toBe(
      "3 / 4 these 2 days",
    );
    expect(progressLabel(counter({ interval: 2 }))).toBe("3 / 4 these 2 weeks");
    expect(progressLabel(counter({ frequency: "monthly" }))).toBe(
      "3 / 4 this month",
    );
  });

  it("says when a restored Counter resumes and when it is archived", () => {
    const waiting = counter();
    expect(
      progressLabel(
        {
          ...waiting,
          period: waiting.period && {
            ...waiting.period,
            start: "2026-11-30",
            isOpen: false,
          },
        },
        "en-US",
      ),
    ).toBe("Resumes Mon, Nov 30");
    expect(progressLabel(counter({ period: null }))).toBe("Archived");
  });
});

describe("formatLocalDate", () => {
  it("never shifts the date by the viewer's time zone", () => {
    expect(formatLocalDate("2026-11-27", "en-US")).toBe("Fri, Nov 27");
  });
});

describe("dayLabel", () => {
  it("describes every mark on the day", () => {
    expect(
      dayLabel(day({ completed: 1, skipped: 1, failed: 2 }), "en-US"),
    ).toBe("Fri, Nov 27: 1 completed, 1 skipped, 2 failed");
    expect(dayLabel(day(), "en-US")).toBe("Fri, Nov 27: nothing logged");
  });
});

describe("dayLabel with a skip", () => {
  it("shows the reason", () => {
    const skipped = day({
      skipped: 1,
      occurrences: [{ status: "skipped", skipReason: "Travelling" } as never],
    });
    expect(dayLabel(skipped, "en-US")).toBe(
      "Fri, Nov 27: 1 skipped (Travelling)",
    );
  });
});

describe("dayClickChange", () => {
  it("completes a day that has room, one step at a time", () => {
    expect(dayClickChange(day({ canComplete: true }))).toEqual({
      status: "completed",
      count: 1,
    });
    expect(
      dayClickChange(day({ canComplete: true, completed: 1, capacity: 2 })),
    ).toEqual({ status: "completed", count: 2 });
  });

  it("clears a day that is already full", () => {
    expect(dayClickChange(day({ completed: 1, canMark: true }))).toEqual({
      status: "empty",
    });
  });

  it("does nothing when the Target is covered or the day is inert", () => {
    expect(dayClickChange(day())).toBeNull();
    expect(dayClickChange(day({ loggable: false, completed: 1 }))).toBeNull();
  });
});

describe("streakLabel", () => {
  it("counts in the Counter's periods", () => {
    const streak = (value: number, overrides: Partial<Counter> = {}) =>
      streakLabel(
        counter({ stats: { totalDays: 0, streak: value }, ...overrides }),
      );
    expect(streak(1, { frequency: "daily" })).toBe("1 day");
    expect(streak(4)).toBe("4 weeks");
    expect(streak(0, { frequency: "monthly" })).toBe("0 months");
    expect(streak(2, { interval: 2 })).toBe("2 periods");
  });
});

describe("dayShare", () => {
  const withDay = (overrides: Partial<CounterDay>) =>
    counter({ week: [day(overrides)] });

  it("compares full days with the Counters tracked that day", () => {
    expect(
      dayShare(
        [
          withDay({ fill: "filled" }),
          withDay({ fill: "partial" }),
          withDay({ tracked: false }),
        ],
        0,
      ),
    ).toBe(0.5);
  });

  it("is empty when nothing is tracked", () => {
    expect(dayShare([withDay({ tracked: false })], 0)).toBeNull();
    expect(dayShare([], 0)).toBeNull();
  });
});

describe("groupBySpace", () => {
  const spaces = [
    { id: "personal", name: "Personal", color: "#111111" },
    { id: "growth", name: "Growth", color: "#222222" },
    { id: "empty", name: "Empty", color: "#333333" },
  ];

  it("follows the space order and puts space-free Counters last", () => {
    const groups = groupBySpace(
      [
        counter({ id: "free" }),
        counter({ id: "b", spaceId: "growth" }),
        counter({ id: "a", spaceId: "personal" }),
        counter({ id: "gone", spaceId: "unknown" }),
      ],
      spaces,
    );
    expect(
      groups.map((group) => [
        group.name,
        group.counters.map((item) => item.id),
      ]),
    ).toEqual([
      ["Personal", ["a"]],
      ["Growth", ["b"]],
      ["No space", ["free", "gone"]],
    ]);
  });
});

describe("linkCandidates", () => {
  const tasks = [
    task({ id: "plain", summary: "Weekly review", taskKey: "T-1" }),
    task({ id: "done", summary: "Old review", status: TaskStatus.DONE }),
    task({
      id: "series-done",
      summary: "Gym",
      seriesId: "series",
      status: TaskStatus.DONE,
    }),
    task({ id: "series-open", summary: "Gym", seriesId: "series" }),
    task({ id: "cancelled", status: TaskStatus.CANCELLED }),
  ];

  it("offers open Tasks and one entry per series", () => {
    expect(linkCandidates(tasks, [], "").map((item) => item.id)).toEqual([
      "plain",
      "series-open",
    ]);
  });

  it("hides what is already linked and filters by name or key", () => {
    const links = [{ taskId: null, seriesId: "series" }];
    expect(linkCandidates(tasks, links, "t-1").map((item) => item.id)).toEqual([
      "plain",
    ]);
    expect(linkCandidates(tasks, links, "gym")).toEqual([]);
  });
});

function counter(overrides: Partial<Counter> = {}): Counter {
  return {
    id: "counter",
    name: "Gym",
    spaceId: null,
    countsSpaceTasks: false,
    frequency: "weekly",
    interval: 1,
    target: 4,
    timeZone: "UTC",
    showInToday: true,
    status: "active",
    today: "2026-11-27",
    period: {
      start: "2026-11-23",
      end: "2026-11-29",
      completed: 3,
      skipped: 0,
      failed: 0,
      isOpen: true,
    },
    pendingChange: null,
    stats: { totalDays: 0, streak: 0 },
    week: [],
    ...overrides,
  };
}

function day(overrides: Partial<CounterDay> = {}): CounterDay {
  return {
    date: "2026-11-27",
    tracked: true,
    loggable: true,
    fill: "empty",
    capacity: 1,
    completed: 0,
    skipped: 0,
    failed: 0,
    canComplete: false,
    canMark: false,
    occurrences: [],
    ...overrides,
  };
}

function task(overrides: Partial<Task>): Task {
  return {
    id: "task",
    summary: "Task",
    taskKey: "T-9",
    status: TaskStatus.TODO,
    seriesId: null,
    ...overrides,
  } as Task;
}
