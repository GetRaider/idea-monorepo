export function formatClock(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  const paddedMinutes = String(minutes).padStart(2, "0");
  const paddedSeconds = String(remainder).padStart(2, "0");
  if (hours > 0) return `${hours}:${paddedMinutes}:${paddedSeconds}`;
  return `${paddedMinutes}:${paddedSeconds}`;
}

export function formatDuration(totalSeconds: number | null) {
  if (totalSeconds == null) return "—";
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

export function focusSeconds(input: {
  mode: FocusMode;
  elapsedSeconds: number;
  goalMinutes: number;
}) {
  if (input.mode === "stopwatch") return input.elapsedSeconds;
  return Math.max(0, input.goalMinutes * 60 - input.elapsedSeconds);
}

const MAX_GOAL_MINUTES = 24 * 60;

export function extendGoalMinutes(input: {
  goalMinutes: number;
  elapsedSeconds: number;
  addMinutes: number;
}) {
  if (!Number.isFinite(input.addMinutes) || input.addMinutes <= 0) {
    return input.goalMinutes;
  }
  const elapsedMinutes = Math.ceil(Math.max(0, input.elapsedSeconds) / 60);
  const base = Math.max(Math.ceil(input.goalMinutes), elapsedMinutes);
  if (base >= MAX_GOAL_MINUTES) return base;
  return Math.min(MAX_GOAL_MINUTES, base + Math.floor(input.addMinutes));
}

export type FocusMode = "timer" | "stopwatch";
