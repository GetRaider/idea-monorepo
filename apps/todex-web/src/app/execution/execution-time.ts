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

export type FocusMode = "timer" | "stopwatch";
