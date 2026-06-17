import type {
  ActiveBreakTimer,
  ActiveFocusTimer,
  ActiveTimer,
  FocusBacklogItem,
  FocusBacklogStore,
  FocusBreakSuggestion,
  FocusIdleDraft,
  FocusSession,
  FocusSessionRecord,
  FocusSessionsStore,
  SessionConfig,
  StoredFocusDraft,
} from "@/types/focus.types";

import {
  DEFAULT_IDLE_DRAFT,
  FOCUS_STORAGE_ACTIVE_KEY,
  FOCUS_STORAGE_BACKLOG_KEY,
  FOCUS_STORAGE_BREAK_SUGGESTION_KEY,
  FOCUS_STORAGE_DRAFT_KEY,
  FOCUS_STORAGE_SESSIONS_KEY,
} from "@/helpers/focus/focus-session.helper";
import { localStorageHelper } from "@/helpers/local-storage.helper";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function migrateDurationMinutes(raw: Record<string, unknown>): number | null {
  if (typeof raw.durationMinutes === "number") {
    return raw.durationMinutes;
  }
  if (raw.mode === "preset") {
    return 25;
  }
  return null;
}

function migrateSessionConfig(value: unknown): SessionConfig | null {
  if (!isRecord(value)) return null;
  if (typeof value.name !== "string") return null;
  if (value.taskId !== null && typeof value.taskId !== "string") return null;
  return {
    name: value.name,
    durationMinutes: migrateDurationMinutes(value),
    taskId:
      value.taskId === null || typeof value.taskId === "string"
        ? value.taskId
        : null,
  };
}

function isSessionConfig(value: unknown): value is SessionConfig {
  const migrated = migrateSessionConfig(value);
  if (!migrated) return false;
  if (
    migrated.durationMinutes !== null &&
    typeof migrated.durationMinutes !== "number"
  ) {
    return false;
  }
  return true;
}

function migratePlannedDurationSeconds(
  raw: Record<string, unknown>,
): number | null {
  if (typeof raw.plannedDurationSeconds === "number") {
    return raw.plannedDurationSeconds;
  }
  if (raw.mode === "preset") {
    return 25 * 60;
  }
  const minutes = migrateDurationMinutes(raw);
  if (minutes === null) return null;
  return minutes * 60;
}

function migrateFocusSession(value: unknown): FocusSession | null {
  if (!isRecord(value) || value.type !== "focus") return null;

  const plannedDurationSeconds = migratePlannedDurationSeconds(value);
  if (plannedDurationSeconds === null) return null;

  if (
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    (value.taskId !== null && typeof value.taskId !== "string") ||
    typeof value.actualDurationSeconds !== "number" ||
    typeof value.startedAt !== "string" ||
    typeof value.endedAt !== "string" ||
    (value.status !== "completed" && value.status !== "interrupted") ||
    (value.color !== undefined && typeof value.color !== "string")
  ) {
    return null;
  }

  return {
    id: value.id,
    type: "focus",
    name: value.name,
    taskId: value.taskId,
    color: typeof value.color === "string" ? value.color : undefined,
    plannedDurationSeconds,
    actualDurationSeconds: value.actualDurationSeconds,
    startedAt: value.startedAt,
    endedAt: value.endedAt,
    status: value.status,
  };
}

function isFocusSession(value: unknown): value is FocusSessionRecord {
  if (!isRecord(value) || typeof value.type !== "string") return false;

  if (value.type === "focus") {
    return migrateFocusSession(value) !== null;
  }

  if (value.type === "break") {
    return (
      typeof value.id === "string" &&
      typeof value.parentFocusSessionId === "string" &&
      typeof value.plannedDurationSeconds === "number" &&
      typeof value.actualDurationSeconds === "number" &&
      typeof value.startedAt === "string" &&
      typeof value.endedAt === "string" &&
      (value.status === "completed" || value.status === "interrupted")
    );
  }

  return false;
}

function normalizeFocusSession(value: unknown): FocusSessionRecord | null {
  if (!isRecord(value) || typeof value.type !== "string") return null;

  if (value.type === "focus") {
    return migrateFocusSession(value);
  }

  if (value.type === "break") {
    if (!isFocusSession(value)) return null;
    return value as FocusSessionRecord;
  }

  return null;
}

