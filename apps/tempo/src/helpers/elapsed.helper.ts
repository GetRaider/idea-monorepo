import type { FocusRecord, TimerMode } from "../shared/records.types";
import type { MenuBarClockStyle } from "../shared/settings.types";

export function getDisplayedElapsedSeconds(
  record: Pick<
    FocusRecord,
    "accumulatedSeconds" | "segmentStartedAt" | "endedAt"
  >,
  nowMs: number,
): number {
  if (record.endedAt !== null || record.segmentStartedAt === null) {
    return record.accumulatedSeconds;
  }

  const segmentStartedMs = Date.parse(record.segmentStartedAt);
  const liveSeconds = Math.max(
    0,
    Math.floor((nowMs - segmentStartedMs) / 1000),
  );
  return record.accumulatedSeconds + liveSeconds;
}

export function getRemainingSeconds(
  elapsedSeconds: number,
  plannedSeconds: number | null,
): number | null {
  if (plannedSeconds === null) {
    return null;
  }

  return Math.max(0, plannedSeconds - elapsedSeconds);
}

export function shouldAutoStopTimer(
  elapsedSeconds: number,
  mode: TimerMode,
  plannedSeconds: number | null,
): boolean {
  if (mode !== "timer" || plannedSeconds === null) {
    return false;
  }

  return elapsedSeconds >= plannedSeconds;
}

export function shouldNotifyStopwatchGoal(
  elapsedSeconds: number,
  mode: TimerMode,
  plannedSeconds: number | null,
): boolean {
  if (mode !== "stopwatch" || plannedSeconds === null) {
    return false;
  }

  return elapsedSeconds >= plannedSeconds;
}

export function foldRunningSegment(
  record: Pick<FocusRecord, "accumulatedSeconds" | "segmentStartedAt">,
  nowMs: number,
): { accumulatedSeconds: number; segmentStartedAt: null } {
  if (record.segmentStartedAt === null) {
    return {
      accumulatedSeconds: record.accumulatedSeconds,
      segmentStartedAt: null,
    };
  }

  return {
    accumulatedSeconds: getDisplayedElapsedSeconds(
      { ...record, endedAt: null },
      nowMs,
    ),
    segmentStartedAt: null,
  };
}

export function formatClock(totalSeconds: number): string {
  const clampedSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(clampedSeconds / 3600);
  const minutes = Math.floor((clampedSeconds % 3600) / 60);
  const seconds = clampedSeconds % 60;
  const paddedMinutes = String(minutes).padStart(2, "0");
  const paddedSeconds = String(seconds).padStart(2, "0");

  if (hours > 0) {
    return `${hours}:${paddedMinutes}:${paddedSeconds}`;
  }

  return `${paddedMinutes}:${paddedSeconds}`;
}

export function formatTimerClock(totalSeconds: number): string {
  const clampedSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(clampedSeconds / 60);
  const seconds = clampedSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatMenuBarClock(
  record: Pick<
    FocusRecord,
    | "accumulatedSeconds"
    | "segmentStartedAt"
    | "endedAt"
    | "mode"
    | "plannedSeconds"
  > | null,
  nowMs: number,
  style: MenuBarClockStyle = "auto",
): string {
  if (record === null) {
    return "";
  }

  const elapsedSeconds = getDisplayedElapsedSeconds(record, nowMs);
  const remainingSeconds = getRemainingSeconds(
    elapsedSeconds,
    record.plannedSeconds,
  );
  const displayedSeconds = resolveMenuBarSeconds(
    style,
    record.mode,
    elapsedSeconds,
    remainingSeconds,
  );
  const clock = formatClock(displayedSeconds);
  const isPaused = record.endedAt === null && record.segmentStartedAt === null;

  if (isPaused) {
    return `(${clock})`;
  }

  return clock;
}

function resolveMenuBarSeconds(
  style: MenuBarClockStyle,
  mode: TimerMode,
  elapsedSeconds: number,
  remainingSeconds: number | null,
): number {
  if (style === "elapsed" || remainingSeconds === null) {
    return elapsedSeconds;
  }

  if (style === "remaining") {
    return remainingSeconds;
  }

  return mode === "timer" ? remainingSeconds : elapsedSeconds;
}

export function formatHmsClock(totalSeconds: number): string {
  const clampedSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(clampedSeconds / 3600);
  const minutes = Math.floor((clampedSeconds % 3600) / 60);
  const seconds = clampedSeconds % 60;

  return [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0"),
  ].join(":");
}
