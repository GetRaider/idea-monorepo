import { describe, expect, it, vi } from "vitest";

import { hasScope, type McpCaller } from "./mcp-auth";
import {
  callMcpTool,
  createDocumentSchema,
  listTasksSchema,
  submitExecutionResultSchema,
  updateDocumentSchema,
  updateTaskSchema,
  type McpToolDeps,
} from "./mcp-tools";
import { omitActualTime } from "./omit-actual-time";
import { fitTaskContext, type TaskContext } from "./task-context.service";

const caller: McpCaller = {
  userId: "user-1",
  workspaceId: "workspace-1",
  scopes: new Set(["todex:read"]),
};

describe("mcp tool schemas", () => {
  it("rejects extra keys, missing task filters, empty updates, and bad urls", () => {
    expect(listTasksSchema.safeParse({}).success).toBe(false);
    expect(listTasksSchema.safeParse({ spaceId: "space-1", extra: true }).success).toBe(
      false,
    );
    expect(updateTaskSchema.safeParse({ taskId: "task-1" }).success).toBe(true);
    expect(updateDocumentSchema.safeParse({ docId: "doc-1" }).success).toBe(true);
    expect(
      createDocumentSchema.safeParse({ title: "Notes", content: "x".repeat(20_001) })
        .success,
    ).toBe(false);
    expect(
      submitExecutionResultSchema.safeParse({
        taskId: "task-1",
        summary: "Shipped",
        outcome: "implemented",
        artifactUrls: ["ftp://files.example/a"],
      }).success,
    ).toBe(false);
  });

  it("rejects workspaceId inside the tool call", async () => {
    const result = await callMcpTool(deps(), caller, "get_task", {
      taskId: "task-1",
      workspaceId: "other",
    });
    expect(result).toEqual({ isError: true, data: "workspaceId is not allowed" });
  });

  it("blocks writes for a read token", async () => {
    const result = await callMcpTool(deps(), caller, "update_task", {
      taskId: "task-1",
      summary: "Rename",
    });
    expect(result).toEqual({ isError: true, data: "Missing scope todex:write" });
  });

  it("returns no changes when an update has no fields", async () => {
    const writer: McpCaller = {
      ...caller,
      scopes: new Set(["todex:read", "todex:write"]),
    };
    const result = await callMcpTool(deps(), writer, "update_task", {
      taskId: "task-1",
    });
    expect(result).toEqual({ isError: true, data: "No changes" });
  });

  it("submits an execution result without updating the task", async () => {
    const update = vi.fn();
    const insert = vi.fn(async () => ({ id: "result-1" }));
    const get = vi.fn(async () => ({ id: "task-1", actualTime: 12 }));
    const writer: McpCaller = {
      ...caller,
      scopes: new Set(["todex:write"]),
    };
    const result = await callMcpTool(
      deps({
        tasks: { get, update, list: vi.fn(), create: vi.fn() } as never,
        results: { insert, listRecent: vi.fn() } as never,
      }),
      writer,
      "submit_execution_result",
      {
        taskId: "task-1",
        summary: "Implemented the handler",
        outcome: "implemented",
      },
    );
    expect(update).not.toHaveBeenCalled();
    expect(insert).toHaveBeenCalledOnce();
    expect(result.isError).toBe(false);
    expect(result.data).toEqual({ id: "result-1" });
    expect(hasScope(writer, "todex:read")).toBe(true);
  });
});

describe("omitActualTime", () => {
  it("drops actual time from tasks and nested lists", () => {
    const value = omitActualTime({
      id: "task-1",
      actualTime: 40,
      children: [{ id: "task-2", actualTime: 5 }],
    });
    expect(value).toEqual({
      id: "task-1",
      children: [{ id: "task-2" }],
    });
    expect(JSON.stringify(value)).not.toContain("actualTime");
  });
});

describe("fitTaskContext", () => {
  it("drops retrieved chunks before shortening documents", () => {
    const fitted = fitTaskContext(context());
    expect(fitted.truncated).toBe(true);
    expect(fitted.chunks).toEqual([]);
    expect(fitted.documents[0]?.plainText.length).toBeGreaterThan(0);
    expect(JSON.stringify(fitted).length).toBeLessThanOrEqual(24_000);
  });
});

function context(): TaskContext {
  return {
    task: { id: "task-1", summary: "Ship MCP" },
    documents: [{ id: "doc-1", type: "common", docKey: "DOC-1", title: "PRD", plainText: "d".repeat(30_000), truncated: false }],
    epic: null,
    parent: null,
    executionResults: [],
    chunks: Array.from({ length: 8 }, (_, index) => ({
      title: `chunk-${index}`,
      sourceType: "doc" as const,
      sourceId: `doc-${index}`,
      snippet: "s".repeat(500),
    })),
    retrievalError: null,
    truncated: false,
  };
}

function deps(overrides: Partial<McpToolDeps> = {}): McpToolDeps {
  return {
    docs: { get: vi.fn(), create: vi.fn(), update: vi.fn() },
    tasks: { get: vi.fn(), list: vi.fn(), create: vi.fn(), update: vi.fn() },
    spaces: { list: vi.fn() },
    knowledge: { search: vi.fn() },
    context: { get: vi.fn() },
    results: { insert: vi.fn(), listRecent: vi.fn() },
    ...overrides,
  } as McpToolDeps;
}
