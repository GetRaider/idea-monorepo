import type {
  ActiveBreakTimer,
  ActiveFocusTimer,
  ActiveTimer,
  BreakSession,
  FocusActionResult,
  FocusBacklogItem,
  FocusBreakSuggestion,
  FocusIdleDraft,
  FocusSession,
  FocusSessionRecord,
  FocusSessionStatus,
  FocusSystemState,
  SessionConfig,
} from "@/types/focus.types";

export const FOCUS_STORAGE_SESSIONS_KEY = "focus:v1:sessions";
export const FOCUS_STORAGE_ACTIVE_KEY = "focus:v1:active";
export const FOCUS_STORAGE_DRAFT_KEY = "focus:v1:draft";
export const FOCUS_STORAGE_BACKLOG_KEY = "focus:v1:backlog";
export const FOCUS_STORAGE_BREAK_SUGGESTION_KEY = "focus:v1:break-suggestion";

export const FOCUS_SESSION_COLORS = [
  "#f97316",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
  "#eab308",
] as const;

export const DEFAULT_IDLE_DRAFT: FocusIdleDraft = {
  sessionSelection: "new",
  selectedBacklogId: null,
  saveToBacklog: false,
  color: FOCUS_SESSION_COLORS[0],
};

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  durationMinutes: null,
  taskId: null,
  name: "",
};

export function randomFocusSessionColor(): string {
  const index = Math.floor(Math.random() * FOCUS_SESSION_COLORS.length);
  return FOCUS_SESSION_COLORS[index] ?? FOCUS_SESSION_COLORS[0];
}

export function buildDefaultFocusSessionName(
  sessions: FocusSessionRecord[],
  backlog: FocusBacklogItem[],
): string {
  const focusCount = sessions.filter(isFocusSessionRecord).length;
  return `Focus #${focusCount + backlog.length + 1}`;
}

export function formatEstimationInput(minutes: number): string {
  return `${minutes}m`;
}

export function parseEstimationInput(value: string): number | null {
  const trimmed = value.trim().toLowerCase().replace(/m$/, "");
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 60) {
    return null;
  }
  return parsed;
}

export function getEstimationMinutes(config: SessionConfig): number | null {
  return config.durationMinutes;
}

export function hasValidEstimation(config: SessionConfig): boolean {
  return getEstimationMinutes(config) !== null;
}

export function canEnableSaveToBacklog(
  config: SessionConfig,
  idle: FocusIdleDraft,
): boolean {
  return idle.sessionSelection === "new" && config.taskId === null;
}

export function backlogItemFromConfig(
  config: SessionConfig,
  color: string,
): FocusBacklogItem {
  return {
    id: crypto.randomUUID(),
    name: config.name.trim(),
    durationMinutes: config.durationMinutes ?? 0,
    color,
    createdAt: new Date().toISOString(),
  };
}

export function sessionConfigFromBacklogItem(
  item: FocusBacklogItem,
): SessionConfig {
  return {
    durationMinutes: item.durationMinutes,
    taskId: null,
    name: item.name,
  };
}

export function getPlannedFocusDurationSeconds(config: SessionConfig): number {
  return (config.durationMinutes ?? 0) * 60;
}

export function getBreakDurationSeconds(
  parentPlannedFocusSeconds: number,
): number {
  return Math.round(parentPlannedFocusSeconds * 0.2);
}

export function validateSessionConfig(
  config: SessionConfig,
): FocusActionResult {
  const minutes = config.durationMinutes;
  if (
    minutes === null ||
    !Number.isInteger(minutes) ||
    minutes < 1 ||
    minutes > 60
  ) {
    return {
      status: "CONSTRAINT_VIOLATION",
      reason: "durationMinutes must be an integer between 1 and 60",
    };
  }

  if (!config.taskId && config.name.trim().length === 0) {
    return {
      status: "CONSTRAINT_VIOLATION",
      reason: "name is required when no task is linked",
    };
  }

  return { status: "SUCCESS" };
}

export function isFocusSessionRecord(
  record: FocusSessionRecord,
): record is FocusSession {
  return record.type === "focus";
}

