export const DICTATION_WAVEFORM_BAR_COUNT = 14;
export const DICTATION_WAVEFORM_GAIN = 4.5;
export const DICTATION_WAVEFORM_SAMPLE_INTERVAL_MS = 110;

export function createIdleWaveformLevels(): number[] {
  return Array.from({ length: DICTATION_WAVEFORM_BAR_COUNT }, () => 0.08);
}

export function getRmsAmplitude(timeDomainData: Uint8Array): number {
  if (timeDomainData.length === 0) {
    return 0;
  }

  let sumSquares = 0;
  for (const sample of timeDomainData) {
    const centered = (sample - 128) / 128;
    sumSquares += centered * centered;
  }
  return Math.sqrt(sumSquares / timeDomainData.length);
}

export function pushWaveformLevel(levels: number[], amplitude: number): number[] {
  const nextLevel = Math.min(1, Math.max(0, amplitude * DICTATION_WAVEFORM_GAIN));
  return [...levels.slice(1), nextLevel];
}
