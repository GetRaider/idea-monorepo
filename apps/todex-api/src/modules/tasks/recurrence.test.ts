import { describe, expect, it } from "vitest";

import {
  addCalendarDays,
  formatOccurrenceLocalKey,
  formatTaskRecurrence,
  occurrenceKey,
} from "@repo/api/todex";
import type { TaskRecurrence } from "@repo/api/todex";

describe("occurrence keys", () => {
  it("keeps local clock time across a DST spring-forward", () => {
    const before = new Date("2026-03-07T14:00:00.000Z");
    const next = addCalendarDays(before, 1, "America/New_York");
    expect(formatOccurrenceLocalKey(before, "America/New_York")).toBe(
      "2026-03-07T09:00",
    );
    expect(formatOccurrenceLocalKey(next, "America/New_York")).toBe(
      "2026-03-08T09:00",
    );
    expect(occurrenceKey(2, next, "America/New_York")).toBe(
      "2/2026-03-08T09:00",
    );
    expect(occurrenceKey(1, next, "America/New_York")).not.toBe(
      occurrenceKey(2, next, "America/New_York"),
    );
  });
});

describe("formatTaskRecurrence", () => {
  it("describes weekdays, interval, and remaining count", () => {
    expect(
      formatTaskRecurrence(
        rule({
          interval: 2,
          weekdays: ["MO", "WE", "FR"],
          end: { type: "count", count: 4 },
        }),
      ),
    ).toBe("Every 2 weeks on Mon, Wed, Fri, 4 times left");
  });
});

function rule(overrides: Partial<TaskRecurrence>): TaskRecurrence {
  return {
    frequency: "weekly",
    interval: 1,
    weekdays: ["MO"],
    timeZone: "UTC",
    end: { type: "never" },
    ...overrides,
  };
}
