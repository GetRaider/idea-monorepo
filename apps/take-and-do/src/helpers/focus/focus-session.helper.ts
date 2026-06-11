import type {
  ActiveSession,
  BreakSession,
  FocusActionResult,
  FocusBacklogItem,
  FocusBreakSuggestion,
  FocusIdleDraft,
  FocusRuntime,
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

export const POMODORO_25_5_FOCUS_SECONDS = 25 * 60;
export const POMODORO_25_5_BREAK_SECONDS = 5 * 60;

export const DEFAULT_IDLE_DRAFT: FocusIdleDraft = {
  sessionSelection: "new",
  selectedBacklogId: null,
  saveToBacklog: false,
  color: FOCUS_SESSION_COLORS[0],
};

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  mode: "custom",
  presetId: null,
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
  if (config.mode === "preset") return 25;
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
    mode: config.mode,
    presetId: config.mode === "preset" ? config.presetId : null,
    durationMinutes: config.mode === "custom" ? config.durationMinutes : null,
    color,
    createdAt: new Date().toISOString(),
  };
}

export function sessionConfigFromBacklogItem(
  item: FocusBacklogItem,
): SessionConfig {
  return {
    mode: item.mode,
    presetId: item.presetId,
    durationMinutes: item.durationMinutes,
    taskId: null,
    name: item.name,
  };
}

export function getPlannedFocusDurationSeconds(config: SessionConfig): number {
  if (config.mode === "preset") {
    return POMODORO_25_5_FOCUS_SECONDS;
  }
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
  if (config.mode === "preset") {
    if (config.presetId !== "pomodoro_25_5") {
      return {
        status: "CONSTRAINT_VIOLATION",
        reason: "presetId must be pomodoro_25_5 for preset mode",
      };
    }
  } else if (config.mode === "custom") {
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
  } else {
    return {
      status: "CONSTRAINT_VIOLATION",
      reason: "mode must be preset or custom",
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

export function isActiveTimerSystemState(
  systemState: FocusSystemState,
): boolean {
  return (
    systemState === "running" ||
    systemState === "paused" ||
    systemState === "break_running"
  );
}

export function buildActiveSession(
  runtime: FocusRuntime,
  timerState: ActiveSession["systemState"],
): ActiveSession {
  return {
    sessionId: runtime.sessionId,
    sessionType: runtime.sessionType,
    systemState: timerState,
    remainingSeconds: runtime.remainingSeconds,
    pausedAt: runtime.pausedAt,
    elapsedSeconds: runtime.elapsedSeconds,
    color: runtime.color,
    config: runtime.config,
  };
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
  runtime: FocusRuntime,
  status: FocusSession["status"],
  endedAt: string,
): FocusSession {
  return {
    id: runtime.sessionId,
    type: "focus",
    name: runtime.config.name.trim(),
    taskId: runtime.config.taskId,
    mode: runtime.config.mode,
    presetId: runtime.config.mode === "preset" ? runtime.config.presetId : null,
    color: runtime.color,
    plannedDurationSeconds: runtime.plannedDurationSeconds,
    actualDurationSeconds: runtime.elapsedSeconds,
    startedAt: runtime.startedAt,
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
  runtime: FocusRuntime,
  parentFocusSessionId: string,
  status: BreakSession["status"],
  endedAt: string,
): BreakSession {
  return {
    id: runtime.sessionId,
    type: "break",
    parentFocusSessionId,
    plannedDurationSeconds: runtime.plannedDurationSeconds,
    actualDurationSeconds: runtime.elapsedSeconds,
    startedAt: runtime.startedAt,
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

export function runtimeFromActiveSession(
  active: ActiveSession,
  sessions: FocusSessionRecord[],
): FocusRuntime {
  const plannedDurationSeconds =
    active.sessionType === "focus"
      ? getPlannedFocusDurationSeconds(active.config)
      : resolveBreakDurationForActive(active, sessions);

  const parentFocusSessionId =
    active.sessionType === "break"
      ? (resolveBreakParentFocusSession(sessions)?.id ?? null)
      : null;

  const parentFocusSession = parentFocusSessionId
    ? sessions.find(
        (session): session is FocusSession =>
          isFocusSessionRecord(session) && session.id === parentFocusSessionId,
      )
    : null;

  return {
    sessionId: active.sessionId,
    sessionType: active.sessionType,
    config: active.config,
    color:
      active.color ??
      (parentFocusSession
        ? resolveFocusSessionColor(parentFocusSession)
        : FOCUS_SESSION_COLORS[0]),
    plannedDurationSeconds,
    elapsedSeconds: active.elapsedSeconds,
    remainingSeconds: active.remainingSeconds,
    pausedAt: active.pausedAt,
    startedAt: new Date(
      Date.now() - active.elapsedSeconds * 1000,
    ).toISOString(),
    parentFocusSessionId,
  };
}

export function systemStateFromActiveSession(
  active: ActiveSession,
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

export function formatFocusHistoryTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getFocusSessionModeLabel(session: FocusSession): string {
  if (session.mode === "preset") return "25/5 Pomodoro";
  const minutes = Math.round(session.plannedDurationSeconds / 60);
  return `${minutes} min custom`;
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

function resolveBreakDurationForActive(
  active: ActiveSession,
  sessions: FocusSessionRecord[],
): number {
  const parent = resolveBreakParentFocusSession(sessions);
  if (parent) {
    return getBreakDurationSeconds(parent.plannedDurationSeconds);
  }
  return active.remainingSeconds + active.elapsedSeconds;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
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

function startOfLocalWeek(date: Date): Date {
  const day = date.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const start = new Date(date);
  start.setDate(date.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function endOfLocalWeek(date: Date): Date {
  const start = startOfLocalWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}