function isActiveFocusTimer(value: unknown): value is ActiveFocusTimer {
  if (!isRecord(value)) return false;
  if (value.sessionType !== "focus") return false;
  if (typeof value.sessionId !== "string") return false;
  if (value.systemState !== "running" && value.systemState !== "paused") {
    return false;
  }
  if (typeof value.name !== "string") return false;
  if (value.taskId !== null && typeof value.taskId !== "string") return false;
  if (typeof value.color !== "string") return false;
  if (typeof value.plannedDurationSeconds !== "number") return false;
  if (typeof value.remainingSeconds !== "number") return false;
  if (value.pausedAt !== null && typeof value.pausedAt !== "string") {
    return false;
  }
  if (typeof value.elapsedSeconds !== "number") return false;
  if (typeof value.startedAt !== "string") return false;
  return true;
}

function isActiveBreakTimer(value: unknown): value is ActiveBreakTimer {
  if (!isRecord(value)) return false;
  if (value.sessionType !== "break") return false;
  if (typeof value.sessionId !== "string") return false;
  if (value.systemState !== "running" && value.systemState !== "paused") {
    return false;
  }
  if (typeof value.parentFocusSessionId !== "string") return false;
  if (typeof value.plannedDurationSeconds !== "number") return false;
  if (typeof value.remainingSeconds !== "number") return false;
  if (value.pausedAt !== null && typeof value.pausedAt !== "string") {
    return false;
  }
  if (typeof value.elapsedSeconds !== "number") return false;
  if (typeof value.startedAt !== "string") return false;
  return true;
}

function migrateActiveTimer(value: unknown): ActiveTimer | null {
  if (isActiveFocusTimer(value) || isActiveBreakTimer(value)) {
    return value;
  }

  if (!isRecord(value)) return null;
  if (typeof value.sessionId !== "string") return null;
  if (value.sessionType !== "focus" && value.sessionType !== "break") {
    return null;
  }
  if (value.systemState !== "running" && value.systemState !== "paused") {
    return null;
  }
  if (typeof value.remainingSeconds !== "number") return null;
  if (value.pausedAt !== null && typeof value.pausedAt !== "string") {
    return null;
  }
  if (typeof value.elapsedSeconds !== "number") return null;

  const startedAt =
    typeof value.startedAt === "string"
      ? value.startedAt
      : new Date(
          Date.now() - (value.elapsedSeconds as number) * 1000,
        ).toISOString();

  if (value.sessionType === "break") {
    const parentFocusSessionId =
      typeof value.parentFocusSessionId === "string"
        ? value.parentFocusSessionId
        : null;

    if (!parentFocusSessionId) return null;

    const plannedDurationSeconds =
      typeof value.plannedDurationSeconds === "number"
        ? value.plannedDurationSeconds
        : value.remainingSeconds + value.elapsedSeconds;

    return {
      sessionId: value.sessionId,
      sessionType: "break",
      systemState: value.systemState,
      parentFocusSessionId,
      plannedDurationSeconds,
      elapsedSeconds: value.elapsedSeconds,
      remainingSeconds: value.remainingSeconds,
      pausedAt: value.pausedAt,
      startedAt,
    };
  }

  const config = migrateSessionConfig(value.config);
  if (!config) return null;

  const plannedDurationSeconds =
    typeof value.plannedDurationSeconds === "number"
      ? value.plannedDurationSeconds
      : getPlannedDurationFromConfig(config);

  const color = typeof value.color === "string" ? value.color : "#f97316";

  return {
    sessionId: value.sessionId,
    sessionType: "focus",
    systemState: value.systemState,
    name: config.name,
    taskId: config.taskId,
    color,
    plannedDurationSeconds,
    elapsedSeconds: value.elapsedSeconds,
    remainingSeconds: value.remainingSeconds,
    pausedAt: value.pausedAt,
    startedAt,
  };
}

function getPlannedDurationFromConfig(config: SessionConfig): number {
  return (config.durationMinutes ?? 0) * 60;
}

function defaultSessionsStore(): FocusSessionsStore {
  return { version: 2, items: [] };
}

export function readFocusSessionsStore(): FocusSessionsStore {
  const parsed = localStorageHelper.readItem(FOCUS_STORAGE_SESSIONS_KEY);
  if (!isRecord(parsed)) return defaultSessionsStore();
  if (parsed.version !== 1 && parsed.version !== 2) {
    return defaultSessionsStore();
  }
  if (!Array.isArray(parsed.items)) return defaultSessionsStore();
  const items = parsed.items
    .map(normalizeFocusSession)
    .filter((item): item is FocusSessionRecord => item !== null);
  return { version: 2, items };
}

export function writeFocusSessionsStore(next: FocusSessionsStore): void {
  localStorageHelper.writeItem(FOCUS_STORAGE_SESSIONS_KEY, next);
}

