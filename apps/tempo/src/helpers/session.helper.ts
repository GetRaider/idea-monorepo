import {
  MANUAL_MAX_DURATION_SECONDS,
  MANUAL_MIN_DURATION_SECONDS,
  TIMER_MAX_PLANNED_SECONDS,
  TIMER_MIN_PLANNED_SECONDS,
} from "../shared/records.types";
import type {
  AddManualRecordInput,
  FocusRecord,
  SavedSession,
  StartSessionInput,
  UpdateRecordInput,
  UpdateSavedSessionInput,
} from "../shared/records.types";
import {
  DEFAULT_SESSION_COLOR,
  SESSION_COLORS,
} from "../shared/session-colors";

import {
  foldRunningSegment,
  getDisplayedElapsedSeconds,
} from "./elapsed.helper";

export function validateStartSession(
  input: StartSessionInput,
  hasActiveSession: boolean,
): void {
  if (hasActiveSession) {
    throw new Error("A session is already running");
  }

  if (input.kind === "backlog") {
    if (!input.sessionId) {
      throw new Error("Select a backlog session");
    }
  } else if (input.name.trim().length === 0) {
    throw new Error("Name is required");
  }

  if (input.saveToBacklog && input.name.trim().length === 0) {
    throw new Error("Name is required to save to backlog");
  }

  if (input.mode === "timer") {
    assertPlannedSeconds(
      input.plannedSeconds,
      "Duration is required for timer",
    );
    return;
  }

  if (input.plannedSeconds !== null) {
    assertPlannedSeconds(input.plannedSeconds, "Target must be 1–60 minutes");
  }
}

export function validateManualRecord(
  input: AddManualRecordInput,
  nowMs: number,
): void {
  if (input.kind === "backlog") {
    if (!input.sessionId) {
      throw new Error("Select a backlog session");
    }
  } else if (input.name.trim().length === 0) {
    throw new Error("Name is required");
  }

  validateCompletedTiming(input.durationSeconds, input.startedAt, nowMs);
}

export function validateUpdateRecord(
  existing: FocusRecord,
  input: UpdateRecordInput,
  nowMs: number,
): void {
  if (existing.endedAt === null) {
    throw new Error("Cannot edit an active session");
  }

  if (input.name.trim().length === 0) {
    throw new Error("Name is required");
  }

  validateCompletedTiming(input.durationSeconds, input.startedAt, nowMs);
}

export function validateDeleteRecord(existing: FocusRecord): void {
  if (existing.endedAt === null) {
    throw new Error("Cannot delete an active session");
  }
}

export function validateSavedSessionName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new Error("Session name is required");
  }

  return trimmed;
}

export function validateSavedSessionColor(color: string): string {
  const normalizedColor = color.trim().toLowerCase();
  const allowedColor = SESSION_COLORS.find(
    (sessionColor) => sessionColor.toLowerCase() === normalizedColor,
  );
  if (allowedColor === undefined) {
    throw new Error("Select a valid session color");
  }

  return allowedColor;
}

export function validateUpdateSavedSession(input: UpdateSavedSessionInput): {
  name: string;
  color: string;
} {
  return {
    name: validateSavedSessionName(input.name),
    color: validateSavedSessionColor(input.color),
  };
}

export function pickDefaultSessionColor(name: string): string {
  let hash = 2166136261;
  for (const character of name) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  const paletteIndex = Math.abs(hash) % SESSION_COLORS.length;
  return SESSION_COLORS[paletteIndex] ?? DEFAULT_SESSION_COLOR;
}

export function assertSavedSessionNotInUse(
  sessionId: string,
  activeSessionId: string | null,
  action: "edit" | "delete",
): void {
  if (activeSessionId === sessionId) {
    throw new Error(
      action === "delete"
        ? "Cannot delete a session that is running"
        : "Cannot edit a session that is running",
    );
  }
}

export function resolveRecordIdentity(
  input: Pick<
    StartSessionInput,
    "kind" | "sessionId" | "name" | "saveToBacklog"
  >,
  savedSession: SavedSession | null,
): Pick<FocusRecord, "kind" | "sessionId" | "name"> {
  if (input.kind === "backlog" || input.saveToBacklog) {
    if (savedSession === null) {
      throw new Error("Backlog session not found");
    }

    return {
      kind: "backlog",
      sessionId: savedSession.id,
      name: savedSession.name,
    };
  }

  return {
    kind: "unknown",
    sessionId: null,
    name: input.name.trim(),
  };
}

