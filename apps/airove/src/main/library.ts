import { randomUUID } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { dirname } from "node:path";

import initSqlJs, {
  type Database,
  type SqlValue,
  type SqlJsStatic,
} from "sql.js";

import type {
  Chat,
  Folder,
  Library,
  LibraryCommand,
  Provider,
  Space,
} from "../shared";
import { conversationUrl, meaningfulTitle } from "./conversation";
import { validateCommand } from "./validation";

export async function openLibrary(filePath: string): Promise<ChatLibrary> {
  mkdirSync(dirname(filePath), { recursive: true });
  const require = createRequire(import.meta.url);
  const wasmBytes = readFileSync(require.resolve("sql.js/dist/sql-wasm.wasm"));
  const SQL = await initSqlJs({
    wasmBinary: wasmBytes.buffer.slice(
      wasmBytes.byteOffset,
      wasmBytes.byteOffset + wasmBytes.byteLength,
    ),
  });
  const database = new SQL.Database(
    existsSync(filePath) ? readFileSync(filePath) : undefined,
  );
  database.run(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS spaces (
      id TEXT PRIMARY KEY, name TEXT NOT NULL,
      folderId TEXT REFERENCES folders(id) ON DELETE SET NULL,
      preferredProvider TEXT CHECK(preferredProvider IN ('chatgpt', 'claude')),
      createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY, provider TEXT NOT NULL CHECK(provider IN ('chatgpt', 'claude')),
      url TEXT NOT NULL, title TEXT NOT NULL,
      spaceId TEXT REFERENCES spaces(id) ON DELETE SET NULL,
      createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL, lastOpenedAt TEXT,
      titleIsManual INTEGER NOT NULL DEFAULT 0,
      UNIQUE(provider, url)
    );
    CREATE TABLE IF NOT EXISTS preferences (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    INSERT OR IGNORE INTO preferences VALUES ('lastProvider', 'chatgpt');
    PRAGMA user_version = 1;
  `);
  return new ChatLibrary(database, filePath, SQL);
}

export class ChatLibrary {
  constructor(
    private database: Database,
    private filePath: string,
    private SQL: SqlJsStatic,
  ) {}

  snapshot(): Library {
    return {
      folders: this.rows<Folder>(
        "SELECT * FROM folders ORDER BY name COLLATE NOCASE, id",
      ),
      spaces: this.rows<Space>(
        "SELECT * FROM spaces ORDER BY name COLLATE NOCASE, id",
      ),
      chats: this.rows<Chat>(
        "SELECT id, provider, url, title, spaceId, createdAt, updatedAt, lastOpenedAt FROM chats ORDER BY MAX(updatedAt, COALESCE(lastOpenedAt, updatedAt)) DESC, id",
      ),
      lastProvider:
        this.rows<{ value: Provider }>(
          "SELECT value FROM preferences WHERE key = 'lastProvider'",
        )[0]?.value ?? "chatgpt",
    };
  }

  edit(input: LibraryCommand): void {
    const command = validateCommand(input);
    const now = new Date().toISOString();
    this.mutate(() => {
      switch (command.type) {
        case "folder:create":
          this.database.run("INSERT INTO folders VALUES (?, ?, ?, ?)", [
            randomUUID(),
            command.name,
            now,
            now,
          ]);
          break;
        case "folder:rename":
          this.requireRecord("folders", command.id);
          this.database.run(
            "UPDATE folders SET name = ?, updatedAt = ? WHERE id = ?",
            [command.name, now, command.id],
          );
          break;
        case "folder:delete":
          this.requireRecord("folders", command.id);
          this.database.run(
            "UPDATE spaces SET folderId = NULL, updatedAt = ? WHERE folderId = ?",
            [now, command.id],
          );
          this.database.run("DELETE FROM folders WHERE id = ?", [command.id]);
          break;
        case "space:create":
          if (command.folderId) this.requireRecord("folders", command.folderId);
          this.database.run("INSERT INTO spaces VALUES (?, ?, ?, NULL, ?, ?)", [
            randomUUID(),
            command.name,
            command.folderId,
            now,
            now,
          ]);
          break;
        case "space:rename":
          this.requireRecord("spaces", command.id);
          this.database.run(
            "UPDATE spaces SET name = ?, updatedAt = ? WHERE id = ?",
            [command.name, now, command.id],
          );
          break;
        case "space:move":
          this.requireRecord("spaces", command.id);
          if (command.folderId) this.requireRecord("folders", command.folderId);
          this.database.run(
            "UPDATE spaces SET folderId = ?, updatedAt = ? WHERE id = ?",
            [command.folderId, now, command.id],
          );
          break;
        case "space:delete":
          this.requireRecord("spaces", command.id);
          this.database.run(
            "UPDATE chats SET spaceId = NULL, updatedAt = ? WHERE spaceId = ?",
            [now, command.id],
          );
          this.database.run("DELETE FROM spaces WHERE id = ?", [command.id]);
          break;
        case "chat:rename":
          this.requireRecord("chats", command.id);
          this.database.run(
            "UPDATE chats SET title = ?, titleIsManual = 1, updatedAt = ? WHERE id = ?",
            [command.name, now, command.id],
          );
          break;
        case "chat:move":
          this.requireRecord("chats", command.id);
          if (command.spaceId) this.requireRecord("spaces", command.spaceId);
          this.database.run(
            "UPDATE chats SET spaceId = ?, updatedAt = ? WHERE id = ?",
            [command.spaceId, now, command.id],
          );
          break;
        case "chat:remove":
          this.requireRecord("chats", command.id);
          this.database.run("DELETE FROM chats WHERE id = ?", [command.id]);
          break;
      }
    });
  }

  rememberProvider(provider: Provider, spaceId: string | null): void {
    this.mutate(() => {
      this.database.run(
        "UPDATE preferences SET value = ? WHERE key = 'lastProvider'",
        [provider],
      );
      if (spaceId) {
        this.requireRecord("spaces", spaceId);
        this.database.run(
          "UPDATE spaces SET preferredProvider = ?, updatedAt = ? WHERE id = ?",
          [provider, new Date().toISOString(), spaceId],
        );
      }
    });
  }

  capture(
    provider: Provider,
    url: string,
    title: string,
    spaceId: string | null,
    opened: boolean,
  ): boolean {
    const canonicalUrl = conversationUrl(provider, url);
    if (!canonicalUrl) return false;
    const existing = this.rows<Chat & { titleIsManual: number }>(
      "SELECT * FROM chats WHERE provider = ? AND url = ?",
      [provider, canonicalUrl],
    )[0];
    const nextTitle = meaningfulTitle(provider, title);
    const titleChanged =
      !!existing &&
      !existing.titleIsManual &&
      !!nextTitle &&
      nextTitle !== existing.title;
    if (existing && !titleChanged && !opened) return false;
    const now = new Date().toISOString();
    this.mutate(() => {
      if (!existing) {
        const validSpace =
          spaceId &&
          this.rows<{ id: string }>("SELECT id FROM spaces WHERE id = ?", [
            spaceId,
          ]).length
            ? spaceId
            : null;
        this.database.run(
          "INSERT INTO chats VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)",
          [
            randomUUID(),
            provider,
            canonicalUrl,
            nextTitle ??
              `Untitled ${provider === "chatgpt" ? "ChatGPT" : "Claude"} chat`,
            validSpace,
            now,
            now,
            opened ? now : null,
          ],
        );
      } else {
        this.database.run(
          "UPDATE chats SET title = ?, updatedAt = ?, lastOpenedAt = ? WHERE id = ?",
          [
            titleChanged ? nextTitle! : existing.title,
            titleChanged ? now : existing.updatedAt,
            opened ? now : existing.lastOpenedAt,
            existing.id,
          ],
        );
      }
    });
    return true;
  }

  getChat(id: string): Chat {
    this.requireRecord("chats", id);
    return this.rows<Chat>(
      "SELECT id, provider, url, title, spaceId, createdAt, updatedAt, lastOpenedAt FROM chats WHERE id = ?",
      [id],
    )[0]!;
  }

  hasChat(provider: Provider, url: string): boolean {
    const canonicalUrl = conversationUrl(provider, url);
    return (
      !!canonicalUrl &&
      this.rows<{ id: string }>(
        "SELECT id FROM chats WHERE provider = ? AND url = ?",
        [provider, canonicalUrl],
      ).length > 0
    );
  }

  close(): void {
    this.database.close();
  }

  private requireRecord(
    table: "folders" | "spaces" | "chats",
    id: string,
  ): void {
    if (
      !this.rows<{ id: string }>(`SELECT id FROM ${table} WHERE id = ?`, [id])
        .length
    )
      throw new Error("Record no longer exists. Refresh and try again.");
  }

  private rows<Row>(sql: string, parameters: SqlValue[] = []): Row[] {
    const statement = this.database.prepare(sql);
    try {
      statement.bind(parameters);
      const result: Row[] = [];
      while (statement.step()) result.push(statement.getAsObject() as Row);
      return result;
    } finally {
      statement.free();
    }
  }

  private mutate(operation: () => void): void {
    const before = this.database.export();
    const temporaryPath = `${this.filePath}.tmp`;
    this.database.run("PRAGMA foreign_keys = ON; BEGIN");
    try {
      operation();
      this.database.run("COMMIT");
      const data = this.database.export();
      this.database.run("PRAGMA foreign_keys = ON");
      writeFileSync(temporaryPath, data, { mode: 0o600 });
      renameSync(temporaryPath, this.filePath);
    } catch (error) {
      this.database.close();
      this.database = new this.SQL.Database(before);
      this.database.run("PRAGMA foreign_keys = ON");
      try {
        rmSync(temporaryPath, { force: true });
      } catch {
        /* Preserve the original write error. */
      }
      throw error;
    }
  }
}
