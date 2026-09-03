import type {
  ActiveSessionState,
  AddManualRecordInput,
  FocusRecord,
  RecordRole,
  RecordSource,
  SessionKind,
  StartSessionInput,
  TimerMode,
  UpdateRecordInput,
} from "../shared/records.types";
import {
  buildBreakStartRecord,
  DEFAULT_BREAK_SESSION_NAME,
  validateStartBreak,
} from "../helpers/break.helper";
import {
  buildLiveStartRecord,
  buildManualRecord,
  buildPausedRecord,
  buildResumedRecord,
  buildStoppedRecord,
  buildUpdatedRecord,
  normalizeScope,
  validateDeleteRecord,
  validateManualRecord,
  validateStartSession,
  validateUpdateRecord,
} from "../helpers/session.helper";

import { getDatabase, persistDatabase } from "./db";
import {
  createSavedSession,
  resolveSavedSessionForStart,
} from "./sessions.repository";

const RECORD_COLUMNS = `
  id,
  name,
  scope,
  started_at,
  ended_at,
  accumulated_seconds,
  segment_started_at,
  planned_seconds,
  mode,
  source,
  kind,
  session_id,
  record_role
`;

export function listRecords(): FocusRecord[] {
  const statement = getDatabase().prepare(
    `SELECT ${RECORD_COLUMNS} FROM records ORDER BY started_at DESC`,
  );
  const records: FocusRecord[] = [];

  while (statement.step()) {
    records.push(mapRow(statement.getAsObject()));
  }

  statement.free();
  return records;
}

export function getActiveFocusRecord(): FocusRecord | null {
  return getActiveRecordByRole("focus");
}

export function getActiveBreakRecord(): FocusRecord | null {
  return getActiveRecordByRole("break");
}

export function getActiveRecord(): FocusRecord | null {
  return getActiveFocusRecord();
}

export function getActiveSessionState(): ActiveSessionState {
  return {
    focus: getActiveFocusRecord(),
    break: getActiveBreakRecord(),
  };
}

export function startSession(input: StartSessionInput): FocusRecord {
  validateStartSession(input, getActiveFocusRecord() !== null);
  const savedSession = resolveSavedSessionForStart(input);
  const record = buildLiveStartRecord(
    input,
    crypto.randomUUID(),
    new Date().toISOString(),
    savedSession,
  );
  insertRecord(record);
  persistDatabase();
  return record;
}

export function startBreakSession(plannedSeconds: number): FocusRecord {
  const activeFocus = getActiveFocusRecord();
  const activeBreak = getActiveBreakRecord();
  validateStartBreak({
    plannedSeconds,
    activeFocus,
    activeBreak,
  });
  const savedSession = createSavedSession(DEFAULT_BREAK_SESSION_NAME);
  const record = buildBreakStartRecord(
    plannedSeconds,
    savedSession,
    crypto.randomUUID(),
    new Date().toISOString(),
  );
  insertRecord(record);
  persistDatabase();
  return record;
}

export function pauseSession(): FocusRecord {
  const activeRecord = requireActiveFocusRecord();
  const pausedRecord = buildPausedRecord(activeRecord, Date.now());
  updateRecord(pausedRecord);
  persistDatabase();
  return pausedRecord;
}

export function resumeSession(): FocusRecord {
  const activeRecord = requireActiveFocusRecord();
  const resumedRecord = buildResumedRecord(
    activeRecord,
    new Date().toISOString(),
  );
  updateRecord(resumedRecord);
  persistDatabase();
  return resumedRecord;
}

export function pauseBreakSession(): FocusRecord {
  const activeRecord = requireActiveBreakRecord();
  const pausedRecord = buildPausedRecord(activeRecord, Date.now());
  updateRecord(pausedRecord);
  persistDatabase();
  return pausedRecord;
}

export function stopSession(): FocusRecord | null {
  const activeRecord = getActiveFocusRecord();
  if (activeRecord === null) {
    return null;
  }

  const stoppedRecord = buildStoppedRecord(activeRecord, Date.now());
  updateRecord(stoppedRecord);
  persistDatabase();
  return stoppedRecord;
}

export function stopBreakSession(): FocusRecord | null {
  const activeRecord = getActiveBreakRecord();
  if (activeRecord === null) {
    return null;
  }

  const stoppedRecord = buildStoppedRecord(activeRecord, Date.now());
  updateRecord(stoppedRecord);
  persistDatabase();
  return stoppedRecord;
}

export function discardSession(): void {
  const activeRecord = getActiveFocusRecord();
  if (activeRecord === null) {
    return;
  }

  getDatabase().run(`DELETE FROM records WHERE id = ?`, [activeRecord.id]);
  persistDatabase();
}

