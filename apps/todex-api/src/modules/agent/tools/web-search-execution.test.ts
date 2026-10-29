import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { ToolExecutionLayer } from "./tool-execution-layer";
import { ToolRegistry } from "./tool-registry";
import { decideWebSearchReservation } from "./web-search-reservation";
import type { NormalizedToolResult } from "../runs/agent-runs.repository";

describe("web search execution", () => {
  it("rejects a search the job did not allow and does not call the handler", async () => {
    const handle = vi.fn(async () => ({ results: [] }));
    const { layer, rows } = layerFor(handle);
    const result = await layer.execute(call({ webResearch: false, webSearchCapability: "none" }));
    expect(result).toEqual({ ok: false, error: "web_search_unauthorized" });
    expect(handle).not.toHaveBeenCalled();
    expect(rows.filter((row) => row.status !== "rejected")).toHaveLength(0);
  });

  it("stops at three attempts and keeps the same tool call on one row", async () => {
    const handle = vi.fn(async () => ({ error: "unavailable" }));
    const { layer, rows } = layerFor(handle);
    for (const id of ["a", "b", "c"]) {
      await layer.execute(call({ toolCallId: id }));
    }
    const blocked = await layer.execute(call({ toolCallId: "d" }));
    expect(blocked).toEqual({ ok: false, error: "limit" });
    expect(handle).toHaveBeenCalledTimes(3);
    expect(rows.find((row) => row.toolCallId === "d")?.status).toBe("rejected");
    const again = await layer.execute(call({ toolCallId: "a" }));
    expect(again.error).toBe("unavailable");
    expect(rows.filter((row) => row.toolCallId === "a")).toHaveLength(1);
    expect(handle).toHaveBeenCalledTimes(3);
  });

  it("lets two concurrent calls reserve at most three attempts", async () => {
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const handle = vi.fn(async () => {
      await gate;
      return { results: [] };
    });
    const { layer, rows } = layerFor(handle);
    const pending = ["a", "b", "c", "d"].map((id) => layer.execute(call({ toolCallId: id })));
    await vi.waitFor(() => expect(rows.filter((row) => row.status === "reserved").length).toBe(3));
    release();
    await Promise.all(pending);
    expect(rows.filter((row) => row.status === "completed" || row.status === "failed")).toHaveLength(3);
    expect(rows.find((row) => row.status === "rejected")?.result).toEqual({ ok: false, error: "limit" });
  });
});

describe("tool definitions", () => {
  it("hides web search unless the call asks for it", () => {
    const registry = registryWith();
    expect(registry.definitions("ask").map((tool) => tool.name)).toEqual(["list_tasks"]);
    expect(registry.definitions("execute").map((tool) => tool.name)).toEqual([
      "list_tasks",
      "create_doc",
    ]);
    expect(registry.definitions("ask", { webSearchTool: true }).map((tool) => tool.name)).toEqual([
      "list_tasks",
      "web_search",
    ]);
    expect(registry.definitions("execute", { webSearchTool: true }).map((tool) => tool.name)).toContain(
      "create_doc",
    );
  });
});

function layerFor(handle: (input: unknown) => Promise<unknown>) {
  const registry = registryWith(handle);
  const rows: StoredRow[] = [];
  let chain = Promise.resolve();
  const runs = {
    reserveWebSearch: vi.fn(async (input: ReserveInput) => {
      const run = chain.then(() => reserve(rows, input));
      chain = run.then(
        () => undefined,
        () => undefined,
      );
      return run;
    }),
    finishWebSearch: vi.fn(
      async (jobId: string, toolCallId: string, status: string, result: NormalizedToolResult) => {
        const row = rows.find((entry) => entry.jobId === jobId && entry.toolCallId === toolCallId);
        if (!row) return;
        row.status = status;
        row.result = result;
      },
    ),
    findToolExecution: vi.fn(async () => null),
    insertToolExecution: vi.fn(),
  };
  return { layer: new ToolExecutionLayer(registry, runs as never), rows };
}

function reserve(rows: StoredRow[], input: ReserveInput) {
  const existing = rows.find((row) => row.jobId === input.jobId && row.toolCallId === input.toolCallId);
  const decision = decideWebSearchReservation({
    existing: existing ? { status: existing.status, result: existing.result } : null,
    attemptCount: rows.filter((row) =>
      ["reserved", "completed", "failed"].includes(row.status),
    ).length,
    webResearch: input.webResearch,
    webSearchCapability: input.webSearchCapability,
    handlerRegistered: input.handlerRegistered,
    maxAttempts: input.maxAttempts,
  });
  if (decision.action !== "insert") return decision;
  rows.push({
    jobId: input.jobId,
    toolCallId: input.toolCallId,
    status: decision.status,
    result: decision.result,
  });
  if (decision.status === "reserved") return { action: "run" as const };
  return { action: "return" as const, result: decision.result };
}

function registryWith(handle: (input: unknown) => Promise<unknown> = async () => ({ results: [] })) {
  const registry = new ToolRegistry();
  registry.register([
    { name: "list_tasks", access: "read", description: "List", parameters: z.object({}), handle },
    {
      name: "create_doc",
      access: "write",
      description: "Create",
      parameters: z.object({}),
      handle,
    },
    {
      name: "web_search",
      access: "read",
      description: "Search",
      parameters: z.object({ query: z.string() }),
      handle,
    },
  ]);
  return registry;
}

function call(overrides?: Partial<Parameters<ToolExecutionLayer["execute"]>[0]>) {
  return {
    workspaceId: "workspace-1",
    userId: "user-1",
    jobId: "job-1",
    agentRunId: "run-1",
    toolCallId: "call-1",
    name: "web_search",
    args: { query: "todex" },
    webResearch: true,
    webSearchCapability: "tool" as const,
    ...overrides,
  };
}

interface StoredRow {
  jobId: string;
  toolCallId: string;
  status: string;
  result: NormalizedToolResult;
}

interface ReserveInput {
  jobId: string;
  toolCallId: string;
  webResearch: boolean;
  webSearchCapability: string;
  handlerRegistered: boolean;
  maxAttempts: number;
}
