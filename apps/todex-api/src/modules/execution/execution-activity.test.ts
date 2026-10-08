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
      boardId: null,
      now: new Date("2026-10-08T12:00:00.000Z"),
      slices: [
        {
          sessionId: "session-1",
          boardId: "board-1",
          boardName: "Software Growth",
          areaId: "area-default",
          areaName: "General",
          isDefaultArea: true,
          intervals: [
            {
              startedAt: "2026-10-07T23:30:00.000Z",
              endedAt: "2026-10-08T01:00:00.000Z",
            },
          ],
        },
        {
          sessionId: "session-1",
          boardId: "board-1",
          boardName: "Software Growth",
          areaId: "area-design",
          areaName: "Design",
          isDefaultArea: false,
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
      boardId: "board-2",
      now: new Date("2026-10-07T18:00:00.000Z"),
      slices: [
        slice("session-1", "board-1", "Growth", 60 * 60),
        slice("session-2", "board-2", "Search", 30 * 60),
      ],
    });

    expect(report.boards.map((board) => board.name)).toEqual([
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
  boardId: string,
  boardName: string,
  seconds: number,
) {
  return {
    sessionId,
    boardId,
    boardName,
    areaId: `${boardId}-area`,
    areaName: "General",
    isDefaultArea: true,
    intervals: [
      {
        startedAt: "2026-10-07T09:00:00.000Z",
        endedAt: new Date(Date.parse("2026-10-07T09:00:00.000Z") + seconds * 1000).toISOString(),
      },
    ],
  };
}