export function discardBreakSession(): void {
  const activeRecord = getActiveBreakRecord();
  if (activeRecord === null) {
    return;
  }

  getDatabase().run(`DELETE FROM records WHERE id = ?`, [activeRecord.id]);
  persistDatabase();
}

export function addManualRecord(input: AddManualRecordInput): FocusRecord {
  validateManualRecord(input, Date.now());
  const savedSession = resolveSavedSessionForStart(input);
  const record = buildManualRecord(input, crypto.randomUUID(), savedSession);
  insertRecord(record);
  persistDatabase();
  return record;
}

export function updateCompletedRecord(input: UpdateRecordInput): FocusRecord {
  const existing = getRecordById(input.id);
  if (existing === null) {
    throw new Error("Record not found");
  }

  validateUpdateRecord(existing, input, Date.now());
  const savedSession = resolveSavedSessionForStart(input);
  const record = buildUpdatedRecord(existing, input, savedSession);
  updateRecord(record);
  persistDatabase();
  return record;
}

export function deleteCompletedRecord(recordId: string): void {
  const existing = getRecordById(recordId);
  if (existing === null) {
    throw new Error("Record not found");
  }

  validateDeleteRecord(existing);
  getDatabase().run(`DELETE FROM records WHERE id = ?`, [recordId]);
  persistDatabase();
}

function getActiveRecordByRole(recordRole: RecordRole): FocusRecord | null {
  const statement = getDatabase().prepare(
    `SELECT ${RECORD_COLUMNS} FROM records WHERE ended_at IS NULL AND record_role = ? LIMIT 1`,
  );
  statement.bind([recordRole]);

  if (!statement.step()) {
    statement.free();
    return null;
  }

  const record = mapRow(statement.getAsObject());
  statement.free();
  return record;
}

function getRecordById(recordId: string): FocusRecord | null {
  const statement = getDatabase().prepare(
    `SELECT ${RECORD_COLUMNS} FROM records WHERE id = ? LIMIT 1`,
  );
  statement.bind([recordId]);

  if (!statement.step()) {
    statement.free();
    return null;
  }

  const record = mapRow(statement.getAsObject());
  statement.free();
  return record;
}

function requireActiveFocusRecord(): FocusRecord {
  const activeRecord = getActiveFocusRecord();
  if (activeRecord === null) {
    throw new Error("No active session");
  }

  return activeRecord;
}

function requireActiveBreakRecord(): FocusRecord {
  const activeRecord = getActiveBreakRecord();
  if (activeRecord === null) {
    throw new Error("No active break");
  }

  return activeRecord;
}

function insertRecord(record: FocusRecord): void {
  getDatabase().run(
    `INSERT INTO records (
      id, name, scope, started_at, ended_at, accumulated_seconds,
      segment_started_at, planned_seconds, mode, source, kind, session_id, record_role
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    serializeRecord(record),
  );
}

function updateRecord(record: FocusRecord): void {
  getDatabase().run(
    `UPDATE records SET
      name = ?,
      scope = ?,
      started_at = ?,
      ended_at = ?,
      accumulated_seconds = ?,
      segment_started_at = ?,
      planned_seconds = ?,
      mode = ?,
      source = ?,
      kind = ?,
      session_id = ?,
      record_role = ?
    WHERE id = ?`,
    [
      record.name,
      record.scope,
      record.startedAt,
      record.endedAt,
      record.accumulatedSeconds,
      record.segmentStartedAt,
      record.plannedSeconds,
      record.mode,
      record.source,
      record.kind,
      record.sessionId,
      record.recordRole,
      record.id,
    ],
  );
}

function serializeRecord(record: FocusRecord): Array<string | number | null> {
  return [
    record.id,
    record.name,
    record.scope,
    record.startedAt,
    record.endedAt,
    record.accumulatedSeconds,
    record.segmentStartedAt,
    record.plannedSeconds,
    record.mode,
    record.source,
    record.kind,
    record.sessionId,
    record.recordRole,
  ];
}

function mapRow(row: Record<string, unknown>): FocusRecord {
  return {
    id: String(row.id),
    name: String(row.name),
    scope: normalizeScope(row.scope == null ? null : String(row.scope)),
    startedAt: String(row.started_at),
    endedAt: row.ended_at == null ? null : String(row.ended_at),
    accumulatedSeconds: Number(row.accumulated_seconds),
    segmentStartedAt:
      row.segment_started_at == null ? null : String(row.segment_started_at),
    plannedSeconds:
      row.planned_seconds == null ? null : Number(row.planned_seconds),
    mode: row.mode as TimerMode,
    source: row.source as RecordSource,
    kind: (row.kind as SessionKind | null) ?? "unknown",
    sessionId: row.session_id == null ? null : String(row.session_id),
    recordRole: (row.record_role as RecordRole | null) ?? "focus",
  };
}
