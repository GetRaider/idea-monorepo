import { randomUUID } from "crypto";
import type { Server } from "node:http";
import express from "express";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { DocType } from "@repo/api/todex";

import { auth } from "../src/auth";
import { users } from "../src/db/auth-schema";
import { db, pool } from "../src/db/client";
import { ensureOwnerWorkspace } from "../src/db/ensure-workspace";
import {
  executionSessionTasks,
  executionSessions,
  tasks,
  workspaces,
} from "../src/db/schema";
import { ChunksRepository } from "../src/modules/agent/chunks/chunks.repository";
import { DocsService } from "../src/modules/docs/docs.service";
import { EpicsService } from "../src/modules/epics/epics.service";
import { ExecutionResultsService } from "../src/modules/mcp/execution-results.service";
import { KnowledgeSearch } from "../src/modules/mcp/knowledge-search";
import { McpAuthService } from "../src/modules/mcp/mcp-auth";
import { McpHttp } from "../src/modules/mcp/mcp-http";
import { TaskContextService } from "../src/modules/mcp/task-context.service";
import { SpacesService } from "../src/modules/spaces/spaces.service";
import { TasksService } from "../src/modules/tasks/tasks.service";
import { WorkspaceService } from "../src/modules/workspace/workspace.service";

describe("MCP server (e2e)", () => {
  let server: Server;
  const database: NodePgDatabase = db;
  let writeToken = "";
  let readToken = "";
  let otherToken = "";
  let userId = "";
  let otherUserId = "";
  let workspaceId = "";
  let otherWorkspaceId = "";
  let spaceId = "";
  let epicId = "";
  let goalId = "";
  let taskId = "";
  let docId = "";
  let otherTaskId = "";
  let otherDocId = "";

  beforeAll(async () => {
    const workspaceService = new WorkspaceService(database);
    const docs = new DocsService(database, workspaceService);
    const spaces = new SpacesService(database, workspaceService);
    const epics = new EpicsService(database, spaces);
    const tasksService = new TasksService(database, spaces, epics, workspaceService);
    const chunks = new ChunksRepository(database);
    const embeddings = { embed: async () => [] as number[][] };
    const results = new ExecutionResultsService(database);
    const mcp = new McpHttp(
      new McpAuthService(database),
      docs,
      tasksService,
      spaces,
      new KnowledgeSearch(chunks, embeddings),
      new TaskContextService(
        database,
        tasksService,
        docs,
        epics,
        results,
        chunks,
        embeddings,
      ),
      results,
    );
    const app = express();
    app.all("/mcp", (req, res) => {
      void mcp.handle(req, res);
    });
    server = await new Promise<Server>((resolve) => {
      const listening = app.listen(0, () => resolve(listening));
    });
    userId = randomUUID();
    otherUserId = randomUUID();
    await database.insert(users).values([
      userRow(userId, `mcp-a-${userId}@example.com`),
      userRow(otherUserId, `mcp-b-${otherUserId}@example.com`),
    ]);
    const member = await ensureOwnerWorkspace(database, userId, "Mcp A");
    const otherMember = await ensureOwnerWorkspace(database, otherUserId, "Mcp B");
    if (!member || !otherMember) throw new Error("workspace seed failed");
    workspaceId = member.workspaceId;
    otherWorkspaceId = otherMember.workspaceId;

    const space = await spaces.create(workspaceId, { name: "MCP space" });
    spaceId = space.id;
    const epic = await epics.create(workspaceId, spaceId, {
      name: "MCP epic",
      description: "",
    });
    epicId = epic.id;
    const goal = await docs.create(workspaceId, {
      type: DocType.GOAL,
      title: "Ship MCP",
    });
    goalId = goal.id;
    const otherSpace = await spaces.create(otherWorkspaceId, { name: "Other" });
    const foreignTask = await tasksService.create(otherWorkspaceId, {
      spaceId: otherSpace.id,
      summary: "Foreign",
      description: "",
      estimation: 30,
    });
    otherTaskId = foreignTask.id;
    const foreignDoc = await docs.create(otherWorkspaceId, {
      type: DocType.COMMON,
      title: "Foreign doc",
    });
    otherDocId = foreignDoc.id;

    writeToken = await issueKey(userId, ["read", "write"]);
    readToken = await issueKey(userId, ["read"]);
    otherToken = await issueKey(otherUserId, ["read", "write"]);
  }, 120_000);

  afterAll(async () => {
    if (workspaceId) {
      await database.delete(workspaces).where(eq(workspaces.id, workspaceId));
      await database.delete(workspaces).where(eq(workspaces.id, otherWorkspaceId));
      await database.delete(users).where(eq(users.id, userId));
      await database.delete(users).where(eq(users.id, otherUserId));
    }
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await pool.end();
  });

  it("rejects a call with no bearer", async () => {
    const response = await request(server)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Content-Type", "application/json")
      .send(rpc("tools/list"));
    expect(response.status).toBe(401);
    expect(response.headers["www-authenticate"]).toContain("resource_metadata");
  });

  it("lets a read token load a document and blocks writes", async () => {
    const created = await tool("create_document", {
      title: "Research notes",
      content: "External research",
    });
    docId = created.id as string;
    const loaded = await tool(
      "get_document",
      { docId },
      readToken,
    );
    expect(loaded.title).toBe("Research notes");
    const denied = await toolRaw(readToken, "update_task", {
      taskId: "missing",
      summary: "Nope",
    });
    expect(denied.isError).toBe(true);
    expect(denied.text).toBe("Missing scope todex:write");
  });

  it("creates a task, keeps status until an explicit update, and hides execution time", async () => {
    const created = await tool("create_task", {
      spaceId,
      epicId,
      summary: "Implement MCP",
      estimation: 45,
    });
    taskId = created.id as string;
    expect(created.actualTime).toBeUndefined();
    await tool("update_task", { taskId, goalId });
    const sessionId = randomUUID();
    await database.insert(executionSessions).values({
      id: sessionId,
      workspaceId,
      startedAt: new Date("2026-10-28T10:00:00.000Z"),
      endedAt: new Date("2026-10-28T11:00:00.000Z"),
      duration: 3600,
      executorType: "human",
    });
    await database.insert(executionSessionTasks).values({
      id: randomUUID(),
      sessionId,
      taskId,
      intervals: [
        {
          startedAt: "2026-10-28T10:00:00.000Z",
          endedAt: "2026-10-28T11:00:00.000Z",
        },
      ],
    });

    const loaded = await tool("get_task", { taskId }, readToken);
    expect(loaded.estimation).toBe(45);
    expect(loaded.epicId).toBe(epicId);
    expect(JSON.stringify(loaded)).not.toContain("actualTime");
    expect(JSON.stringify(loaded)).not.toContain(sessionId);

    const context = await tool("get_task_context", { taskId }, readToken);
    expect(JSON.stringify(context)).toContain(goalId);
    expect(JSON.stringify(context)).not.toContain("actualTime");
    expect(JSON.stringify(context)).not.toContain(sessionId);

    const before = await database.select().from(tasks).where(eq(tasks.id, taskId));
    await tool("submit_execution_result", {
      taskId,
      summary: "Handler is in todex-api",
      outcome: "implemented",
      decisions: "Keep execution sessions off this tool",
      artifactUrls: ["https://example.com/pr/1"],
    });
    const after = await database.select().from(tasks).where(eq(tasks.id, taskId));
    expect(after[0]?.status).toBe(before[0]?.status);

    const done = await tool("update_task", { taskId, status: "done" });
    expect(done.status).toBe("done");

    const foreignTask = await toolRaw(writeToken, "get_task", { taskId: otherTaskId });
    expect(foreignTask.isError).toBe(true);
    expect(foreignTask.text).toBe("Not found");
    const foreignDoc = await toolRaw(otherToken, "get_document", { docId });
    expect(foreignDoc.isError).toBe(true);
    expect(foreignDoc.text).toBe("Not found");
    const hiddenDoc = await toolRaw(writeToken, "get_document", { docId: otherDocId });
    expect(hiddenDoc.isError).toBe(true);
    expect(hiddenDoc.text).toBe("Not found");
  }, 120_000);

  async function tool(
    name: string,
    args: Record<string, unknown>,
    token = writeToken,
  ) {
    const result = await toolRaw(token, name, args);
    expect(result.isError).toBe(false);
    return JSON.parse(result.text) as Record<string, unknown>;
  }

  async function toolRaw(
    token: string,
    name: string,
    args: Record<string, unknown>,
  ) {
    const response = await request(server)
      .post("/mcp")
      .set("Authorization", `Bearer ${token}`)
      .set("Accept", "application/json, text/event-stream")
      .set("Content-Type", "application/json")
      .send(rpc("tools/call", { name, arguments: args }));
    expect(response.status).toBe(200);
    const payload = readRpc(response.text);
    const content = payload.result?.content?.[0]?.text;
    if (typeof content !== "string") {
      throw new Error(`Missing tool text: ${response.text}`);
    }
    return { isError: Boolean(payload.result?.isError), text: content };
  }
});

async function issueKey(userId: string, actions: string[]): Promise<string> {
  const created = await auth.api.createApiKey({
    body: {
      name: `mcp-${actions.join("-")}`,
      userId,
      prefix: "tdx_",
      expiresIn: 60 * 60 * 24,
      permissions: { mcp: actions },
    },
  });
  if (!created?.key) throw new Error("api key was not created");
  return created.key;
}

function rpc(method: string, params?: Record<string, unknown>) {
  return { jsonrpc: "2.0", id: 1, method, params };
}

function readRpc(text: string): {
  result?: { isError?: boolean; content?: { text?: string }[] };
} {
  const dataLine = text
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim())
    .at(-1);
  return JSON.parse(dataLine ?? text) as {
    result?: { isError?: boolean; content?: { text?: string }[] };
  };
}

function userRow(id: string, email: string) {
  const now = new Date();
  return {
    id,
    name: email,
    email,
    emailVerified: true,
    createdAt: now,
    updatedAt: now,
  };
}
