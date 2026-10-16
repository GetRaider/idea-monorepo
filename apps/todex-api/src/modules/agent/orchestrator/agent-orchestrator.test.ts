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
        toolCalls: [{ id: "call-1", name: "create_task", arguments: { summary: "A" } }],
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
      toolCalls: [{ id: "call-1", name: "create_task", arguments: { summary: "A" } }],
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
      toolCalls: [{ id: "call-9", name: "create_task", arguments: { summary: "A" } }],
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
});

function createHarness(handle: (input: unknown) => Promise<unknown>) {
  const registry = new ToolRegistry();
  registry.register([
    {
      name: "create_task",
      description: "Create a task",
      parameters: z.object({ summary: z.string() }).strict(),
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
  const jobs = { markCompleted: vi.fn(), markFailed: vi.fn() };
  const complete = vi.fn();
  const llm = { complete };
  const orchestrator = new AgentOrchestrator(
    conversations as never,
    jobs as never,
    runs as never,
    new ContextService(),
    new ToolExecutionLayer(registry, runs as never),
    registry,
    llm as LlmClient,
  );
  return { orchestrator, runs, jobs, complete };
}

function job(): JobRow {
  return {
    id: "job-1",
    conversationId: "conversation-1",
    workspaceId: "workspace-1",
    userId: "user-1",
    userMessageId: "message-1",
    status: "running",
    idempotencyKey: "key-1",
    errorCode: null,
    errorMessage: null,
    startedAt: new Date(),
    finishedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
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
