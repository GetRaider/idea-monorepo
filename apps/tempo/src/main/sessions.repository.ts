import type {
  SavedSession,
  UpdateSavedSessionInput,
} from "../shared/records.types";
import {
  assertSavedSessionNotInUse,
  pickDefaultSessionColor,
  validateSavedSessionName,
  validateSavedSessionReorder,
  validateUpdateSavedSession,
} from "../helpers/session.helper";
import {
  DEFAULT_BREAK_SESSION_NAME,
  LEGACY_REST_SESSION_NAME,
} from "../helpers/break.helper";

import { getDatabase, persistDatabase } from "./db";

const SESSION_SELECT = `SELECT id, name, color, created_at, sort_order FROM sessions`;

export function listSavedSessions(): SavedSession[] {
  const statement = getDatabase().prepare(
    `${SESSION_SELECT} ORDER BY sort_order ASC, name COLLATE NOCASE ASC`,
  );
  const sessions: SavedSession[] = [];

  while (statement.step()) {
    sessions.push(mapSavedSession(statement.getAsObject()));
  }

  statement.free();
  return sessions;
}

export function getSavedSession(sessionId: string): SavedSession | null {
  const statement = getDatabase().prepare(`${SESSION_SELECT} WHERE id = ?`);
  statement.bind([sessionId]);
  if (!statement.step()) {
    statement.free();
    return null;
  }

  const session = mapSavedSession(statement.getAsObject());
  statement.free();
  return session;
}

export function createSavedSession(name: string): SavedSession {
  const trimmedName = validateSavedSessionName(name);
  const existing = getSavedSessionByName(trimmedName);
  if (existing !== null) {
    return existing;
  }

  const session: SavedSession = {
    id: crypto.randomUUID(),
    name: trimmedName,
    color: pickDefaultSessionColor(trimmedName),
    createdAt: new Date().toISOString(),
    sortOrder: nextSavedSessionSortOrder(),
  };
  getDatabase().run(
    `INSERT INTO sessions (id, name, color, created_at, sort_order) VALUES (?, ?, ?, ?, ?)`,
    [
      session.id,
      session.name,
      session.color,
      session.createdAt,
      session.sortOrder,
    ],
  );
  persistDatabase();
  return session;
}

export function updateSavedSession(
  input: UpdateSavedSessionInput,
): SavedSession {
  const session = getSavedSession(input.id);
  if (session === null) {
    throw new Error("Backlog session not found");
  }

  assertSavedSessionNotInUse(
    session.id,
    isSavedSessionActive(session.id) ? session.id : null,
    "edit",
  );
  const validated = validateUpdateSavedSession(input);
  const existing = getSavedSessionByName(validated.name);
  if (existing !== null && existing.id !== session.id) {
    throw new Error("A backlog session with this name already exists");
  }

  getDatabase().run(`UPDATE sessions SET name = ?, color = ? WHERE id = ?`, [
    validated.name,
    validated.color,
    session.id,
  ]);
  persistDatabase();
  return { ...session, name: validated.name, color: validated.color };
}

export function deleteSavedSession(sessionId: string): void {
  assertSavedSessionNotInUse(
    sessionId,
    isSavedSessionActive(sessionId) ? sessionId : null,
    "delete",
  );
  getDatabase().run(
    `UPDATE records SET kind = 'unknown', session_id = NULL WHERE session_id = ?`,
    [sessionId],
  );
  getDatabase().run(`DELETE FROM sessions WHERE id = ?`, [sessionId]);
  compactSavedSessionSortOrder();
  persistDatabase();
}

export function reorderSavedSessions(orderedIds: string[]): SavedSession[] {
  const existingIds = listSavedSessions().map((session) => session.id);
  validateSavedSessionReorder(orderedIds, existingIds);
  orderedIds.forEach((sessionId, index) => {
    getDatabase().run(`UPDATE sessions SET sort_order = ? WHERE id = ?`, [
      index,
      sessionId,
    ]);
  });
  persistDatabase();
  return listSavedSessions();
}

export function resolveSavedSessionForStart(options: {
  kind: "unknown" | "backlog";
  sessionId: string | null;
  name: string;
  saveToBacklog: boolean;
}): SavedSession | null {
  if (options.kind === "backlog") {
    if (options.sessionId === null) {
      throw new Error("Select a backlog session");
    }

    const session = getSavedSession(options.sessionId);
    if (session === null) {
      throw new Error("Backlog session not found");
    }

    return session;
  }

  if (options.saveToBacklog) {
    return createSavedSession(options.name);
  }

  return null;
}

export function migrateRestSessionToBreak(): void {
  const restSession = getSavedSessionByName(LEGACY_REST_SESSION_NAME);
  if (restSession === null) {
    return;
  }

  const breakSession = getSavedSessionByName(DEFAULT_BREAK_SESSION_NAME);
  if (breakSession === null) {
    getDatabase().run(`UPDATE sessions SET name = ? WHERE id = ?`, [
      DEFAULT_BREAK_SESSION_NAME,
      restSession.id,
    ]);
    getDatabase().run(
      `UPDATE records SET name = ?, record_role = 'break' WHERE session_id = ?`,
      [DEFAULT_BREAK_SESSION_NAME, restSession.id],
    );
    persistDatabase();
    return;
  }

  getDatabase().run(
    `UPDATE records SET session_id = ?, name = ?, record_role = 'break' WHERE session_id = ?`,
    [breakSession.id, DEFAULT_BREAK_SESSION_NAME, restSession.id],
  );
  getDatabase().run(`DELETE FROM sessions WHERE id = ?`, [restSession.id]);
  persistDatabase();
}

function isSavedSessionActive(sessionId: string): boolean {
  const statement = getDatabase().prepare(
    `SELECT 1 FROM records WHERE ended_at IS NULL AND session_id = ? LIMIT 1`,
  );
  statement.bind([sessionId]);
  const isActive = statement.step();
  statement.free();
  return isActive;
}

function getSavedSessionByName(name: string): SavedSession | null {
  const statement = getDatabase().prepare(
    `${SESSION_SELECT} WHERE name = ? COLLATE NOCASE`,
  );
  statement.bind([name]);
  if (!statement.step()) {
    statement.free();
    return null;
  }

  const session = mapSavedSession(statement.getAsObject());
  statement.free();
  return session;
}

function nextSavedSessionSortOrder(): number {
  const statement = getDatabase().prepare(
    `SELECT COALESCE(MAX(sort_order), -1) AS max_sort FROM sessions`,
  );
  statement.step();
  const maxSort = Number(statement.getAsObject().max_sort);
  statement.free();
  return Number.isFinite(maxSort) ? maxSort + 1 : 0;
}

function compactSavedSessionSortOrder(): void {
  listSavedSessions().forEach((session, index) => {
    getDatabase().run(`UPDATE sessions SET sort_order = ? WHERE id = ?`, [
      index,
      session.id,
    ]);
  });
}

function mapSavedSession(row: Record<string, unknown>): SavedSession {
  const sortOrder = Number(row.sort_order);
  return {
    id: String(row.id),
    name: String(row.name),
    color:
      row.color == null
        ? pickDefaultSessionColor(String(row.name))
        : String(row.color),
    createdAt: String(row.created_at),
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
  };
}