export function isBreakSessionRecord(
  record: FocusSessionRecord,
): record is BreakSession {
  return record.type === "break";
}

export function isActiveFocusTimer(
  timer: ActiveTimer,
): timer is ActiveFocusTimer {
  return timer.sessionType === "focus";
}

export function isActiveBreakTimer(
  timer: ActiveTimer,
): timer is ActiveBreakTimer {
  return timer.sessionType === "break";
}

export function isActiveTimerSystemState(
  systemState: FocusSystemState,
): boolean {
  return (
    systemState === "running" ||
    systemState === "paused" ||
    systemState === "break_running"
  );
}

export function withActiveTimerSystemState(timer: ActiveTimer): ActiveTimer {
  const systemState: ActiveTimer["systemState"] = timer.pausedAt
    ? "paused"
    : "running";
  return { ...timer, systemState };
}

export function advanceActiveTimer(timer: ActiveTimer): ActiveTimer {
  const nextElapsed = timer.elapsedSeconds + 1;
  const nextRemaining = Math.max(0, timer.plannedDurationSeconds - nextElapsed);
  return {
    ...timer,
    elapsedSeconds: nextElapsed,
    remainingSeconds: nextRemaining,
  };
}

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfLocalWeek(date: Date): Date {
  const day = date.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const start = new Date(date);
  start.setDate(date.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

export interface FocusSessionFilterOption {
  value: string;
  label: string;
  color: string | null;
}

export function buildFocusSessionFilterOptions(
  sessions: FocusSessionRecord[],
): FocusSessionFilterOption[] {
  const optionsByName = new Map<string, string>();
  const focusSessions = sessions
    .filter(isFocusSessionRecord)
    .sort((left, right) => right.endedAt.localeCompare(left.endedAt));

  for (const session of focusSessions) {
    const name = session.name.trim();
    if (!name || optionsByName.has(name)) continue;
    optionsByName.set(name, resolveFocusSessionColor(session));
  }

  return [
    { value: "", label: "All sessions", color: null },
    ...[...optionsByName.entries()]
      .sort(([leftName], [rightName]) => leftName.localeCompare(rightName))
      .map(([name, color]) => ({
        value: name,
        label: name,
        color,
      })),
  ];
}

export function resolveFocusSessionColor(session: FocusSession): string {
  if (session.color) return session.color;
  const paletteIndex =
    Math.abs(hashString(session.name)) % FOCUS_SESSION_COLORS.length;
  return FOCUS_SESSION_COLORS[paletteIndex] ?? FOCUS_SESSION_COLORS[0];
}

export function buildFocusSessionRecord(
  timer: ActiveFocusTimer,
  status: FocusSession["status"],
  endedAt: string,
): FocusSession {
  return {
    id: timer.sessionId,
    type: "focus",
    name: timer.name.trim(),
    taskId: timer.taskId,
    color: timer.color,
    plannedDurationSeconds: timer.plannedDurationSeconds,
    actualDurationSeconds: timer.elapsedSeconds,
    startedAt: timer.startedAt,
    endedAt,
    status,
  };
}

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return hash;
}

export function buildBreakSessionRecord(
  timer: ActiveBreakTimer,
  status: BreakSession["status"],
  endedAt: string,
): BreakSession {
  return {
    id: timer.sessionId,
    type: "break",
    parentFocusSessionId: timer.parentFocusSessionId,
    plannedDurationSeconds: timer.plannedDurationSeconds,
    actualDurationSeconds: timer.elapsedSeconds,
    startedAt: timer.startedAt,
    endedAt,
    status,
  };
}

export function resolveBreakParentFocusSession(
  sessions: FocusSessionRecord[],
): FocusSession | null {
  const breaks = sessions.filter(isBreakSessionRecord);
  const focusWithBreak = new Set(
    breaks.map((item) => item.parentFocusSessionId),
  );

  const candidates = sessions
    .filter(isFocusSessionRecord)
    .filter(
      (session) =>
        session.status === "completed" && !focusWithBreak.has(session.id),
    )
    .sort((left, right) => right.endedAt.localeCompare(left.endedAt));

  return candidates[0] ?? null;
}

export function resolveBreakSuggestion(
  sessions: FocusSessionRecord[],
): FocusBreakSuggestion | null {
  const parent = resolveBreakParentFocusSession(sessions);
  if (!parent) return null;
  return {
    parentFocusSessionId: parent.id,
    parentPlannedFocusSeconds: parent.plannedDurationSeconds,
  };
}

export function systemStateFromActiveTimer(
  active: ActiveTimer,
): FocusSystemState {
  if (active.sessionType === "break") {
    return "break_running";
  }
  return active.systemState;
}

export function getDailyFocusSeconds(
  sessions: FocusSessionRecord[],
  referenceDate = new Date(),
): number {
  const dayStart = startOfLocalDay(referenceDate);
  const dayEnd = endOfLocalDay(referenceDate);

  return sessions
    .filter(isFocusSessionRecord)
    .filter((session) => {
      const endedAt = new Date(session.endedAt);
      return endedAt >= dayStart && endedAt <= dayEnd;
    })
    .reduce((total, session) => total + session.actualDurationSeconds, 0);
}

export function formatFocusCountdown(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatFocusDurationLabel(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${safeSeconds}s`;
}

export function sortFocusHistorySessions(
  sessions: FocusSessionRecord[],
): FocusSessionRecord[] {
  return [...sessions].sort((left, right) =>
    right.endedAt.localeCompare(left.endedAt),
  );
}

export const FOCUS_HISTORY_PAGE_SIZE = 3;

export function getFocusHistoryVisibleSessions(
  sessions: FocusSessionRecord[],
  visibleCount: number,
): FocusSessionRecord[] {
  return sessions.slice(0, visibleCount);
}

export function getNextFocusHistoryVisibleCount(
  currentCount: number,
  totalCount: number,
  pageSize = FOCUS_HISTORY_PAGE_SIZE,
): number {
  if (totalCount <= 0) return 0;
  return Math.min(currentCount + pageSize, totalCount);
}

export function hasMoreFocusHistory(
  visibleCount: number,
  totalCount: number,
): boolean {
  return visibleCount < totalCount;
}

export function formatFocusHistoryTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getFocusSessionDurationLabel(session: FocusSession): string {
  const minutes = Math.round(session.plannedDurationSeconds / 60);
  return `${minutes} min`;
}

export function getFocusHistoryStatusLabel(status: FocusSessionStatus): string {
  return status === "completed" ? "Completed" : "Interrupted";
}

export function resolveBreakParentName(
  breakSession: BreakSession,
  sessions: FocusSessionRecord[],
): string | null {
  const parent = sessions.find(
    (session): session is FocusSession =>
      isFocusSessionRecord(session) &&
      session.id === breakSession.parentFocusSessionId,
  );
  return parent?.name ?? null;
}

export function getWeeklyFocusSeconds(
  sessions: FocusSessionRecord[],
  referenceDate = new Date(),
): number {
  const weekStart = startOfLocalWeek(referenceDate);
  const weekEnd = endOfLocalWeek(referenceDate);

  return sessions
    .filter(isFocusSessionRecord)
    .filter((session) => {
      const endedAt = new Date(session.endedAt);
      return endedAt >= weekStart && endedAt <= weekEnd;
    })
    .reduce((total, session) => total + session.actualDurationSeconds, 0);
}

export function getMonthlyFocusSeconds(
  sessions: FocusSessionRecord[],
  referenceDate = new Date(),
): number {
  const monthStart = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    1,
  );
  const monthEnd = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );

  return sessions
    .filter(isFocusSessionRecord)
    .filter((session) => {
      const endedAt = new Date(session.endedAt);
      return endedAt >= monthStart && endedAt <= monthEnd;
    })
    .reduce((total, session) => total + session.actualDurationSeconds, 0);
}

export function getTotalFocusSeconds(sessions: FocusSessionRecord[]): number {
  return sessions
    .filter(isFocusSessionRecord)
    .reduce((total, session) => total + session.actualDurationSeconds, 0);
}

function endOfLocalDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );
}

function endOfLocalWeek(date: Date): Date {
  const start = startOfLocalWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}
