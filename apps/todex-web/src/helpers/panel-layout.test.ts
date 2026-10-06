import { describe, expect, it } from "vitest";

import {
  clampPanelWidth,
  parseStoredPanelWidth,
  parseTaskViewMode,
  TASK_PANEL_DEFAULT_WIDTH,
  TASK_PANEL_MAX_WIDTH,
  TASK_PANEL_MIN_WIDTH,
} from "./panel-layout";

describe("clampPanelWidth", () => {
  it("keeps a width inside the range", () => {
    expect(clampPanelWidth(400, 360, 720)).toBe(400);
  });

  it("clamps below the minimum and above the maximum", () => {
    expect(clampPanelWidth(10, 180, 360)).toBe(180);
    expect(clampPanelWidth(900, 360, 720)).toBe(720);
  });

  it("rounds fractional pixels and rejects non-finite values", () => {
    expect(clampPanelWidth(480.6, 360, 720)).toBe(481);
    expect(clampPanelWidth(Number.NaN, 360, 720)).toBe(360);
  });
});

describe("parseStoredPanelWidth", () => {
  it("falls back when storage is empty", () => {
    expect(
      parseStoredPanelWidth(
        null,
        TASK_PANEL_DEFAULT_WIDTH,
        TASK_PANEL_MIN_WIDTH,
        TASK_PANEL_MAX_WIDTH,
      ),
    ).toBe(TASK_PANEL_DEFAULT_WIDTH);
  });

  it("clamps a stored width", () => {
    expect(
      parseStoredPanelWidth(
        "9999",
        TASK_PANEL_DEFAULT_WIDTH,
        TASK_PANEL_MIN_WIDTH,
        TASK_PANEL_MAX_WIDTH,
      ),
    ).toBe(TASK_PANEL_MAX_WIDTH);
  });
});

describe("parseTaskViewMode", () => {
  it("accepts fullscreen and defaults everything else to docked", () => {
    expect(parseTaskViewMode("fullscreen")).toBe("fullscreen");
    expect(parseTaskViewMode("docked")).toBe("docked");
    expect(parseTaskViewMode(null)).toBe("docked");
    expect(parseTaskViewMode("modal")).toBe("docked");
  });
});
