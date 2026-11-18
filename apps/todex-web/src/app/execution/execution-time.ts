import { TaskStatus, sumIntervalSeconds } from "@repo/api/todex";

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

export function formatSessionClock(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return [hours, minutes, remainder]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
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

export function sessionElapsedSeconds(
  tasks: Array<{ intervals: SessionInterval[] }>,
  now: Date,
) {
  return tasks.reduce(
    (total, task) => total + sumIntervalSeconds(task.intervals, now),
    0,
  );
}

export function queuedStartIds(
  queueIds: string[],
  selectedIds: string[],
  explicit: boolean,
) {
  if (!explicit) return queueIds;
  const selected = new Set(selectedIds);
  return queueIds.filter((taskId) => selected.has(taskId));
}

export function sessionTaskPhase(status: string): ExecutionWorkPhase {
  if (status === TaskStatus.DONE) return "completed";
  if (status === TaskStatus.IN_PROGRESS) return "in_progress";
  return "pending";
}

export function sessionCompletion(tasks: Array<{ status: string }>) {
  const completed = tasks.filter(
    (task) => task.status === TaskStatus.DONE,
  ).length;
  const total = tasks.length;
  return {
    completed,
    total,
    ratio: total === 0 ? 0 : completed / total,
  };
}

export function selectedSessionTaskId(input: {
  sessionId: string;
  queryTaskId: string | null;
  storedSessionId: string | null;
  storedTaskId: string | null;
  taskIds: string[];
}) {
  if (input.queryTaskId && input.taskIds.includes(input.queryTaskId)) {
    return input.queryTaskId;
  }
  if (
    input.storedSessionId === input.sessionId &&
    input.storedTaskId &&
    input.taskIds.includes(input.storedTaskId)
  ) {
    return input.storedTaskId;
  }
  return null;
}

export function executionWorkPhase(
  status: string,
  taskId: string,
  focusedTaskId: string | null,
): ExecutionWorkPhase {
  if (status === TaskStatus.DONE || status === TaskStatus.CANCELLED) {
    return "completed";
  }
  if (focusedTaskId != null && taskId === focusedTaskId) return "in_progress";
  return "pending";
}

export function sessionClockSeconds(input: {
  mode: FocusMode;
  elapsedSeconds: number;
  goalMinutes: number | null;
}) {
  if (input.mode === "stopwatch" || input.goalMinutes == null) {
    return input.elapsedSeconds;
  }
  return Math.max(0, input.goalMinutes * 60 - input.elapsedSeconds);
}

export function sessionRingProgress(input: {
  mode: FocusMode;
  elapsedSeconds: number;
  goalMinutes: number | null;
}) {
  if (input.goalMinutes == null || input.goalMinutes <= 0) return 0;
  return Math.min(1, input.elapsedSeconds / (input.goalMinutes * 60));
}

export function remainingWorkSeconds(input: {
  mode: FocusMode;
  goalMinutes: number | null;
  elapsedSeconds: number;
  incompleteEstimateMinutes: number;
}) {
  if (input.mode === "timer" && input.goalMinutes != null) {
    return Math.max(0, input.goalMinutes * 60 - input.elapsedSeconds);
  }
  return Math.max(0, input.incompleteEstimateMinutes * 60);
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

export function executionSessionTitle(input: {
  startedAt: string;
  spaceName: string | null;
}) {
  const when = new Date(input.startedAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const spaceName = input.spaceName?.trim();
  return spaceName ? `${spaceName} · ${when}` : when;
}

export type FocusMode = "timer" | "stopwatch";

export type ExecutionWorkPhase = "completed" | "in_progress" | "pending";

interface SessionInterval {
  startedAt: string;
  endedAt: string | null;
}
