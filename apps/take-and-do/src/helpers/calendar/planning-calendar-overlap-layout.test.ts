import { describe, expect, it } from "vitest";

import {
  eventUsesSameStartColumnLayout,
  findSourceEventForFcInstance,
  timedEventIntervalKey,
  wallClockStartKeyFromIso,
} from "./planning-calendar-overlap-layout";

function interval(
  id: string,
  start: string,
  end: string,
): { key: string; wallStart: string; start: Date; end: Date } {
  const startDate = new Date(start);
  return {
    key: timedEventIntervalKey(id, startDate),
    wallStart: wallClockStartKeyFromIso(start),
    start: startDate,
    end: new Date(end),
  };
}

describe("wallClockStartKeyFromIso", () => {
  it("uses local wall-clock fields from parsed dates", () => {
    const date = new Date(2026, 4, 19, 9, 15, 0);
    expect(wallClockStartKeyFromIso(date.toISOString())).toBe(
      "2026-05-19T09:15",
    );
  });
});

describe("findSourceEventForFcInstance", () => {
  it("disambiguates recurring rows by wall-clock start", () => {
    const sources = [
      {
        id: "work",
        type: "common" as const,
        title: "Work",
        start: "2026-05-19T09:15:00",
        end: "2026-05-19T23:45:00",
        allDay: false,
      },
      {
        id: "work",
        type: "common" as const,
        title: "Work",
        start: "2026-05-20T09:15:00",
        end: "2026-05-20T23:45:00",
        allDay: false,
      },
    ];
    const match = findSourceEventForFcInstance(
      sources,
      "work",
      new Date(2026, 4, 20, 9, 15, 0),
    );
    expect(match?.start).toBe("2026-05-20T09:15:00");
  });
});

describe("eventUsesSameStartColumnLayout", () => {
  const background = interval(
    "bg",
    "2026-05-19T09:15:00",
    "2026-05-19T23:45:00",
  );
  const sameStartShort = interval(
    "short",
    "2026-05-19T09:15:00",
    "2026-05-19T10:00:00",
  );
  const lateOverlap = interval(
    "brunch",
    "2026-05-19T11:00:00",
    "2026-05-19T11:30:00",
  );

  it("narrows shorter same-start overlap that covers peer header", () => {
    expect(eventUsesSameStartColumnLayout(sameStartShort, [background])).toBe(
      true,
    );
  });

  it("keeps full width for longer same-start background", () => {
    expect(eventUsesSameStartColumnLayout(background, [sameStartShort])).toBe(
      false,
    );
  });

  it("keeps full width when overlap starts after peer start", () => {
    expect(eventUsesSameStartColumnLayout(lateOverlap, [background])).toBe(
      false,
    );
  });

  it("does not narrow equal-duration same-start peers", () => {
    const twin = interval("twin", "2026-05-19T09:15:00", "2026-05-19T10:00:00");
    expect(eventUsesSameStartColumnLayout(sameStartShort, [twin])).toBe(false);
  });

  it("returns false when there is no overlap", () => {
    const solo = interval("solo", "2026-05-19T14:00:00", "2026-05-19T15:00:00");
    const earlier = interval(
      "earlier",
      "2026-05-19T08:00:00",
      "2026-05-19T09:00:00",
    );
    expect(eventUsesSameStartColumnLayout(solo, [earlier])).toBe(false);
    expect(eventUsesSameStartColumnLayout(solo, [])).toBe(false);
  });

  it("background stays full width when only late overlaps exist", () => {
    expect(eventUsesSameStartColumnLayout(background, [lateOverlap])).toBe(
      false,
    );
  });

  it("detects same start when peer ISO parses to the same wall clock", () => {
    const start = new Date(2026, 4, 19, 9, 15, 0);
    const zuluBackground = {
      key: timedEventIntervalKey("bg", start),
      wallStart: wallClockStartKeyFromIso(start.toISOString()),
      start: new Date(start.toISOString()),
      end: new Date(2026, 4, 19, 23, 45, 0),
    };
    expect(
      eventUsesSameStartColumnLayout(sameStartShort, [zuluBackground]),
    ).toBe(true);
  });
});
