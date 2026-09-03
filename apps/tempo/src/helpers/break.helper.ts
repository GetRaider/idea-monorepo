import {
  TIMER_MAX_PLANNED_SECONDS,
  TIMER_MIN_PLANNED_SECONDS,
} from "../shared/records.types";
import type { FocusRecord, SavedSession } from "../shared/records.types";

export const DEFAULT_BREAK_SESSION_NAME = "Break";
export const LEGACY_REST_SESSION_NAME = "Rest";

export function isDefaultBreakSessionName(name: string): boolean {
  return name.trim().toLowerCase() === DEFAULT_BREAK_SESSION_NAME.toLowerCase();
}

export function validateStartBreak(options: {
  plannedSeconds: number;
  activeFocus: FocusRecord | null;
  activeBreak: FocusRecord | null;
}): void {
  if (options.activeBreak !== null) {
    throw new Error("A break is already running");
  }

  if (
    options.activeFocus !== null &&
    options.activeFocus.segmentStartedAt !== null
  ) {
    throw new Error("Pause focus before starting a break");
  }

  assertBreakPlannedSeconds(options.plannedSeconds);
}

export function buildBreakStartRecord(
  plannedSeconds: number,
  savedSession: SavedSession,
  id: string,
  startedAtIso: string,
): FocusRecord {
  return {
    id,
    name: savedSession.name,
    scope: null,
    startedAt: startedAtIso,
    endedAt: null,
    accumulatedSeconds: 0,
    segmentStartedAt: startedAtIso,
    plannedSeconds,
    mode: "timer",
    source: "live",
    kind: "backlog",
    sessionId: savedSession.id,
    recordRole: "break",
  };
}

function assertBreakPlannedSeconds(plannedSeconds: number): void {
  if (
    !Number.isInteger(plannedSeconds) ||
    plannedSeconds < TIMER_MIN_PLANNED_SECONDS ||
    plannedSeconds > TIMER_MAX_PLANNED_SECONDS
  ) {
    throw new Error("Break duration must be between 1 and 60 minutes");
  }
}
