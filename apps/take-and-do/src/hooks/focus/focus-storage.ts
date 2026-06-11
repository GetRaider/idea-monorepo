import type {
  ActiveSession,
  FocusBacklogItem,
  FocusBacklogStore,
  FocusBreakSuggestion,
  FocusIdleDraft,
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSessionConfig(value: unknown): value is SessionConfig {
  if (!isRecord(value)) return false;
  const mode = value.mode;
  if (mode !== "preset" && mode !== "custom") return false;
  if (typeof value.name !== "string") return false;
  if (value.taskId !== null && typeof value.taskId !== "string") return false;
  if (value.presetId !== null && value.presetId !== "pomodoro_25_5") {
    return false;
  }
  if (
    value.durationMinutes !== null &&
    typeof value.durationMinutes !== "number"
  ) {
    return false;
  }
  return true;
}

function isFocusSession(value: unknown): value is FocusSessionRecord {
  if (!isRecord(value) || typeof value.type !== "string") return false;

  if (value.type === "focus") {
    return (
      typeof value.id === "string" &&
      typeof value.name === "string" &&
      (value.taskId === null || typeof value.taskId === "string") &&
      (value.mode === "preset" || value.mode === "custom") &&
      typeof value.plannedDurationSeconds === "number" &&
      typeof value.actualDurationSeconds === "number" &&
      typeof value.startedAt === "string" &&
      typeof value.endedAt === "string" &&
      (value.status === "completed" || value.status === "interrupted")
    );
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

function isActiveSession(value: unknown): value is ActiveSession {
  if (!isRecord(value)) return false;
  if (typeof value.sessionId !== "string") return false;
  if (value.sessionType !== "focus" && value.sessionType !== "break") {
    return false;
  }
  if (value.systemState !== "running" && value.systemState !== "paused") {
    return false;
  }
  if (typeof value.remainingSeconds !== "number") return false;
  if (value.pausedAt !== null && typeof value.pausedAt !== "string") {
    return false;
  }
  if (typeof value.elapsedSeconds !== "number") return false;
  return isSessionConfig(value.config);
}

function defaultSessionsStore(): FocusSessionsStore {
  return { version: 1, items: [] };
}

export function readFocusSessionsStore(): FocusSessionsStore {
  if (typeof window === "undefined") return defaultSessionsStore();
  try {
    const raw = window.localStorage.getItem(FOCUS_STORAGE_SESSIONS_KEY);
    if (!raw) return defaultSessionsStore();
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed) || parsed.version !== 1) {
      return defaultSessionsStore();
    }
    if (!Array.isArray(parsed.items)) return defaultSessionsStore();
    const items = parsed.items.filter(isFocusSession);
    return { version: 1, items };
  } catch {
    return defaultSessionsStore();
  }
}

export function writeFocusSessionsStore(next: FocusSessionsStore): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      FOCUS_STORAGE_SESSIONS_KEY,
      JSON.stringify(next),
    );
  } catch {
    /* storage may be unavailable */
  }
}

export function appendFocusSessionRecord(record: FocusSessionRecord): void {
  const store = readFocusSessionsStore();
  writeFocusSessionsStore({
    version: 1,
    items: [...store.items, record],
  });
}

export function readFocusActiveSession(): ActiveSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(FOCUS_STORAGE_ACTIVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (parsed === null) return null;
    return isActiveSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeFocusActiveSession(next: ActiveSession | null): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FOCUS_STORAGE_ACTIVE_KEY, JSON.stringify(next));
  } catch {
    /* storage may be unavailable */
  }
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

function isFocusBacklogItem(value: unknown): value is FocusBacklogItem {
  if (!isRecord(value)) return false;
  if (typeof value.id !== "string" || typeof value.name !== "string") {
    return false;
  }
  if (value.mode !== "preset" && value.mode !== "custom") return false;
  if (value.presetId !== null && value.presetId !== "pomodoro_25_5") {
    return false;
  }
  if (
    value.durationMinutes !== null &&
    typeof value.durationMinutes !== "number"
  ) {
    return false;
  }
  if (typeof value.color !== "string" || typeof value.createdAt !== "string") {
    return false;
  }
  return true;
}

function defaultBacklogStore(): FocusBacklogStore {
  return { version: 1, items: [] };
}

export function readFocusDraft(): StoredFocusDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(FOCUS_STORAGE_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (isStoredFocusDraft(parsed)) {
      return parsed;
    }
    if (isSessionConfig(parsed)) {
      return {
        config: parsed,
        idle: { ...DEFAULT_IDLE_DRAFT },
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function writeFocusDraft(next: StoredFocusDraft | null): void {
  if (typeof window === "undefined") return;
  try {
    if (next === null) {
      window.localStorage.removeItem(FOCUS_STORAGE_DRAFT_KEY);
      return;
    }
    window.localStorage.setItem(FOCUS_STORAGE_DRAFT_KEY, JSON.stringify(next));
  } catch {
    /* storage may be unavailable */
  }
}

export function readFocusBacklogStore(): FocusBacklogStore {
  if (typeof window === "undefined") return defaultBacklogStore();
  try {
    const raw = window.localStorage.getItem(FOCUS_STORAGE_BACKLOG_KEY);
    if (!raw) return defaultBacklogStore();
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed) || parsed.version !== 1) {
      return defaultBacklogStore();
    }
    if (!Array.isArray(parsed.items)) return defaultBacklogStore();
    const items = parsed.items.filter(isFocusBacklogItem);
    return { version: 1, items };
  } catch {
    return defaultBacklogStore();
  }
}

export function writeFocusBacklogStore(next: FocusBacklogStore): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      FOCUS_STORAGE_BACKLOG_KEY,
      JSON.stringify(next),
    );
  } catch {
    /* storage may be unavailable */
  }
}

export function appendFocusBacklogItem(item: FocusBacklogItem): void {
  const store = readFocusBacklogStore();
  writeFocusBacklogStore({
    version: 1,
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
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(FOCUS_STORAGE_BREAK_SUGGESTION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (parsed === null) return null;
    return isBreakSuggestion(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeFocusBreakSuggestion(
  next: FocusBreakSuggestion | null,
): void {
  if (typeof window === "undefined") return;
  try {
    if (next === null) {
      window.localStorage.removeItem(FOCUS_STORAGE_BREAK_SUGGESTION_KEY);
      return;
    }
    window.localStorage.setItem(
      FOCUS_STORAGE_BREAK_SUGGESTION_KEY,
      JSON.stringify(next),
    );
  } catch {
    /* storage may be unavailable */
  }
}
