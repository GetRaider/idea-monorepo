import { describe, expect, it } from "vitest";

import {
  DICTATION_WAVEFORM_BAR_COUNT,
  createIdleWaveformLevels,
  getRmsAmplitude,
  pushWaveformLevel,
} from "./dictation-waveform.helper";

describe("dictation waveform", () => {
  it("starts as a quiet bar row", () => {
    const levels = createIdleWaveformLevels();
    expect(levels).toHaveLength(DICTATION_WAVEFORM_BAR_COUNT);
    expect(levels.every((level) => level === 0.08)).toBe(true);
  });

  it("returns zero amplitude for silence", () => {
    expect(getRmsAmplitude(new Uint8Array(8).fill(128))).toBe(0);
    expect(getRmsAmplitude(new Uint8Array())).toBe(0);
  });

  it("shifts in a boosted amplitude and drops the oldest bar", () => {
    const seeded = Array.from({ length: DICTATION_WAVEFORM_BAR_COUNT }, (_, index) =>
      index === 0 ? 1 : 0,
    );
    const next = pushWaveformLevel(seeded, 0.2);
    expect(next).toHaveLength(DICTATION_WAVEFORM_BAR_COUNT);
    expect(next[0]).toBe(0);
    expect(next[next.length - 1]).toBeCloseTo(0.9);
  });
});