export function appendFocusSessionRecord(record: FocusSessionRecord): void {
  const store = readFocusSessionsStore();
  writeFocusSessionsStore({
    version: 2,
    items: [...store.items, record],
  });
}

export function readFocusActiveTimer(): ActiveTimer | null {
  const parsed = localStorageHelper.readItem(FOCUS_STORAGE_ACTIVE_KEY);
  if (parsed === null) return null;
  return migrateActiveTimer(parsed);
}

export function writeFocusActiveTimer(next: ActiveTimer | null): void {
  localStorageHelper.writeItem(FOCUS_STORAGE_ACTIVE_KEY, next);
}

function isFocusIdleDraft(value: unknown): value is FocusIdleDraft {
  if (!isRecord(value)) return false;
  if (
    value.sessionSelection !== "new" &&
    value.sessionSelection !== "backlog"
  ) {
    return false;
  }
  if (
    value.selectedBacklogId !== null &&
    typeof value.selectedBacklogId !== "string"
  ) {
    return false;
  }
  if (typeof value.saveToBacklog !== "boolean") return false;
  if (typeof value.color !== "string") return false;
  return true;
}

function isStoredFocusDraft(value: unknown): value is StoredFocusDraft {
  if (!isRecord(value)) return false;
  if (!isSessionConfig(value.config)) return false;
  return isFocusIdleDraft(value.idle);
}

function migrateBacklogItem(value: unknown): FocusBacklogItem | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || typeof value.name !== "string") {
    return null;
  }

  const durationMinutes = migrateDurationMinutes(value);
  if (
    durationMinutes === null ||
    !Number.isInteger(durationMinutes) ||
    durationMinutes < 1
  ) {
    return null;
  }

  if (typeof value.color !== "string" || typeof value.createdAt !== "string") {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    durationMinutes,
    color: value.color,
    createdAt: value.createdAt,
  };
}

function defaultBacklogStore(): FocusBacklogStore {
  return { version: 2, items: [] };
}

export function readFocusDraft(): StoredFocusDraft | null {
  const parsed = localStorageHelper.readItem(FOCUS_STORAGE_DRAFT_KEY);
  if (parsed === null) return null;
  if (isStoredFocusDraft(parsed)) {
    return parsed;
  }
  const migratedConfig = migrateSessionConfig(parsed);
  if (migratedConfig) {
    return {
      config: migratedConfig,
      idle: { ...DEFAULT_IDLE_DRAFT },
    };
  }
  return null;
}

export function writeFocusDraft(next: StoredFocusDraft | null): void {
  if (next === null) {
    localStorageHelper.removeItem(FOCUS_STORAGE_DRAFT_KEY);
    return;
  }
  localStorageHelper.writeItem(FOCUS_STORAGE_DRAFT_KEY, next);
}

export function readFocusBacklogStore(): FocusBacklogStore {
  const parsed = localStorageHelper.readItem(FOCUS_STORAGE_BACKLOG_KEY);
  if (!isRecord(parsed)) return defaultBacklogStore();
  if (parsed.version !== 1 && parsed.version !== 2) {
    return defaultBacklogStore();
  }
  if (!Array.isArray(parsed.items)) return defaultBacklogStore();
  const items = parsed.items
    .map(migrateBacklogItem)
    .filter((item): item is FocusBacklogItem => item !== null);
  return { version: 2, items };
}

export function writeFocusBacklogStore(next: FocusBacklogStore): void {
  localStorageHelper.writeItem(FOCUS_STORAGE_BACKLOG_KEY, next);
}

export function appendFocusBacklogItem(item: FocusBacklogItem): void {
  const store = readFocusBacklogStore();
  writeFocusBacklogStore({
    version: 2,
    items: [...store.items, item],
  });
}

function isBreakSuggestion(value: unknown): value is FocusBreakSuggestion {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.parentFocusSessionId === "string" &&
    typeof record.parentPlannedFocusSeconds === "number"
  );
}

export function readFocusBreakSuggestion(): FocusBreakSuggestion | null {
  const parsed = localStorageHelper.readItem(
    FOCUS_STORAGE_BREAK_SUGGESTION_KEY,
  );
  if (parsed === null) return null;
  return isBreakSuggestion(parsed) ? parsed : null;
}

export function writeFocusBreakSuggestion(
  next: FocusBreakSuggestion | null,
): void {
  if (next === null) {
    localStorageHelper.removeItem(FOCUS_STORAGE_BREAK_SUGGESTION_KEY);
    return;
  }
  localStorageHelper.writeItem(FOCUS_STORAGE_BREAK_SUGGESTION_KEY, next);
}
