import { describe, expect, it } from "vitest";
import { closeOpenIntervals, sumIntervalSeconds } from "@repo/api/todex";

import {
  intervalsOverlapRange,
  isTitleOnlySessionUpdate,
  normalizeSessionTitle,
  resolveSessionDuration,
} from "./execution.service";
import { assertOneSpace, withoutTaskId } from "../calendar/calendar-scope";

describe("resolveSessionDuration", () => {
  const startedAt = new Date("2026-10-07T10:00:00.000Z");
  const endedAt = new Date("2026-10-07T10:25:00.000Z");

  it("uses wall clock when the client omits a duration", () => {
    expect(resolveSessionDuration(startedAt, endedAt, undefined)).toBe(1500);
  });

  it("keeps a shorter focused duration from a pause", () => {
    expect(resolveSessionDuration(startedAt, endedAt, 600)).toBe(600);
  });

  it("clamps a duration past the session window", () => {
    expect(resolveSessionDuration(startedAt, endedAt, 9999)).toBe(1500);
  });
});

describe("execution intervals", () => {
  const now = new Date("2026-10-07T10:10:00.000Z");

  it("sums closed intervals and the open one", () => {
    expect(
      sumIntervalSeconds(
        [
          {
            startedAt: "2026-10-07T10:00:00.000Z",
            endedAt: "2026-10-07T10:05:00.000Z",
          },
          { startedAt: "2026-10-07T10:08:00.000Z", endedAt: null },
        ],
        now,
      ),
    ).toBe(420);
  });

  it("closes only the open interval", () => {
    expect(
      closeOpenIntervals(
        [
          {
            startedAt: "2026-10-07T10:00:00.000Z",
            endedAt: "2026-10-07T10:05:00.000Z",
          },
          { startedAt: "2026-10-07T10:08:00.000Z", endedAt: null },
        ],
        now,
      ),
    ).toEqual([
      {
        startedAt: "2026-10-07T10:00:00.000Z",
        endedAt: "2026-10-07T10:05:00.000Z",
      },
      {
        startedAt: "2026-10-07T10:08:00.000Z",
        endedAt: "2026-10-07T10:10:00.000Z",
      },
    ]);
  });
});

describe("session space and title", () => {
  it("rejects mixed spaces and strips a moved task from scope", () => {
    expect(() =>
      assertOneSpace([
        { spaceId: "space-a" },
        { spaceId: "space-b" },
      ]),
    ).toThrow("Tasks must belong to one space");
    expect(assertOneSpace([{ spaceId: "space-a" }, { spaceId: "space-a" }])).toBe(
      "space-a",
    );
    expect(withoutTaskId(["task-1", "task-2"], "task-1")).toEqual(["task-2"]);
  });

  it("treats a title-only patch as leaving intervals alone", () => {
    const intervals = [
      {
        startedAt: "2026-10-07T10:00:00.000Z",
        endedAt: "2026-10-07T10:20:00.000Z",
      },
    ];
    const before = JSON.stringify(intervals);
    expect(isTitleOnlySessionUpdate({ title: "  Focus  " })).toBe(true);
    expect(normalizeSessionTitle("  Focus  ")).toBe("Focus");
    expect(normalizeSessionTitle("   ")).toBeNull();
    expect(JSON.stringify(intervals)).toBe(before);
    expect(
      isTitleOnlySessionUpdate({
        title: "Focus",
        startedAt: intervals[0]!.startedAt,
        endedAt: intervals[0]!.endedAt,
      }),
    ).toBe(false);
  });

  it("returns a session that overlaps the range and skips one that does not", () => {
    const from = new Date("2026-10-07T12:00:00.000Z");
    const to = new Date("2026-10-07T18:00:00.000Z");
    expect(
      intervalsOverlapRange(
        [
          {
            startedAt: "2026-10-07T11:00:00.000Z",
            endedAt: "2026-10-07T12:30:00.000Z",
          },
        ],
        from,
        to,
      ),
    ).toBe(true);
    expect(
      intervalsOverlapRange(
        [
          {
            startedAt: "2026-10-07T08:00:00.000Z",
            endedAt: "2026-10-07T09:00:00.000Z",
          },
        ],
        from,
        to,
      ),
    ).toBe(false);
  });
});
