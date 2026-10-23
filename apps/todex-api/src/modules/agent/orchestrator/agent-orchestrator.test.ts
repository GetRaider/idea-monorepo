import { describe, expect, it, vi } from "vitest";
import { UnrecoverableError } from "bullmq";
import { z } from "zod";

import type {
  AgentRunRow,
  ConversationMessageRow,
  JobRow,
} from "../../../db/schema";
import { ContextService } from "../context/context.service";
import type { LlmClient } from "../llm/llm-client";
import { AgentOrchestrator } from "./agent-orchestrator";
import { ToolExecutionLayer } from "../tools/tool-execution-layer";
import { ToolRegistry } from "../tools/tool-registry";

describe("AgentOrchestrator", () => {
  it("runs a tool once and completes the job", async () => {
    const handle = vi.fn(async () => ({ id: "task-1" }));
    const harness = createHarness(handle);
    harness.complete
      .mockResolvedValueOnce({
        content: "",
        toolCalls: [{ id: "call-1", name: "list_tasks", arguments: {} }],
        promptTokens: 3,
        completionTokens: 2,
      })
      .mockResolvedValueOnce({
        content: "Created it",
        toolCalls: [],
        promptTokens: 4,
        completionTokens: 1,
      });

    await harness.orchestrator.execute(job(), run());

    expect(handle).toHaveBeenCalledTimes(1);
    expect(harness.runs.complete).toHaveBeenCalledWith(
      "run-1",
      expect.objectContaining({ outcomeText: "Created it" }),
    );
    expect(harness.jobs.markCompleted).toHaveBeenCalledWith("job-1");

    harness.complete.mockResolvedValueOnce({
      content: "",
      toolCalls: [{ id: "call-1", name: "list_tasks", arguments: {} }],
      promptTokens: 1,
      completionTokens: 1,
    });
    harness.complete.mockResolvedValueOnce({
      content: "Created it",
      toolCalls: [],
      promptTokens: 1,
      completionTokens: 1,
    });

    await harness.orchestrator.execute(job(), run());

    expect(handle).toHaveBeenCalledTimes(1);
  });

  it("fails the run and job when every turn calls a tool", async () => {
    const handle = vi.fn(async () => ({ ok: true }));
    const harness = createHarness(handle);
    harness.complete.mockResolvedValue({
      content: "",
      toolCalls: [{ id: "call-9", name: "list_tasks", arguments: {} }],
      promptTokens: 1,
      completionTokens: 1,
    });

    await expect(
      harness.orchestrator.execute(job(), run({ maxIterations: 1 })),
    ).rejects.toBeInstanceOf(UnrecoverableError);

    expect(harness.runs.fail).toHaveBeenCalledWith(
      "run-1",
      "iteration_limit",
      "iteration_limit",
      expect.objectContaining({ iterationCount: 1 }),
    );
    expect(harness.jobs.markFailed).toHaveBeenCalledWith(
      "job-1",
      "iteration_limit",
      "iteration_limit",
    );
    expect(harness.runs.complete).not.toHaveBeenCalled();
  });

  it("waits for approval before a write and runs it after approve", async () => {
    const handle = vi.fn(async () => ({ id: "doc-1" }));
    const harness = createHarness(handle);
    harness.complete.mockResolvedValueOnce({
      content: "I can create that",
      toolCalls: [{ id: "call-2", name: "create_doc", arguments: { title: "Notes" } }],
      promptTokens: 1,
      completionTokens: 1,
    });

    await harness.orchestrator.execute(job(), run());

    expect(handle).not.toHaveBeenCalled();
    expect(harness.jobs.markAwaitingConfirmation).toHaveBeenCalledWith("job-1", [
      { id: "call-2", name: "create_doc", arguments: { title: "Notes" } },
    ]);
    expect(harness.jobs.markCompleted).not.toHaveBeenCalled();

    harness.complete.mockResolvedValueOnce({
      content: "Created it",
      toolCalls: [],
      promptTokens: 1,
      completionTokens: 1,
    });
    await harness.orchestrator.execute(
      job({
        pendingToolCalls: [{ id: "call-2", name: "create_doc", arguments: { title: "Notes" } }],
        confirmationDecision: "approved",
      }),
      run(),
    );

    expect(handle).toHaveBeenCalledTimes(1);
    expect(harness.jobs.clearPending).toHaveBeenCalledWith("job-1");
    expect(harness.jobs.markCompleted).toHaveBeenCalledWith("job-1");
  });

  it("runs an allowed write without waiting", async () => {
    const handle = vi.fn(async () => ({ id: "doc-1" }));
    const harness = createHarness(
      handle,
      new Set(['create_doc\0{"title":"Notes"}']),
    );
    harness.complete
      .mockResolvedValueOnce({
        content: "",
        toolCalls: [{ id: "call-3", name: "create_doc", arguments: { title: "Notes" } }],
        promptTokens: 1,
        completionTokens: 1,
      })
      .mockResolvedValueOnce({
        content: "Created it",
        toolCalls: [],
        promptTokens: 1,
        completionTokens: 1,
      });

    await harness.orchestrator.execute(job(), run());

    expect(handle).toHaveBeenCalledTimes(1);
    expect(harness.jobs.markAwaitingConfirmation).not.toHaveBeenCalled();
    expect(harness.jobs.markCompleted).toHaveBeenCalledWith("job-1");
  });

  it("does not offer or run write tools in ask mode", async () => {
    const handle = vi.fn(async () => ({ id: "doc-1" }));
    const harness = createHarness(handle);
    harness.complete.mockResolvedValueOnce({
      content: "I cannot change that",
      toolCalls: [{ id: "call-4", name: "create_doc", arguments: { title: "Notes" } }],
      promptTokens: 1,
      completionTokens: 1,
    });
    harness.complete.mockResolvedValueOnce({
      content: "Read only",
      toolCalls: [],
      promptTokens: 1,
      completionTokens: 1,
    });

    await harness.orchestrator.execute(job({ mode: "ask" }), run());

    const offered = harness.complete.mock.calls[0]?.[0] as { tools: { name: string }[] };
    expect(offered.tools.map((tool) => tool.name)).toEqual(["list_tasks"]);
    expect(handle).not.toHaveBeenCalled();
    expect(harness.jobs.markAwaitingConfirmation).not.toHaveBeenCalled();
    expect(harness.jobs.markCompleted).toHaveBeenCalledWith("job-1");
  });
});

