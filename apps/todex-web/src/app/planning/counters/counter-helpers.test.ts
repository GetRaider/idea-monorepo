import { describe, expect, it } from "vitest";
import { TaskStatus } from "@repo/api/todex";
import type { Counter, CounterDay, Task } from "@repo/api/todex";

import {
  dayLabel,
  formatLocalDate,
  isSkipCovered,
  linkCandidates,
  progressLabel,
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

describe("isSkipCovered", () => {
  it("blocks skipping once completions and skips reach the Target", () => {
    expect(isSkipCovered(counter())).toBe(false);
    expect(isSkipCovered(counter({ target: 3 }))).toBe(true);
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
    week: [],
    ...overrides,
  };
}

function day(overrides: Partial<CounterDay> = {}): CounterDay {
  return {
    date: "2026-11-27",
    fill: "empty",
    completed: 0,
    skipped: 0,
    failed: 0,
    loggable: true,
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
