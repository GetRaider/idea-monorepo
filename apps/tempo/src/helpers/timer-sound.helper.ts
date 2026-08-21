let cachedContext: AudioContext | null = null;

export function unlockTimerSound(): void {
  const audioContext = getAudioContext();
  if (audioContext?.state === "suspended") {
    void audioContext.resume().catch(() => undefined);
  }
}

export function playTimerEndedSound(volume = 0.8): void {
  playPhrase(
    volume,
    [
      { frequency: 880, offset: 0, duration: 0.12, wave: "sine" },
      { frequency: 880, offset: 0.18, duration: 0.12, wave: "sine" },
      { frequency: 659.25, offset: 0.36, duration: 0.22, wave: "sine" },
    ],
    0.2,
  );
}

export function playGoalReachedSound(volume = 0.8): void {
  playPhrase(
    volume,
    [
      { frequency: 523.25, offset: 0, duration: 0.1, wave: "triangle" },
      { frequency: 659.25, offset: 0.11, duration: 0.1, wave: "triangle" },
      { frequency: 783.99, offset: 0.22, duration: 0.14, wave: "triangle" },
      { frequency: 1046.5, offset: 0.36, duration: 0.28, wave: "triangle" },
    ],
    0.16,
  );
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }

  const AudioContextClass: AudioContextConstructor | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextConstructor })
      .webkitAudioContext;

  if (!AudioContextClass) {
    return null;
  }

  if (cachedContext === null) {
    try {
      cachedContext = new AudioContextClass();
    } catch {
      return null;
    }
  }

  return cachedContext;
}

function playPhrase(
  volume: number,
  notes: SoundNote[],
  peakGainScale: number,
): void {
  const audioContext = getAudioContext();
  if (audioContext === null) {
    return;
  }

  const peakGain = peakGainScale * Math.min(1, Math.max(0, volume));
  if (peakGain <= 0) {
    return;
  }

  unlockTimerSound();
  const startAt = audioContext.currentTime;
  for (const note of notes) {
    playTone(
      audioContext,
      note.frequency,
      startAt + note.offset,
      note.duration,
      peakGain,
      note.wave,
    );
  }
}

function playTone(
  audioContext: AudioContext,
  frequency: number,
  startAt: number,
  duration: number,
  peakGain: number,
  wave: OscillatorType,
): void {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = wave;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(peakGain, startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.02);
}

type AudioContextConstructor = typeof AudioContext;

interface SoundNote {
  frequency: number;
  offset: number;
  duration: number;
  wave: OscillatorType;
}
