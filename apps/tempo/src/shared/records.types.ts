export type TimerMode = "timer" | "stopwatch";

export type RecordSource = "live" | "manual";

export type SessionKind = "unknown" | "backlog";

export interface SavedSession {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface FocusRecord {
  id: string;
  name: string;
  startedAt: string;
  endedAt: string | null;
  accumulatedSeconds: number;
  segmentStartedAt: string | null;
  plannedSeconds: number | null;
  mode: TimerMode;
  source: RecordSource;
  kind: SessionKind;
  sessionId: string | null;
}

export interface StartSessionInput {
  name: string;
  kind: SessionKind;
  sessionId: string | null;
  saveToBacklog: boolean;
  mode: TimerMode;
  plannedSeconds: number | null;
}

export interface AddManualRecordInput {
  name: string;
  durationSeconds: number;
  startedAt: string;
  kind: SessionKind;
  sessionId: string | null;
  saveToBacklog: boolean;
}

export interface UpdateRecordInput {
  id: string;
  name: string;
  durationSeconds: number;
  startedAt: string;
}

export interface CreateSavedSessionInput {
  name: string;
}

export interface UpdateSavedSessionInput {
  id: string;
  name: string;
  color: string;
}

export const TIMER_MIN_PLANNED_SECONDS = 60;
export const TIMER_MAX_PLANNED_SECONDS = 60 * 60;
export const MANUAL_MIN_DURATION_SECONDS = 60;
export const MANUAL_MAX_DURATION_SECONDS = 24 * 60 * 60;
