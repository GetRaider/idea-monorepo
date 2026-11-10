import { describe, expect, it } from "vitest";

import type { CalendarBlock } from "./calendar-blocks";
import { lanePlacements } from "./calendar-overlap";

describe("lane placements", () => {
  const day = new Date(2026, 9, 7, 9, 0);

  it("keeps planned and actual in separate halves", () => {
    const placements = lanePlacements(
      [
        block("planned-1", "planned", day, hours(day, 1), null),
        block("actual-1", "actual", hours(day, 0.5), hours(day, 1.5), "session-1"),
      ],
      "both",
    );
    expect(placements.get("planned-1")).toEqual({ left: "0%", width: "50%" });
    expect(placements.get("actual-1")).toEqual({ left: "50%", width: "50%" });
  });

  it("gives every slice of one session the same column", () => {
    const placements = lanePlacements(
      [
        block("slice-a", "actual", day, hours(day, 1), "session-1"),
        block("slice-b", "actual", hours(day, 2), hours(day, 3), "session-1"),
        block("other", "actual", hours(day, 0.5), hours(day, 1.5), "session-2"),
      ],
      "actual",
    );
    expect(placements.get("slice-a")?.left).toBe(placements.get("slice-b")?.left);
    expect(placements.get("slice-a")?.left).not.toBe(placements.get("other")?.left);
  });

  it("packs two overlapping planned events inside the left half", () => {
    const placements = lanePlacements(
      [
        block("one", "planned", day, hours(day, 2), null),
        block("two", "planned", hours(day, 1), hours(day, 3), null),
      ],
      "both",
    );
    expect(placements.get("one")).toEqual({ left: "0%", width: "25%" });
    expect(placements.get("two")).toEqual({ left: "25%", width: "25%" });
  });

  it("gives two overlapping sessions two columns", () => {
    const placements = lanePlacements(
      [
        block("left", "actual", day, hours(day, 2), "session-1"),
        block("right", "actual", hours(day, 1), hours(day, 3), "session-2"),
      ],
      "actual",
    );
    expect(placements.get("left")?.width).toBe("50%");
    expect(placements.get("right")?.width).toBe("50%");
  });
});

function hours(date: Date, count: number) {
  return new Date(date.getTime() + count * 60 * 60 * 1000);
}

function block(
  key: string,
  lane: CalendarBlock["lane"],
  start: Date,
  end: Date,
  sessionId: string | null,
): CalendarBlock {
  return {
    key,
    kind: sessionId ? "session" : "event",
    lane,
    eventId: sessionId ? null : key,
    taskId: null,
    sessionId,
    title: key,
    description: "",
    start,
    end,
    allDay: false,
    color: "#7c7c86",
    rsvpStatus: null,
    originalStart: null,
    readOnly: sessionId != null,
    series: false,
    seriesEventId: null,
    spaceId: null,
  };
}
