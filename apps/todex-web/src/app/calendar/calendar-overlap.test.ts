import { describe, expect, it } from "vitest";

import {
  eventUsesSameStartColumnLayout,
  timedEventIntervalKey,
  wallClockStartKeyFromDate,
} from "./calendar-overlap";

function interval(id: string, start: Date, end: Date) {
  return {
    key: timedEventIntervalKey(id, start),
    wallStart: wallClockStartKeyFromDate(start),
    start,
    end,
  };
}

describe("eventUsesSameStartColumnLayout", () => {
  const background = interval(
    "bg",
    new Date(2026, 9, 7, 9, 0),
    new Date(2026, 9, 7, 18, 0),
  );
  const sameStartShort = interval(
    "short",
    new Date(2026, 9, 7, 9, 0),
    new Date(2026, 9, 7, 10, 0),
  );
  const lateOverlap = interval(
    "late",
    new Date(2026, 9, 7, 11, 0),
    new Date(2026, 9, 7, 12, 0),
  );

  it("narrows a shorter event that starts with a longer peer", () => {
    expect(eventUsesSameStartColumnLayout(sameStartShort, [background])).toBe(true);
  });

  it("keeps the longer same-start event full width", () => {
    expect(eventUsesSameStartColumnLayout(background, [sameStartShort])).toBe(false);
  });

  it("keeps full width when the overlap starts later", () => {
    expect(eventUsesSameStartColumnLayout(lateOverlap, [background])).toBe(false);
    expect(eventUsesSameStartColumnLayout(background, [lateOverlap])).toBe(false);
  });

  it("keeps equal-duration same-start peers full width", () => {
    const twin = interval(
      "twin",
      new Date(2026, 9, 7, 9, 0),
      new Date(2026, 9, 7, 10, 0),
    );
    expect(eventUsesSameStartColumnLayout(sameStartShort, [twin])).toBe(false);
  });
});
