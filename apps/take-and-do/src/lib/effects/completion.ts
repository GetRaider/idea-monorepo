/**
 * Small UX flourishes around marking a task as Done:
 *  - {@link playCompletionChime} plays a short two-tone synthesized chime via
 *    Web Audio. No asset is needed.
 *  - {@link withSmoothLayout} runs a state mutation inside
 *    `document.startViewTransition` (when supported) so the layout change
 *    animates between snapshots. Pair with `view-transition-name` on each row /
 *    card you want the browser to track across the transition.
 */

import { flushSync } from "react-dom";

type AudioContextCtor = typeof AudioContext;

let cachedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor: AudioContextCtor | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextCtor })
      .webkitAudioContext;
  if (!Ctor) return null;
  if (!cachedCtx) {
    try {
      cachedCtx = new Ctor();
    } catch {
      return null;
    }
  }
  return cachedCtx;
}

/**
 * Play a short, gently-rising "chime" to confirm task completion. Safe to call
 * from inside an event handler; silently no-ops on platforms without Web Audio
 * or when the user hasn't yet interacted with the page (browsers gate audio
 * playback on gesture).
 */
export function playCompletionChime() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    void ctx.resume().catch(() => {});
  }
  const now = ctx.currentTime;
  // Two short tones: D5 → A5 (ascending fifth) — pleasant, not jarring.
  playTone(ctx, 587.33, now, 0.08);
  playTone(ctx, 880.0, now + 0.07, 0.16);
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  startAt: number,
  duration: number,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = frequency;
  // Quick attack/decay envelope so the tones don't click.
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(0.18, startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.02);
}

/**
 * Run `mutate` inside a View Transition so the browser animates from the
 * pre-mutation DOM snapshot to the post-mutation one. Falls back to a plain
 * call when the API isn't available (Firefox, Safari < 18, etc.).
 *
 * The mutation is wrapped in `flushSync` so React commits before the API
 * captures the second snapshot.
 */
export function withSmoothLayout(mutate: () => void): void {
  if (typeof document === "undefined") {
    mutate();
    return;
  }
  // `startViewTransition` may be unavailable depending on browser; access via a
  // permissive cast to avoid stale lib typings issues.
  const startViewTransition = (
    document as Document & {
      startViewTransition?: (cb: () => void) => unknown;
    }
  ).startViewTransition;
  if (typeof startViewTransition !== "function") {
    mutate();
    return;
  }
  startViewTransition.call(document, () => {
    flushSync(mutate);
  });
}
