import { describe, expect, it } from "vitest";
import { TaskStatus } from "@repo/api/todex";
import type { Counter, CounterDay, Task } from "@repo/api/todex";

import {
  counterMove,
  dayClickChange,
  dayLabel,
  dayShare,
  formatDayAndMonth,
  formatLocalDate,
  groupBySection,
  linkCandidates,
  placeCounter,
  scheduleDraft,
  scheduleFromDraft,
  sectionMove,
} from "./counter-helpers";

describe("scheduleDraft", () => {
  // 2026-11-27 is a Friday.
  const today = "2026-11-27";

  it("keeps the values of the current schedule", () => {
    expect(
      scheduleDraft(
        { frequency: "weekly", interval: 2, weekdays: ["MO", "WE"] },
        today,
      ),
    ).toMatchObject({
      frequency: "weekly",
      weekInterval: 2,
      weekdays: ["MO", "WE"],
    });
    expect(
      scheduleDraft({ frequency: "daily", interval: 3 }, today).dayInterval,
    ).toBe("3");
  });

  it("prefills the other repeat kinds from today", () => {
    expect(scheduleDraft({ frequency: "daily", interval: 1 }, today)).toEqual({
      frequency: "daily",
      dayInterval: "1",
      weekInterval: 1,
      weekdays: ["FR"],
      monthDay: "27",
    });
  });
});

describe("scheduleFromDraft", () => {
  const draft = scheduleDraft(
    { frequency: "daily", interval: 1 },
    "2026-11-27",
  );

  it("builds only the fields of the chosen repeat kind", () => {
    expect(scheduleFromDraft(draft)).toEqual({
      frequency: "daily",
      interval: 1,
    });
    expect(scheduleFromDraft({ ...draft, frequency: "weekly" })).toEqual({
      frequency: "weekly",
      interval: 1,
      weekdays: ["FR"],
    });
    expect(scheduleFromDraft({ ...draft, frequency: "monthly" })).toEqual({
      frequency: "monthly",
      monthDay: 27,
    });
  });

  it("is null while a value is missing or out of range", () => {
    expect(scheduleFromDraft({ ...draft, dayInterval: "" })).toBeNull();
    expect(
      scheduleFromDraft({ ...draft, frequency: "weekly", weekdays: [] }),
    ).toBeNull();
    expect(
      scheduleFromDraft({ ...draft, frequency: "monthly", monthDay: "32" }),
    ).toBeNull();
  });
});

describe("formatLocalDate", () => {
  it("never shifts the date by the viewer's time zone", () => {
    expect(formatLocalDate("2026-11-27", "en-US")).toBe("Fri, Nov 27");
    expect(formatDayAndMonth("2026-11-27", "en-US")).toBe("Nov 27");
  });
});

describe("dayLabel", () => {
  it("describes every mark on the day", () => {
    expect(
      dayLabel(day({ completed: 1, skipped: 1, failed: 2 }), "en-US"),
    ).toBe("Fri, Nov 27: 1 completed, 1 skipped, 2 failed");
    expect(dayLabel(day(), "en-US")).toBe("Fri, Nov 27: nothing logged");
    expect(dayLabel(day({ tracked: false }), "en-US")).toBe(
      "Fri, Nov 27: not scheduled",
    );
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
    expect(dayClickChange(day({ completed: 1 }))).toEqual({
      status: "empty",
    });
  });

  it("does nothing on an untouched or locked day", () => {
    expect(dayClickChange(day())).toBeNull();
    expect(dayClickChange(day({ loggable: false, completed: 1 }))).toBeNull();
  });
});

describe("dayShare", () => {
  const withDay = (overrides: Partial<CounterDay>) =>
    counter({ week: [day(overrides)] });

  it("compares full days with the Counters scheduled that day", () => {
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

describe("groupBySection", () => {
  const sections = [section("morning", 0), section("career", 1024)];

  it("follows the section order and puts unsectioned Counters last", () => {
    const groups = groupBySection(
      [
        counter({ id: "free" }),
        counter({ id: "b", sectionId: "career" }),
        counter({ id: "a", sectionId: "morning" }),
        counter({ id: "gone", sectionId: "unknown" }),
      ],
      sections,
    );
    expect(
      groups.map((group) => [
        group.name,
        group.counters.map((item) => item.id),
      ]),
    ).toEqual([
      ["morning", ["a"]],
      ["career", ["b"]],
      ["No section", ["free", "gone"]],
    ]);
  });

  it("keeps empty sections", () => {
    expect(groupBySection([], sections).map((group) => group.id)).toEqual([
      "morning",
      "career",
      "none",
    ]);
  });
});

describe("sectionMove", () => {
  const sections = [section("a", 0), section("b", 1024), section("c", 2048)];

  it("takes the place of the section it is dropped on", () => {
    expect(sectionMove(sections, "c", "b")).toBe(512);
    expect(sectionMove(sections, "a", "b")).toBe(1536);
    expect(sectionMove(sections, "a", "c")).toBe(3072);
  });

  it("goes to the end without a target", () => {
    expect(sectionMove(sections, "a", null)).toBe(3072);
  });

  it("does nothing when the order would not change", () => {
    expect(sectionMove(sections, "a", "a")).toBeNull();
    expect(sectionMove(sections, "c", null)).toBeNull();
  });
});

describe("counterMove", () => {
  const [morning, career, none] = groupBySection(
    [
      counter({ id: "a", sectionId: "morning", position: 0 }),
      counter({ id: "b", sectionId: "morning", position: 1024 }),
      counter({ id: "c", sectionId: "morning", position: 2048 }),
      counter({ id: "free", position: 3072 }),
    ],
    [section("morning", 0), section("career", 1024)],
  );

  it("places a Counter between its new neighbours", () => {
    expect(counterMove(morning!, "c", "b")).toEqual({
      sectionId: "morning",
      position: 512,
    });
    expect(counterMove(morning!, "a", null)).toEqual({
      sectionId: "morning",
      position: 3072,
    });
  });

  it("changes the section when dropped into another one", () => {
    expect(counterMove(career!, "a", null)).toEqual({
      sectionId: "career",
      position: 0,
    });
    expect(counterMove(none!, "a", "free")).toEqual({
      sectionId: null,
      position: 2048,
    });
  });

  it("does nothing when the order would not change", () => {
    expect(counterMove(morning!, "a", "a")).toBeNull();
    expect(counterMove(morning!, "a", "b")).toBeNull();
    expect(counterMove(morning!, "c", null)).toBeNull();
  });
});

describe("placeCounter", () => {
  it("moves and re-sorts the list at once", () => {
    const list = [
      counter({ id: "a", position: 0 }),
      counter({ id: "b", position: 1024 }),
    ];
    expect(
      placeCounter(list, "b", { sectionId: "career", position: -1024 }).map(
        (item) => [item.id, item.sectionId],
      ),
    ).toEqual([
      ["b", "career"],
      ["a", null],
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
    sectionId: null,
    color: "#B8A4D1",
    spaceIds: [],
    countsAnyTask: false,
    position: 0,
    schedule: { frequency: "daily", interval: 1 },
    target: 3,
    timeZone: "UTC",
    showInToday: true,
    status: "active",
    today: "2026-11-27",
    progress: {
      today: { completed: 1, target: 3 },
      nextDate: "2026-11-28",
    },
    pendingChange: null,
    stats: { totalDays: 0, streak: 0 },
    week: [],
    ...overrides,
  };
}

function section(id: string, position: number) {
  return { id, name: id, position };
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
