import { describe, expect, it } from "vitest";

import {
  DURATION_PRESET_MINUTES,
  combineDurationHms,
  formatDurationChipLabel,
  formatDurationHms,
  isPresetDurationMinutes,
  isPresetDurationSeconds,
  splitDurationHms,
} from "./duration-preset.helper";

describe("duration presets", () => {
  it("uses 10, 30, and 60 minutes", () => {
    expect([...DURATION_PRESET_MINUTES]).toEqual([10, 30, 60]);
  });

  it("labels 60 minutes as 1h", () => {
    expect(formatDurationChipLabel(10)).toBe("10m");
    expect(formatDurationChipLabel(30)).toBe("30m");
    expect(formatDurationChipLabel(60)).toBe("1h");
  });

  it("treats non-preset values as custom", () => {
    expect(isPresetDurationMinutes(10)).toBe(true);
    expect(isPresetDurationMinutes(12)).toBe(false);
    expect(isPresetDurationMinutes(0)).toBe(false);
    expect(isPresetDurationSeconds(600)).toBe(true);
    expect(isPresetDurationSeconds(630)).toBe(false);
  });

  it("splits and formats hour-minute-second parts", () => {
    expect(splitDurationHms(750)).toEqual({ hours: 0, minutes: 12, seconds: 30 });
    expect(combineDurationHms(0, 12, 30)).toBe(750);
    expect(formatDurationHms(750)).toBe("00:12:30");
    expect(formatDurationHms(3600)).toBe("01:00:00");
  });
});