export function buildLiveStartRecord(
  input: StartSessionInput,
  id: string,
  startedAtIso: string,
  savedSession: SavedSession | null,
): FocusRecord {
  const identity = resolveRecordIdentity(input, savedSession);
  return {
    id,
    ...identity,
    startedAt: startedAtIso,
    endedAt: null,
    accumulatedSeconds: 0,
    segmentStartedAt: startedAtIso,
    plannedSeconds: input.plannedSeconds,
    mode: input.mode,
    source: "live",
  };
}

export function buildPausedRecord(
  record: FocusRecord,
  nowMs: number,
): FocusRecord {
  if (record.endedAt !== null) {
    throw new Error("Cannot pause a completed session");
  }

  if (record.segmentStartedAt === null) {
    throw new Error("Session is already paused");
  }

  const folded = foldRunningSegment(record, nowMs);
  return {
    ...record,
    accumulatedSeconds: folded.accumulatedSeconds,
    segmentStartedAt: folded.segmentStartedAt,
  };
}

export function buildResumedRecord(
  record: FocusRecord,
  nowIso: string,
): FocusRecord {
  if (record.endedAt !== null) {
    throw new Error("Cannot resume a completed session");
  }

  if (record.segmentStartedAt !== null) {
    throw new Error("Session is already running");
  }

  return {
    ...record,
    segmentStartedAt: nowIso,
  };
}

export function buildStoppedRecord(
  record: FocusRecord,
  nowMs: number,
): FocusRecord {
  if (record.endedAt !== null) {
    throw new Error("Session is already stopped");
  }

  const elapsedSeconds = getDisplayedElapsedSeconds(record, nowMs);
  const endedAtIso = new Date(nowMs).toISOString();

  return {
    ...record,
    accumulatedSeconds: elapsedSeconds,
    segmentStartedAt: null,
    endedAt: endedAtIso,
  };
}

export function buildUpdatedRecord(
  existing: FocusRecord,
  input: UpdateRecordInput,
): FocusRecord {
  const startedAtMs = Date.parse(input.startedAt);
  const durationSeconds = input.durationSeconds;

  return {
    ...existing,
    name: input.name.trim(),
    startedAt: new Date(startedAtMs).toISOString(),
    endedAt: new Date(startedAtMs + durationSeconds * 1000).toISOString(),
    accumulatedSeconds: durationSeconds,
    segmentStartedAt: null,
  };
}

export function buildManualRecord(
  input: AddManualRecordInput,
  id: string,
  savedSession: SavedSession | null,
): FocusRecord {
  const identity = resolveRecordIdentity(input, savedSession);
  const startedAtMs = Date.parse(input.startedAt);
  const endedAtIso = new Date(
    startedAtMs + input.durationSeconds * 1000,
  ).toISOString();

  return {
    id,
    ...identity,
    startedAt: new Date(startedAtMs).toISOString(),
    endedAt: endedAtIso,
    accumulatedSeconds: input.durationSeconds,
    segmentStartedAt: null,
    plannedSeconds: input.durationSeconds,
    mode: "stopwatch",
    source: "manual",
  };
}

export function parseMinutesInput(value: string): number | null {
  const trimmed = value.trim().toLowerCase().replace(/m$/, "");
  if (!trimmed) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return null;
  }

  return parsed;
}

function validateCompletedTiming(
  durationSeconds: number,
  startedAt: string,
  nowMs: number,
): void {
  if (
    !Number.isInteger(durationSeconds) ||
    durationSeconds < MANUAL_MIN_DURATION_SECONDS ||
    durationSeconds > MANUAL_MAX_DURATION_SECONDS
  ) {
    throw new Error("Duration must be between 1 minute and 24 hours");
  }

  const startedAtMs = Date.parse(startedAt);
  if (Number.isNaN(startedAtMs)) {
    throw new Error("Date and time is invalid");
  }

  if (startedAtMs > nowMs) {
    throw new Error("Date and time cannot be in the future");
  }
}

function assertPlannedSeconds(
  plannedSeconds: number | null,
  requiredMessage: string,
): void {
  if (plannedSeconds === null) {
    throw new Error(requiredMessage);
  }

  if (
    !Number.isInteger(plannedSeconds) ||
    plannedSeconds < TIMER_MIN_PLANNED_SECONDS ||
    plannedSeconds > TIMER_MAX_PLANNED_SECONDS
  ) {
    throw new Error("Duration must be between 1 and 60 minutes");
  }
}