function createHarness(
  handle: (input: unknown) => Promise<unknown>,
  allowed: Set<string> = new Set(),
) {
  const registry = new ToolRegistry();
  registry.register([
    {
      name: "list_tasks",
      access: "read",
      description: "List tasks",
      parameters: z.object({}).strict(),
      handle,
    },
    {
      name: "create_doc",
      access: "write",
      description: "Create a doc",
      parameters: z.object({ title: z.string() }).strict(),
      handle,
    },
  ]);
  const executions = new Map<string, { result: unknown }>();
  const runs = {
    findToolExecution: vi.fn(async (_jobId: string, toolCallId: string) => {
      return executions.get(toolCallId) ?? null;
    }),
    insertToolExecution: vi.fn(async (input: { toolCallId: string; result: unknown }) => {
      executions.set(input.toolCallId, { result: input.result });
    }),
    complete: vi.fn(),
    fail: vi.fn(),
  };
  const conversations = {
    listMessages: vi.fn(async () => [message("user", "Create a task")]),
    appendMessage: vi.fn(),
  };
  const jobs = {
    markCompleted: vi.fn(),
    markFailed: vi.fn(),
    markAwaitingConfirmation: vi.fn(),
    clearPending: vi.fn(),
  };
  const complete = vi.fn();
  const llm = { complete };
  const orchestrator = new AgentOrchestrator(
    conversations as never,
    jobs as never,
    runs as never,
    new ContextService(
      conversations as never,
      { listByWorkspace: async () => [] } as never,
      { search: async () => [] } as never,
      { embed: async () => [[0.1]] },
    ),
    new ToolExecutionLayer(registry, runs as never),
    registry,
    { allowedKeys: async () => allowed } as never,
    llm as LlmClient,
  );
  return { orchestrator, runs, jobs, complete };
}

function job(overrides?: Partial<JobRow>): JobRow {
  return {
    id: "job-1",
    conversationId: "conversation-1",
    workspaceId: "workspace-1",
    userId: "user-1",
    userMessageId: "message-1",
    status: "running",
    mode: "execute",
    idempotencyKey: "key-1",
    pendingToolCalls: null,
    confirmationDecision: null,
    errorCode: null,
    errorMessage: null,
    startedAt: new Date(),
    finishedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function run(overrides?: Partial<AgentRunRow>): AgentRunRow {
  return {
    id: "run-1",
    jobId: "job-1",
    attempt: 1,
    status: "running",
    model: "llama3.1:8b",
    outcomeText: null,
    promptTokens: 0,
    completionTokens: 0,
    iterationCount: 0,
    maxIterations: 8,
    maxDurationMs: 120_000,
    maxTokens: 8000,
    errorCode: null,
    errorMessage: null,
    startedAt: new Date(),
    finishedAt: null,
    ...overrides,
  };
}

function message(role: string, content: string): ConversationMessageRow {
  return {
    id: "message-1",
    conversationId: "conversation-1",
    jobId: "job-1",
    agentRunId: null,
    position: 0,
    role,
    content,
    toolCalls: null,
    toolCallId: null,
    createdAt: new Date(),
  };
}
