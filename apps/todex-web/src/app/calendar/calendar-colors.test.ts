import { describe, expect, it } from "vitest";

import {
  DEFAULT_EVENT_COLOR,
  DEFAULT_TASK_COLOR,
  blockColor,
  fillIsLight,
} from "./calendar-colors";

describe("blockColor", () => {
  it("uses the kind default until the user picks a color", () => {
    expect(blockColor("task", null)).toBe(DEFAULT_TASK_COLOR);
    expect(blockColor("event", null)).toBe(DEFAULT_EVENT_COLOR);
    expect(blockColor("event", "#16a34a")).toBe("#16a34a");
    expect(blockColor("task", "nope")).toBe(DEFAULT_TASK_COLOR);
  });

  it("treats the default event fill as dark enough for light text", () => {
    expect(fillIsLight(DEFAULT_EVENT_COLOR)).toBe(false);
    expect(fillIsLight("#d4d4d8")).toBe(true);
    expect(fillIsLight(DEFAULT_TASK_COLOR)).toBe(false);
  });
});
