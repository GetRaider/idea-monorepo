export type FocusSessionSelection = "new" | "backlog";

export type FocusSessionRecordType = "focus" | "break";

export type FocusSystemState =
  | "idle"
  | "running"
  | "paused"
  | "stopping"
  | "break_suggested"
  | "break_running"
  | "break_stopping";

export type FocusSessionStatus = "completed" | "interrupted";

export type ActiveTimerSystemState = "running" | "paused";

export interface SessionConfig {
  name: string;
  durationMinutes: number | null;
  taskId: string | null;
}

export interface FocusSession {
  id: string;
  type: "focus";
  name: string;
  taskId: string | null;
  color?: string;
  plannedDurationSeconds: number;
  actualDurationSeconds: number;
  startedAt: string;
  endedAt: string;
  status: FocusSessionStatus;
}

export interface BreakSession {
  id: string;
  type: "break";
  parentFocusSessionId: string;
  plannedDurationSeconds: number;
  actualDurationSeconds: number;
  startedAt: string;
  endedAt: string;
  status: FocusSessionStatus;
}

export type FocusSessionRecord = FocusSession | BreakSession;

export interface ActiveFocusTimer {
  sessionId: string;
  sessionType: "focus";
  systemState: ActiveTimerSystemState;
  name: string;
  taskId: string | null;
  color: string;
  plannedDurationSeconds: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  pausedAt: string | null;
  startedAt: string;
}

export interface ActiveBreakTimer {
  sessionId: string;
  sessionType: "break";
  systemState: ActiveTimerSystemState;
  parentFocusSessionId: string;
  plannedDurationSeconds: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  pausedAt: string | null;
  startedAt: string;
}

export type ActiveTimer = ActiveFocusTimer | ActiveBreakTimer;

export interface FocusSessionsStore {
  version: 2;
  items: FocusSessionRecord[];
}

export interface FocusBacklogItem {
  id: string;
  name: string;
  durationMinutes: number;
  color: string;
  createdAt: string;
}

export interface FocusBacklogStore {
  version: 2;
  items: FocusBacklogItem[];
}

export interface FocusIdleDraft {
  sessionSelection: FocusSessionSelection;
  selectedBacklogId: string | null;
  saveToBacklog: boolean;
  color: string;
}

export interface StoredFocusDraft {
  config: SessionConfig;
  idle: FocusIdleDraft;
}

export type FocusActionStatus =
  | "SUCCESS"
  | "REJECTED"
  | "CONSTRAINT_VIOLATION"
  | "NEEDS_CLARIFICATION";

export interface FocusActionResult {
  status: FocusActionStatus;
  reason?: string;
}

export interface FocusBreakSuggestion {
  parentFocusSessionId: string;
  parentPlannedFocusSeconds: number;
}
