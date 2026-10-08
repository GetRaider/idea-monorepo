import { describe, expect, it } from "vitest";
import { closeOpenIntervals, sumIntervalSeconds } from "@repo/api/todex";

import { resolveSessionDuration } from "./execution.service";

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
