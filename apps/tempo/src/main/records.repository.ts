import type {
  AddManualRecordInput,
  FocusRecord,
  RecordSource,
  SessionKind,
  StartSessionInput,
  TimerMode,
  UpdateRecordInput,
} from "../shared/records.types";
import {
  buildLiveStartRecord,
  buildManualRecord,
  buildPausedRecord,
  buildResumedRecord,
  buildStoppedRecord,
  buildUpdatedRecord,
  validateDeleteRecord,
  validateManualRecord,
  validateStartSession,
  validateUpdateRecord,
} from "../helpers/session.helper";

import { getDatabase, persistDatabase } from "./db";
import { resolveSavedSessionForStart } from "./sessions.repository";

const RECORD_COLUMNS = `
  id,
  name,
  started_at,
  ended_at,
  accumulated_seconds,
  segment_started_at,
  planned_seconds,
  mode,
  source,
  kind,
  session_id
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

export function getActiveRecord(): FocusRecord | null {
  const statement = getDatabase().prepare(
    `SELECT ${RECORD_COLUMNS} FROM records WHERE ended_at IS NULL LIMIT 1`,
  );

  if (!statement.step()) {
    statement.free();
    return null;
  }

  const record = mapRow(statement.getAsObject());
  statement.free();
  return record;
}

export function startSession(input: StartSessionInput): FocusRecord {
  validateStartSession(input, getActiveRecord() !== null);
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

export function pauseSession(): FocusRecord {
  const activeRecord = requireActiveRecord();
  const pausedRecord = buildPausedRecord(activeRecord, Date.now());
  updateRecord(pausedRecord);
  persistDatabase();
  return pausedRecord;
}

export function resumeSession(): FocusRecord {
  const activeRecord = requireActiveRecord();
  const resumedRecord = buildResumedRecord(
    activeRecord,
    new Date().toISOString(),
  );
  updateRecord(resumedRecord);
  persistDatabase();
  return resumedRecord;
}

export function stopSession(): FocusRecord | null {
  const activeRecord = getActiveRecord();
  if (activeRecord === null) {
    return null;
  }

  const stoppedRecord = buildStoppedRecord(activeRecord, Date.now());
  updateRecord(stoppedRecord);
  persistDatabase();
  return stoppedRecord;
}

export function discardSession(): void {
  const activeRecord = getActiveRecord();
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

function requireActiveRecord(): FocusRecord {
  const activeRecord = getActiveRecord();
  if (activeRecord === null) {
    throw new Error("No active session");
  }

  return activeRecord;
}

function insertRecord(record: FocusRecord): void {
  getDatabase().run(
    `INSERT INTO records (
      id, name, started_at, ended_at, accumulated_seconds,
      segment_started_at, planned_seconds, mode, source, kind, session_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    serializeRecord(record),
  );
}

function updateRecord(record: FocusRecord): void {
  getDatabase().run(
    `UPDATE records SET
      name = ?,
      started_at = ?,
      ended_at = ?,
      accumulated_seconds = ?,
      segment_started_at = ?,
      planned_seconds = ?,
      mode = ?,
      source = ?,
      kind = ?,
      session_id = ?
    WHERE id = ?`,
    [
      record.name,
      record.startedAt,
      record.endedAt,
      record.accumulatedSeconds,
      record.segmentStartedAt,
      record.plannedSeconds,
      record.mode,
      record.source,
      record.kind,
      record.sessionId,
      record.id,
    ],
  );
}

function serializeRecord(record: FocusRecord): Array<string | number | null> {
  return [
    record.id,
    record.name,
    record.startedAt,
    record.endedAt,
    record.accumulatedSeconds,
    record.segmentStartedAt,
    record.plannedSeconds,
    record.mode,
    record.source,
    record.kind,
    record.sessionId,
  ];
}

function mapRow(row: Record<string, unknown>): FocusRecord {
  return {
    id: String(row.id),
    name: String(row.name),
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
  };
}
