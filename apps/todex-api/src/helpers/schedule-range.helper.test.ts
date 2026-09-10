import { describe, expect, it } from "vitest";

import { taskBelongsToScheduleRange } from "./schedule-range.helper";

describe("taskBelongsToScheduleRange", () => {
  const from = new Date("2026-09-10T00:00:00.000Z");
  const to = new Date("2026-09-11T00:00:00.000Z");

  it("excludes a due-today task with no scheduleDate", () => {
    expect(
      taskBelongsToScheduleRange(null, from, to),
    ).toBe(false);
  });

  it("includes a scheduled-today task even if dueDate is later", () => {
    expect(
      taskBelongsToScheduleRange("2026-09-10T00:00:00.000Z", from, to),
    ).toBe(true);
  });

  it("excludes a task scheduled on the next day", () => {
    expect(
      taskBelongsToScheduleRange("2026-09-11T00:00:00.000Z", from, to),
    ).toBe(false);
  });

  it("keeps dueDate independent of the schedule window", () => {
    const fromTime = from;
    const toTime = to;
    const rows = [
      {
        id: "due-only",
        dueDate: "2026-09-10T00:00:00.000Z",
        scheduleDate: null,
      },
      {
        id: "scheduled",
        dueDate: "2026-09-17T00:00:00.000Z",
        scheduleDate: "2026-09-10T00:00:00.000Z",
      },
    ];
    const visible = rows.filter((row) =>
      taskBelongsToScheduleRange(row.scheduleDate, fromTime, toTime),
    );
    expect(visible.map((row) => row.id)).toEqual(["scheduled"]);
  });
});
