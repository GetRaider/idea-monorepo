import { describe, expect, it, vi } from "vitest";

import { ToolExecutionLayer } from "./tool-execution-layer";
import { ToolRegistry } from "./tool-registry";
import { TaskToolHandler } from "./task-tool-handler";

describe("TaskToolHandler", () => {
  it("rejects a model-supplied workspace id and creates in the conversation workspace", async () => {
    const tasks = {
      create: vi.fn(async () => ({ id: "task-1" })),
      list: vi.fn(),
      get: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    };
    const registry = new ToolRegistry();
    registry.register(new TaskToolHandler(tasks as never).handlers());
    const runs = {
      findToolExecution: vi.fn(async () => null),
      insertToolExecution: vi.fn(),
    };
    const layer = new ToolExecutionLayer(registry, runs as never);

    const rejected = await layer.execute({
      workspaceId: "workspace-1",
      userId: "user-1",
      jobId: "job-1",
      agentRunId: "run-1",
      toolCallId: "call-reject",
      name: "create_task",
      args: { workspaceId: "other", spaceId: "board-1", summary: "Nope" },
    });

    expect(rejected).toEqual({
      ok: false,
      error: "workspaceId is not allowed",
    });
    expect(tasks.create).not.toHaveBeenCalled();

    const created = await layer.execute({
      workspaceId: "workspace-1",
      userId: "user-1",
      jobId: "job-1",
      agentRunId: "run-1",
      toolCallId: "call-create",
      name: "create_task",
      args: { spaceId: "board-1", summary: "Agent smoke test" },
    });

    expect(created.ok).toBe(true);
    expect(tasks.create).toHaveBeenCalledWith("workspace-1", {
      spaceId: "board-1",
      summary: "Agent smoke test",
      description: "",
      status: undefined,
      priority: undefined,
      estimation: 30,
    });
  });
});
