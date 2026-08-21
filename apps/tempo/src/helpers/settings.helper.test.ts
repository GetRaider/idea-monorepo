import { describe, expect, it } from "vitest";

import {
  DEFAULT_APP_SETTINGS,
  mergeAppSettings,
  parseStoredSettings,
  resolveDurationMinutes,
} from "./settings.helper";

describe("parseStoredSettings", () => {
  it("falls back to defaults for junk", () => {
    expect(parseStoredSettings(null)).toEqual(DEFAULT_APP_SETTINGS);
    expect(parseStoredSettings("nope")).toEqual(DEFAULT_APP_SETTINGS);
  });

  it("keeps valid overlay values", () => {
    expect(
      parseStoredSettings({
        defaultMode: "timer",
        durationPreset: "50",
        soundVolume: 0.4,
      }),
    ).toMatchObject({
      defaultMode: "timer",
      durationPreset: "50",
      soundVolume: 0.4,
      confirmOnStop: true,
    });
  });
});

describe("mergeAppSettings", () => {
  it("ignores invalid patch fields", () => {
    const merged = mergeAppSettings(DEFAULT_APP_SETTINGS, {
      defaultMode: "nope" as never,
      soundVolume: 4,
      lastDurationMinutes: 0,
    });
    expect(merged.defaultMode).toBe("stopwatch");
    expect(merged.soundVolume).toBe(1);
    expect(merged.lastDurationMinutes).toBe(1);
  });
});

describe("resolveDurationMinutes", () => {
  it("uses last duration for the last preset", () => {
    expect(
      resolveDurationMinutes({
        ...DEFAULT_APP_SETTINGS,
        durationPreset: "last",
        lastDurationMinutes: 12,
      }),
    ).toBe(12);
  });

  it("uses fixed presets", () => {
    expect(
      resolveDurationMinutes({ ...DEFAULT_APP_SETTINGS, durationPreset: "25" }),
    ).toBe(25);
    expect(
      resolveDurationMinutes({ ...DEFAULT_APP_SETTINGS, durationPreset: "50" }),
    ).toBe(50);
  });
});
