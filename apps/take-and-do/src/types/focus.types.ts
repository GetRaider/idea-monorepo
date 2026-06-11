export type FocusTimerMode = "preset" | "custom";

export type FocusSessionSelection = "new" | "backlog";

export type FocusPresetId = "pomodoro_25_5";

export type FocusSessionRecordType = "focus" | "break";

export type FocusSystemState =
  | "idle"
  | "running"
  | "paused"
  | "stopping"
  | "completed"
  | "break_suggested"
  | "break_running"
  | "break_stopping";

export type FocusSessionStatus = "completed" | "interrupted";

export type ActiveTimerSystemState = "running" | "paused";

export interface SessionConfig {
  mode: FocusTimerMode;
  presetId: FocusPresetId | null;
  durationMinutes: number | null;
  taskId: string | null;
  name: string;
}

export interface FocusSession {
  id: string;
  type: "focus";
  name: string;
  taskId: string | null;
  mode: FocusTimerMode;
  presetId: FocusPresetId | null;
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

export interface ActiveSession {
  sessionId: string;
  sessionType: FocusSessionRecordType;
  systemState: ActiveTimerSystemState;
  remainingSeconds: number;
  pausedAt: string | null;
  elapsedSeconds: number;
  color?: string;
  config: SessionConfig;
}

export interface FocusSessionsStore {
  version: 1;
  items: FocusSessionRecord[];
}

export interface FocusBacklogItem {
  id: string;
  name: string;
  mode: FocusTimerMode;
  presetId: FocusPresetId | null;
  durationMinutes: number | null;
  color: string;
  createdAt: string;
}

export interface FocusBacklogStore {
  version: 1;
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

export interface FocusRuntime {
  sessionId: string;
  sessionType: FocusSessionRecordType;
  config: SessionConfig;
  color: string;
  plannedDurationSeconds: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  pausedAt: string | null;
  startedAt: string;
  parentFocusSessionId: string | null;
}

export interface FocusBreakSuggestion {
  parentFocusSessionId: string;
  parentPlannedFocusSeconds: number;
}
