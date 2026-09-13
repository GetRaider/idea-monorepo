import type { FocusRecord, SavedSession } from "../shared/records.types";
import { DEFAULT_SESSION_COLOR } from "../shared/session-colors";

import { formatDurationLabel } from "./analytics.helper";

export function resolveRecordColor(
  record: FocusRecord,
  sessionColorById: ReadonlyMap<string, string>,
): string {
  if (record.kind === "backlog" && record.sessionId !== null) {
    return sessionColorById.get(record.sessionId) ?? DEFAULT_SESSION_COLOR;
  }

  return DEFAULT_SESSION_COLOR;
}

export function buildHistoryEntries(records: FocusRecord[]): HistoryEntry[] {
  return records
    .filter((record) => record.endedAt !== null)
    .map((record) => ({
      id: record.id,
      title: `${record.name} (${formatDurationLabel(record.accumulatedSeconds)})`,
      detail: formatHistoryTimestamp(record.startedAt),
      hasManual: record.source === "manual",
      mode: record.mode,
      recordRole: record.recordRole,
      startedAt: record.startedAt,
      sortKey: record.endedAt ?? record.startedAt,
    }))
    .sort((left, right) => right.sortKey.localeCompare(left.sortKey));
}

export function buildHistoryDayGroups(
  entries: HistoryEntry[],
): HistoryDayGroup[] {
  const groups = new Map<string, HistoryEntry[]>();

  for (const entry of entries) {
    const dayKey = formatLocalDayKey(entry.startedAt);
    const dayEntries = groups.get(dayKey);
    if (dayEntries === undefined) {
      groups.set(dayKey, [entry]);
    } else {
      dayEntries.push(entry);
    }
  }

  return [...groups.entries()]
    .sort((left, right) => right[0].localeCompare(left[0]))
    .map(([dayKey, dayEntries]) => ({
      dayKey,
      heading: formatDayHeading(dayKey),
      entries: [...dayEntries].sort((left, right) =>
        right.sortKey.localeCompare(left.sortKey),
      ),
    }));
}

export function findCompletedRecord(
  records: FocusRecord[],
  recordId: string,
): FocusRecord | null {
  const record = records.find((item) => item.id === recordId) ?? null;
  if (record === null || record.endedAt === null) {
    return null;
  }

  return record;
}

export function buildBacklogFilterOptions(
  sessions: SavedSession[],
): Array<{ value: string; label: string }> {
  return [
    { value: "", label: "All activities" },
    ...buildSortedSessionOptions(sessions),
  ];
}

export function buildActivityFilterOptions(
  sessions: SavedSession[],
): Array<{ value: string; label: string }> {
  return [
    { value: "", label: "All activities" },
    ...buildSortedSessionOptions(sessions),
  ];
}

export function buildManualSessionOptions(
  sessions: SavedSession[],
): Array<{ value: string; label: string }> {
  return [
    { value: "", label: "Custom name" },
    ...buildSortedSessionOptions(sessions),
  ];
}

function buildSortedSessionOptions(
  sessions: SavedSession[],
): Array<{ value: string; label: string }> {
  return [...sessions]
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((session) => ({ value: session.id, label: session.name }));
}

export function filterRecordsByBacklogSession(
  records: FocusRecord[],
  sessionId: string | null,
): FocusRecord[] {
  if (sessionId === null || sessionId === "") {
    return records;
  }

  return records.filter(
    (record) => record.kind === "backlog" && record.sessionId === sessionId,
  );
}

export function filterRecordsByStartedAtRange(
  records: FocusRecord[],
  rangeStartMs: number | null,
  rangeEndMs: number | null,
): FocusRecord[] {
  if (rangeStartMs === null && rangeEndMs === null) {
    return records;
  }

  return records.filter((record) => {
    const startedAtMs = Date.parse(record.startedAt);
    if (Number.isNaN(startedAtMs)) {
      return false;
    }
    if (rangeStartMs !== null && startedAtMs < rangeStartMs) {
      return false;
    }
    if (rangeEndMs !== null && startedAtMs > rangeEndMs) {
      return false;
    }
    return true;
  });
}

export function parseDatetimeLocalValue(value: string): number | null {
  const trimmedValue = value.trim();
  if (trimmedValue.length === 0) {
    return null;
  }

  const timestamp = new Date(trimmedValue).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function formatHistoryTimestamp(startedAt: string): string {
  const startedAtDate = new Date(startedAt);
  if (Number.isNaN(startedAtDate.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(startedAtDate);
}

function formatLocalDayKey(startedAt: string): string {
  const startedAtDate = new Date(startedAt);
  if (Number.isNaN(startedAtDate.getTime())) {
    return "invalid";
  }

  const year = startedAtDate.getFullYear();
  const month = String(startedAtDate.getMonth() + 1).padStart(2, "0");
  const day = String(startedAtDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDayHeading(dayKey: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey);
  if (match === null) {
    return dayKey;
  }

  const year = match[1];
  const month = match[2];
  const day = match[3];
  if (year === undefined || month === undefined || day === undefined) {
    return dayKey;
  }

  const headingDate = new Date(Number(year), Number(month) - 1, Number(day));
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(headingDate);
}

export interface HistoryEntry {
  id: string;
  title: string;
  detail: string;
  hasManual: boolean;
  mode: FocusRecord["mode"];
  recordRole: FocusRecord["recordRole"];
  startedAt: string;
  sortKey: string;
}

export interface HistoryDayGroup {
  dayKey: string;
  heading: string;
  entries: HistoryEntry[];
}
