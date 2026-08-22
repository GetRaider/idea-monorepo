import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, sep } from "node:path";

import { app } from "electron";
import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";

import { DEFAULT_SESSION_COLOR } from "../shared/session-colors";

const CREATE_SESSIONS_TABLE = `
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);
`;

const CREATE_RECORDS_TABLE = `
CREATE TABLE IF NOT EXISTS records (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  accumulated_seconds INTEGER NOT NULL DEFAULT 0,
  segment_started_at TEXT,
  planned_seconds INTEGER,
  mode TEXT NOT NULL CHECK (mode IN ('timer', 'stopwatch')),
  source TEXT NOT NULL CHECK (source IN ('live', 'manual')),
  kind TEXT NOT NULL DEFAULT 'unknown',
  session_id TEXT
);
`;

let sqlJs: SqlJsStatic | null = null;
let sqlDatabase: Database | null = null;
let databaseFilePath: string | null = null;

export async function initDatabase(userDataPath: string): Promise<Database> {
  mkdirSync(userDataPath, { recursive: true });
  const databaseFileName = "tempo.sqlite";
  const legacyDatabaseFileName = "focuzer.sqlite";
  databaseFilePath = join(userDataPath, databaseFileName);
  const legacyDatabaseFilePath = join(userDataPath, legacyDatabaseFileName);
  if (!existsSync(databaseFilePath) && existsSync(legacyDatabaseFilePath)) {
    copyFileSync(legacyDatabaseFilePath, databaseFilePath);
  }

  const SQL = await loadSqlJs();
  sqlJs = SQL;
  if (existsSync(databaseFilePath)) {
    const fileBuffer = readFileSync(databaseFilePath);
    sqlDatabase = new SQL.Database(fileBuffer);
  } else {
    sqlDatabase = new SQL.Database();
  }

  sqlDatabase.run(CREATE_SESSIONS_TABLE);
  sqlDatabase.run(CREATE_RECORDS_TABLE);
  migrateRecordsTable(sqlDatabase);
  migrateSessionsTable(sqlDatabase);
  persistDatabase();
  return sqlDatabase;
}

export function getDatabase(): Database {
  if (sqlDatabase === null) {
    throw new Error("Database is not initialized");
  }

  return sqlDatabase;
}

export function getDatabaseFilePath(): string {
  if (databaseFilePath === null) {
    throw new Error("Database is not initialized");
  }

  return databaseFilePath;
}

export function reloadDatabaseFromFile(filePath: string): void {
  if (sqlJs === null) {
    throw new Error("Database is not initialized");
  }

  persistDatabase();
  const fileBuffer = readFileSync(filePath);
  sqlDatabase?.close();
  sqlDatabase = new sqlJs.Database(fileBuffer);
  sqlDatabase.run(CREATE_SESSIONS_TABLE);
  sqlDatabase.run(CREATE_RECORDS_TABLE);
  migrateRecordsTable(sqlDatabase);
  migrateSessionsTable(sqlDatabase);
  persistDatabase();
}

export function persistDatabase(): void {
  if (sqlDatabase === null || databaseFilePath === null) {
    return;
  }

  const exported = sqlDatabase.export();
  writeFileSync(databaseFilePath, Buffer.from(exported));
}

function migrateRecordsTable(database: Database): void {
  const columnNames = getTableColumnNames(database, "records");
  if (!columnNames.has("kind")) {
    database.run(
      `ALTER TABLE records ADD COLUMN kind TEXT NOT NULL DEFAULT 'unknown'`,
    );
  }
  if (!columnNames.has("session_id")) {
    database.run(`ALTER TABLE records ADD COLUMN session_id TEXT`);
  }
}

function migrateSessionsTable(database: Database): void {
  const columnNames = getTableColumnNames(database, "sessions");
  if (!columnNames.has("color")) {
    database.run(
      `ALTER TABLE sessions ADD COLUMN color TEXT NOT NULL DEFAULT '${DEFAULT_SESSION_COLOR}'`,
    );
  }
}

function getTableColumnNames(
  database: Database,
  tableName: string,
): Set<string> {
  const result = database.exec(`PRAGMA table_info(${tableName})`);
  const names = new Set<string>();
  const table = result[0];
  if (table === undefined) {
    return names;
  }

  for (const row of table.values) {
    const columnName = row[1];
    if (typeof columnName === "string") {
      names.add(columnName);
    }
  }

  return names;
}

async function loadSqlJs(): Promise<SqlJsStatic> {
  const wasmBytes = readFileSync(resolveSqlJsAssetPath("sql-wasm.wasm"));
  const wasmBinary = wasmBytes.buffer.slice(
    wasmBytes.byteOffset,
    wasmBytes.byteOffset + wasmBytes.byteLength,
  );
  return initSqlJs({ wasmBinary });
}

function resolveSqlJsAssetPath(fileName: string): string {
  const packagedAssetPath = join(process.resourcesPath, fileName);
  if (app.isPackaged && existsSync(packagedAssetPath)) {
    return packagedAssetPath;
  }

  const require = createRequire(import.meta.url);
  return unpackAsarPath(join(dirname(require.resolve("sql.js")), fileName));
}

function unpackAsarPath(filePath: string): string {
  const asarSegment = `${sep}app.asar${sep}`;
  if (!filePath.includes(asarSegment)) {
    return filePath;
  }

  return filePath.replace(asarSegment, `${sep}app.asar.unpacked${sep}`);
}
