import { Inject, Injectable } from "@nestjs/common";
import { UnrecoverableError } from "bullmq";

import type { AgentRunRow, JobRow, MessageCitation, PendingToolCall } from "../../../db/schema";
import { env } from "../../../env/env";
import { ToolAllowsRepository } from "../allows/tool-allows.repository";
import { isWriteTool, toolAllowKey } from "../allows/tool-allow-key";
import { ContextService } from "../context/context.service";
import { ConversationsRepository } from "../conversations/conversations.repository";
import { JobsRepository } from "../jobs/jobs.repository";
import { estimateMicroUsd, hasPriceRow } from "../llm/ai-price";
import { JobEventBus } from "../llm/job-event-bus";
import { LLM_CLIENT, type LlmClient, type LlmCompletion, type LlmToolCall } from "../llm/llm-client";
import { ProviderStateMissingError } from "../llm/responses-input";
import type { SearchResult } from "../search/search-provider";
import { ResearchSourceCollector } from "../sources/research-source-collector";
import { AgentRunsRepository, type NormalizedToolResult } from "../runs/agent-runs.repository";
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
    private readonly events: JobEventBus,
  ) {}

  async execute(job: JobRow, run: AgentRunRow): Promise<void> {
    const startedAt = Date.now();
    let promptTokens: number | null = 0;
    let completionTokens: number | null = 0;
    let webSearchCalls: number | null = env.ai.provider === "openai" ? 0 : null;
    let searxngCalls = 0;
    if (job.webResearch && job.webSearchCapability === "none") {
      return this.failJob(
        job,
        run,
        "web_search_unavailable",
        "This agent cannot search the web.",
        0,
        promptTokens,
        completionTokens,
        webSearchCalls,
      );
    }
    const history = await this.conversations.listMessages(job.conversationId);
    const collector = ResearchSourceCollector.reload(
      history.filter((message) => message.jobId === job.id),
      job.pendingToolCalls,
    );
    await this.flushConfirmation(job, run);

    for (let iteration = 1; iteration <= run.maxIterations; iteration += 1) {
      if (Date.now() - startedAt > run.maxDurationMs) {
        return this.failJob(
          job,
          run,
          "duration_limit",
          "duration_limit",
          iteration,
          promptTokens,
          completionTokens,
          reportedWebSearchCalls(webSearchCalls, searxngCalls),
        );
      }

      const blocked = await this.blockOpenAi(job, run, iteration, promptTokens, completionTokens, webSearchCalls, searxngCalls);
      if (blocked) return;

      const assembled = await this.context.assemble(
        job.conversationId,
        job.workspaceId,
        run.maxTokens,
        job.mode,
        { webResearch: job.webResearch, capability: job.webSearchCapability },
      );
      if (!assembled.ok) {
        return this.failJob(
          job,
          run,
          "token_limit",
          "token_limit",
          iteration,
          promptTokens,
          completionTokens,
          reportedWebSearchCalls(webSearchCalls, searxngCalls),
        );
      }

      let completion: LlmCompletion;
      try {
        completion = await this.llm.complete({
          messages: assembled.messages,
          tools: this.registry.definitions(job.mode, {
            webSearchTool: job.webResearch && job.webSearchCapability === "tool",
          }),
          webSearch: job.webResearch && job.webSearchCapability === "native",
          onDelta: (text) => {
            void this.events.publish(job.id, { type: "delta", text });
          },
        });
      } catch (error) {
        if (error instanceof ProviderStateMissingError) {
          return this.failJob(
            job,
            run,
            "provider_state_missing",
            error.message,
            iteration,
            promptTokens,
            completionTokens,
            reportedWebSearchCalls(webSearchCalls, searxngCalls),
          );
        }
        throw error;
      }
      promptTokens = addCount(promptTokens, completion.promptTokens);
      completionTokens = addCount(completionTokens, completion.completionTokens);
      if (env.ai.provider === "openai") {
        webSearchCalls = addCount(webSearchCalls, completion.webSearchCalls ?? null);
      }
      if (
        env.ai.provider === "openai" &&
        completion.toolCalls.length > 0 &&
        !completion.providerItems?.length
      ) {
        return this.failJob(
          job,
          run,
          "provider_state_missing",
          "The model reply cannot be continued.",
          iteration,
          promptTokens,
          completionTokens,
          webSearchCalls,
        );
      }

      const produced = collector.add(
        completion.citations ?? [],
        completion.content,
        env.ai.searxngMaxSnippetChars,
      );
      const writes = completion.toolCalls.filter((toolCall) => isWriteTool(toolCall.name));
      const snapshots = new Map(
        writes.map((toolCall) => [
          toolCall.id,
          collector.citationsFor(JSON.stringify(toolCall.arguments ?? {})),
        ]),
      );
      const visible = completion.content.trim().length > 0;
      const answerCitations = visible
        ? collector.citationsFor(completion.content)
        : produced;
      if (visible) collector.finishVisibleAnswer();

      await this.conversations.appendMessage({
        conversationId: job.conversationId,
        jobId: job.id,
        agentRunId: run.id,
        role: "assistant",
        content: completion.content,
        toolCalls: completion.toolCalls,
        citations: answerCitations,
        providerItems: env.ai.provider === "openai" ? completion.providerItems ?? [] : null,
      });

      const allowed = await this.allows.allowedKeys(job.workspaceId, job.userId, writes);
      const needsConfirmation = writes.some(
        (toolCall) => !allowed.has(toolAllowKey(toolCall.name, toolCall.arguments)),
      );
      if (job.mode !== "ask" && needsConfirmation) {
        await this.finishRun(run.id, completion.content, iteration, promptTokens, completionTokens, webSearchCalls, searxngCalls);
        await this.jobs.markAwaitingConfirmation(
          job.id,
          completion.toolCalls
            .filter((toolCall) => isWriteTool(toolCall.name))
            .map((toolCall) => pendingCall(toolCall, snapshots.get(toolCall.id) ?? [])),
        );
        await this.events.publish(job.id, {
          type: "status",
          status: "awaiting_confirmation",
        });
        return;
      }

      if (completion.toolCalls.length === 0) {
        await this.finishRun(run.id, completion.content, iteration, promptTokens, completionTokens, webSearchCalls, searxngCalls);
        await this.jobs.markCompleted(job.id);
        await this.events.publish(job.id, { type: "status", status: "completed" });
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
          sources: snapshots.get(toolCall.id),
          webResearch: job.webResearch,
          webSearchCapability: job.webSearchCapability,
        });
        if (toolCall.name === "web_search" && countsAsSearchAttempt(result)) searxngCalls += 1;
        const found = toolCall.name === "web_search" ? readSearchResults(result) : [];
        const citations = found.length
          ? collector.addResults(found, env.ai.searxngMaxSnippetChars)
          : undefined;
        await this.conversations.appendMessage({
          conversationId: job.conversationId,
          jobId: job.id,
          agentRunId: run.id,
          role: "tool",
          content: JSON.stringify(result),
          toolCallId: toolCall.id,
          citations,
        });
      }
    }

    return this.failJob(
      job,
      run,
      "iteration_limit",
      "iteration_limit",
      run.maxIterations,
      promptTokens,
      completionTokens,
      reportedWebSearchCalls(webSearchCalls, searxngCalls),
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
              sources: toolCall.sources ?? [],
              webResearch: job.webResearch,
              webSearchCapability: job.webSearchCapability,
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

  private async blockOpenAi(
    job: JobRow,
    run: AgentRunRow,
    iteration: number,
    promptTokens: number | null,
    completionTokens: number | null,
    webSearchCalls: number | null,
    searxngCalls: number,
  ): Promise<boolean> {
    if (env.ai.provider !== "openai") return false;
    if (!hasPriceRow(env.ai.model, env.ai.priceJson)) {
      await this.failJob(
        job,
        run,
        "price_unconfigured",
        "OpenAI pricing is not configured for this model.",
        iteration,
        promptTokens,
        completionTokens,
        reportedWebSearchCalls(webSearchCalls, searxngCalls),
      );
      return true;
    }
    const spend = await this.runs.openAiSpendMicroUsd(job.userId, job.workspaceId);
    const userCap = Math.round(env.ai.userDailyUsd * 1_000_000);
    const workspaceCap = Math.round(env.ai.workspaceDailyUsd * 1_000_000);
    if (spend.user >= userCap || spend.workspace >= workspaceCap) {
      await this.failJob(
        job,
        run,
        "budget_exceeded",
        "AI budget for today is used up.",
        iteration,
        promptTokens,
        completionTokens,
        reportedWebSearchCalls(webSearchCalls, searxngCalls),
      );
      return true;
    }
    return false;
  }

  private async finishRun(
    runId: string,
    outcomeText: string,
    iterationCount: number,
    promptTokens: number | null,
    completionTokens: number | null,
    webSearchCalls: number | null,
    searxngCalls: number,
  ): Promise<void> {
    const reported = reportedWebSearchCalls(webSearchCalls, searxngCalls);
    await this.runs.complete(runId, {
      outcomeText,
      promptTokens,
      completionTokens,
      webSearchCalls: reported,
      estimatedCostMicroUsd:
        env.ai.provider === "openai"
          ? estimateMicroUsd(
              env.ai.model,
              {
                inputTokens: promptTokens,
                outputTokens: completionTokens,
                webSearchCalls: reported,
              },
              env.ai.priceJson,
            )
          : null,
      iterationCount,
    });
  }

  private async failJob(
    job: JobRow,
    run: AgentRunRow,
    errorCode: string,
    errorMessage: string,
    iterationCount: number,
    promptTokens: number | null,
    completionTokens: number | null,
    webSearchCalls: number | null,
  ): Promise<never> {
    await this.runs.fail(run.id, errorCode, errorMessage, {
      iterationCount,
      promptTokens,
      completionTokens,
      webSearchCalls,
      estimatedCostMicroUsd: null,
    });
    await this.jobs.markFailed(job.id, errorCode, errorMessage);
    await this.events.publish(job.id, { type: "status", status: "failed" });
    throw new UnrecoverableError(errorCode);
  }
}

function pendingCall(toolCall: LlmToolCall, sources: MessageCitation[]): PendingToolCall {
  return {
    id: toolCall.id,
    name: toolCall.name,
    arguments: toolCall.arguments,
    sources,
  };
}

function addCount(current: number | null, next: number | null): number | null {
  if (current === null || next === null) return null;
  return current + next;
}

function reportedWebSearchCalls(hosted: number | null, searxngCalls: number): number | null {
  if (env.ai.provider === "openai") return hosted;
  return searxngCalls > 0 ? searxngCalls : null;
}

function countsAsSearchAttempt(result: NormalizedToolResult): boolean {
  return result.error !== "web_search_unauthorized" && result.error !== "limit";
}

function readSearchResults(result: NormalizedToolResult): SearchResult[] {
  if (!result.ok || !result.data || typeof result.data !== "object") return [];
  const rows = (result.data as { results?: unknown }).results;
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const record = row as Record<string, unknown>;
    if (typeof record.url !== "string" || typeof record.title !== "string") return [];
    return [
      {
        title: record.title,
        url: record.url,
        snippet: typeof record.snippet === "string" ? record.snippet : "",
        ...(typeof record.publishedAt === "string" ? { publishedAt: record.publishedAt } : {}),
      },
    ];
  });
}
