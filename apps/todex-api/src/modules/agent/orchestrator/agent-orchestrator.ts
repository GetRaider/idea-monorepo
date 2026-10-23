import { Inject, Injectable } from "@nestjs/common";
import { UnrecoverableError } from "bullmq";

import type { AgentRunRow, JobRow } from "../../../db/schema";
import { ToolAllowsRepository } from "../allows/tool-allows.repository";
import { isWriteTool, toolAllowKey } from "../allows/tool-allow-key";
import { ContextService } from "../context/context.service";
import { ConversationsRepository } from "../conversations/conversations.repository";
import { JobsRepository } from "../jobs/jobs.repository";
import { LLM_CLIENT, type LlmClient } from "../llm/llm-client";
import { AgentRunsRepository } from "../runs/agent-runs.repository";
import { ToolExecutionLayer } from "../tools/tool-execution-layer";
import { ToolRegistry } from "../tools/tool-registry";

@Injectable()
export class AgentOrchestrator {
  constructor(
    private readonly conversations: ConversationsRepository,
    private readonly jobs: JobsRepository,
    private readonly runs: AgentRunsRepository,
    private readonly context: ContextService,
    private readonly tools: ToolExecutionLayer,
    private readonly registry: ToolRegistry,
    private readonly allows: ToolAllowsRepository,
    @Inject(LLM_CLIENT) private readonly llm: LlmClient,
  ) {}

  async execute(job: JobRow, run: AgentRunRow): Promise<void> {
    const startedAt = Date.now();
    let promptTokens = 0;
    let completionTokens = 0;
    await this.flushConfirmation(job, run);

    for (let iteration = 1; iteration <= run.maxIterations; iteration += 1) {
      if (Date.now() - startedAt > run.maxDurationMs) {
        return this.stopForLimit(
          job,
          run,
          "duration_limit",
          iteration,
          promptTokens,
          completionTokens,
        );
      }

      const assembled = await this.context.assemble(
        job.conversationId,
        job.workspaceId,
        run.maxTokens,
        job.mode,
      );
      if (!assembled.ok) {
        return this.stopForLimit(
          job,
          run,
          "token_limit",
          iteration,
          promptTokens,
          completionTokens,
        );
      }

      const completion = await this.llm.complete({
        messages: assembled.messages,
        tools: this.registry.definitions(job.mode),
      });
      promptTokens += completion.promptTokens;
      completionTokens += completion.completionTokens;

      await this.conversations.appendMessage({
        conversationId: job.conversationId,
        jobId: job.id,
        agentRunId: run.id,
        role: "assistant",
        content: completion.content,
        toolCalls: completion.toolCalls,
      });

      const writes = completion.toolCalls.filter((toolCall) => isWriteTool(toolCall.name));
      const allowed = await this.allows.allowedKeys(job.workspaceId, job.userId, writes);
      const needsConfirmation = writes.some(
        (toolCall) => !allowed.has(toolAllowKey(toolCall.name, toolCall.arguments)),
      );
      if (job.mode !== "ask" && needsConfirmation) {
        await this.runs.complete(run.id, {
          outcomeText: completion.content,
          promptTokens,
          completionTokens,
          iterationCount: iteration,
        });
        await this.jobs.markAwaitingConfirmation(
          job.id,
          completion.toolCalls.map((toolCall) => ({
            id: toolCall.id,
            name: toolCall.name,
            arguments: toolCall.arguments,
          })),
        );
        return;
      }

      if (completion.toolCalls.length === 0) {
        await this.runs.complete(run.id, {
          outcomeText: completion.content,
          promptTokens,
          completionTokens,
          iterationCount: iteration,
        });
        await this.jobs.markCompleted(job.id);
        return;
      }

      for (const toolCall of completion.toolCalls) {
        if (job.mode === "ask" && this.registry.get(toolCall.name)?.access !== "read") {
          await this.conversations.appendMessage({
            conversationId: job.conversationId,
            jobId: job.id,
            agentRunId: run.id,
            role: "tool",
            content: JSON.stringify({
              ok: false,
              error: "This run cannot change workspace data",
            }),
            toolCallId: toolCall.id,
          });
          continue;
        }
        const result = await this.tools.execute({
          workspaceId: job.workspaceId,
          userId: job.userId,
          jobId: job.id,
          agentRunId: run.id,
          toolCallId: toolCall.id,
          name: toolCall.name,
          args: toolCall.arguments,
        });
        await this.conversations.appendMessage({
          conversationId: job.conversationId,
          jobId: job.id,
          agentRunId: run.id,
          role: "tool",
          content: JSON.stringify(result),
          toolCallId: toolCall.id,
        });
      }
    }

    await this.stopForLimit(
      job,
      run,
      "iteration_limit",
      run.maxIterations,
      promptTokens,
      completionTokens,
    );
  }

  private async flushConfirmation(job: JobRow, run: AgentRunRow): Promise<void> {
    const pending = job.pendingToolCalls ?? [];
    if (pending.length === 0 || !job.confirmationDecision) return;
    for (const toolCall of pending) {
      const result =
        job.confirmationDecision === "approved"
          ? await this.tools.execute({
              workspaceId: job.workspaceId,
              userId: job.userId,
              jobId: job.id,
              agentRunId: run.id,
              toolCallId: toolCall.id,
              name: toolCall.name,
              args: toolCall.arguments,
            })
          : { ok: false as const, error: "Rejected by the user" };
      await this.conversations.appendMessage({
        conversationId: job.conversationId,
        jobId: job.id,
        agentRunId: run.id,
        role: "tool",
        content: JSON.stringify(result),
        toolCallId: toolCall.id,
      });
    }
    await this.jobs.clearPending(job.id);
  }

  private async stopForLimit(
    job: JobRow,
    run: AgentRunRow,
    errorCode: string,
    iterationCount: number,
    promptTokens: number,
    completionTokens: number,
  ): Promise<never> {
    await this.runs.fail(run.id, errorCode, errorCode, {
      iterationCount,
      promptTokens,
      completionTokens,
    });
    await this.jobs.markFailed(job.id, errorCode, errorCode);
    throw new UnrecoverableError(errorCode);
  }
}

