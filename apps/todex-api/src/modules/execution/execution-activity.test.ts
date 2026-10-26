import { describe, expect, it } from "vitest";

import {
  allocateSessionSpans,
  buildExecutionActivity,
} from "./execution-activity";

describe("execution activity", () => {
  it("splits tracked time across local days and groups a section separately", () => {
    const report = buildExecutionActivity({
      from: "2026-10-07",
      to: "2026-10-08",
      timeZone: "UTC",
      spaceId: null,
      now: new Date("2026-10-08T12:00:00.000Z"),
      slices: [
        {
          sessionId: "session-1",
          spaceId: "board-1",
          spaceName: "Software Growth",
          sectionId: "area-default",
          sectionName: "General",
          isDefaultSection: true,
          intervals: [
            {
              startedAt: "2026-10-07T23:30:00.000Z",
              endedAt: "2026-10-08T01:00:00.000Z",
            },
          ],
        },
        {
          sessionId: "session-1",
          spaceId: "board-1",
          spaceName: "Software Growth",
          sectionId: "area-design",
          sectionName: "Design",
          isDefaultSection: false,
          intervals: [
            {
              startedAt: "2026-10-08T02:00:00.000Z",
              endedAt: "2026-10-08T02:30:00.000Z",
            },
          ],
        },
      ],
    });

    expect(report.days).toEqual([
      { date: "2026-10-07", seconds: 30 * 60 },
      { date: "2026-10-08", seconds: 90 * 60 },
    ]);
    expect(report.executionSeconds).toBe(120 * 60);
    expect(report.sessionCount).toBe(1);
    expect(report.activeDays).toBe(2);
    expect(report.rangeDays).toBe(2);
    expect(report.activities.map((activity) => activity.label)).toEqual([
      "Software Growth",
      "Software Growth · Design",
    ]);
  });

  it("keeps the board list when a board filter hides its time", () => {
    const report = buildExecutionActivity({
      from: "2026-10-07",
      to: "2026-10-07",
      timeZone: "UTC",
      spaceId: "board-2",
      now: new Date("2026-10-07T18:00:00.000Z"),
      slices: [
        slice("session-1", "board-1", "Growth", 60 * 60),
        slice("session-2", "board-2", "Search", 30 * 60),
      ],
    });

    expect(report.spaces.map((space) => space.name)).toEqual([
      "Growth",
      "Search",
    ]);
    expect(report.executionSeconds).toBe(30 * 60);
    expect(report.activities).toEqual([
      { id: "board-2", label: "Search", seconds: 30 * 60 },
    ]);
  });

  it("allocates an edited duration in proportion to tracked time", () => {
    expect(allocateSessionSpans([120, 60], 180)).toEqual([120, 60]);
    expect(allocateSessionSpans([0, 0], 90)).toEqual([90, 0]);
    expect(allocateSessionSpans([1, 1], 5)).toEqual([2, 3]);
  });
});

function slice(
  sessionId: string,
  spaceId: string,
  spaceName: string,
  seconds: number,
) {
  return {
    sessionId,
    spaceId,
    spaceName,
    sectionId: `${spaceId}-area`,
    sectionName: "General",
    isDefaultSection: true,
    intervals: [
      {
        startedAt: "2026-10-07T09:00:00.000Z",
        endedAt: new Date(
          Date.parse("2026-10-07T09:00:00.000Z") + seconds * 1000,
        ).toISOString(),
      },
    ],
  };
}
