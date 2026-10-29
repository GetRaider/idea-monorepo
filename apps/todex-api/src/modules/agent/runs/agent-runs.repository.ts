import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { DRIZZLE_DB } from "../../../db/tokens";
import {
  agentRuns,
  agentToolExecutions,
  jobs,
  type AgentRunRow,
  type AgentToolExecutionRow,
} from "../../../db/schema";
import { decideWebSearchReservation } from "../tools/web-search-reservation";

@Injectable()
export class AgentRunsRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: NodePgDatabase) {}

  async failOpenRuns(jobId: string): Promise<void> {
    const now = new Date();
    await this.db
      .update(agentRuns)
      .set({
        status: "failed",
        errorCode: "worker_failed",
        errorMessage: "worker_failed",
        finishedAt: now,
      })
      .where(and(eq(agentRuns.jobId, jobId), eq(agentRuns.status, "running")));
  }

  async nextAttempt(jobId: string): Promise<number> {
    const [row] = await this.db
      .select({
        value: sql<number>`coalesce(max(${agentRuns.attempt}), 0)`,
      })
      .from(agentRuns)
      .where(eq(agentRuns.jobId, jobId));
    return Number(row?.value ?? 0) + 1;
  }

  async insert(input: NewAgentRun): Promise<AgentRunRow> {
    const [row] = await this.db
      .insert(agentRuns)
      .values({
        id: randomUUID(),
        jobId: input.jobId,
        attempt: input.attempt,
        status: "running",
        model: input.model,
        provider: input.provider,
        maxIterations: input.maxIterations,
        maxDurationMs: input.maxDurationMs,
        maxTokens: input.maxTokens,
        startedAt: new Date(),
      })
      .returning();
    if (!row) throw new Error("Failed to insert agent run");
    return row;
  }

  async findLatest(jobId: string): Promise<AgentRunRow | null> {
    const [row] = await this.db
      .select()
      .from(agentRuns)
      .where(eq(agentRuns.jobId, jobId))
      .orderBy(desc(agentRuns.attempt))
      .limit(1);
    return row ?? null;
  }

  async complete(
    id: string,
    input: {
      outcomeText: string;
      promptTokens: number | null;
      completionTokens: number | null;
      webSearchCalls: number | null;
      estimatedCostMicroUsd: number | null;
      iterationCount: number;
    },
  ): Promise<void> {
    await this.db
      .update(agentRuns)
      .set({
        status: "completed",
        outcomeText: input.outcomeText,
        promptTokens: input.promptTokens,
        completionTokens: input.completionTokens,
        webSearchCalls: input.webSearchCalls,
        estimatedCostMicroUsd: input.estimatedCostMicroUsd,
        iterationCount: input.iterationCount,
        finishedAt: new Date(),
        errorCode: null,
        errorMessage: null,
      })
      .where(and(eq(agentRuns.id, id), eq(agentRuns.status, "running")));
  }

  async fail(
    id: string,
    errorCode: string,
    errorMessage: string,
    progress?: {
      promptTokens: number | null;
      completionTokens: number | null;
      webSearchCalls: number | null;
      estimatedCostMicroUsd: number | null;
      iterationCount: number;
    },
  ): Promise<void> {
    await this.db
      .update(agentRuns)
      .set({
        status: "failed",
        errorCode,
        errorMessage,
        finishedAt: new Date(),
        ...(progress
          ? {
              promptTokens: progress.promptTokens,
              completionTokens: progress.completionTokens,
              webSearchCalls: progress.webSearchCalls,
              estimatedCostMicroUsd: progress.estimatedCostMicroUsd,
              iterationCount: progress.iterationCount,
            }
          : {}),
      })
      .where(and(eq(agentRuns.id, id), eq(agentRuns.status, "running")));
  }

  async findToolExecution(
    jobId: string,
    toolCallId: string,
  ): Promise<AgentToolExecutionRow | null> {
    const [row] = await this.db
      .select()
      .from(agentToolExecutions)
      .where(
        and(
          eq(agentToolExecutions.jobId, jobId),
          eq(agentToolExecutions.toolCallId, toolCallId),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async openAiSpendMicroUsd(userId: string, workspaceId: string): Promise<{
    user: number;
    workspace: number;
  }> {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const [userRow] = await this.spend(userId, undefined, start);
    const [workspaceRow] = await this.spend(undefined, workspaceId, start);
    return {
      user: Number(userRow?.value ?? 0),
      workspace: Number(workspaceRow?.value ?? 0),
    };
  }

  async reserveWebSearch(input: ReserveWebSearch): Promise<ReserveWebSearchResult> {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`select id from jobs where id = ${input.jobId} for update`);
      const [existing] = await tx
        .select()
        .from(agentToolExecutions)
        .where(
          and(
            eq(agentToolExecutions.jobId, input.jobId),
            eq(agentToolExecutions.toolCallId, input.toolCallId),
          ),
        )
        .limit(1);
      const [countRow] = await tx
        .select({ value: sql<number>`count(*)` })
        .from(agentToolExecutions)
        .where(
          and(
            eq(agentToolExecutions.jobId, input.jobId),
            eq(agentToolExecutions.toolName, "web_search"),
            inArray(agentToolExecutions.status, ["reserved", "completed", "failed"]),
          ),
        );
      const decision = decideWebSearchReservation({
        existing: existing
          ? { status: existing.status, result: existing.result as NormalizedToolResult }
          : null,
        attemptCount: Number(countRow?.value ?? 0),
        webResearch: input.webResearch,
        webSearchCapability: input.webSearchCapability,
        handlerRegistered: input.handlerRegistered,
        maxAttempts: input.maxAttempts,
      });
      if (decision.action === "return" || decision.action === "run") return decision;
      await tx.insert(agentToolExecutions).values({
        id: randomUUID(),
        jobId: input.jobId,
        agentRunId: input.agentRunId,
        toolCallId: input.toolCallId,
        toolName: "web_search",
        arguments: input.args,
        status: decision.status,
        result: decision.result,
        createdAt: new Date(),
      });
      if (decision.status === "reserved") return { action: "run" };
      return { action: "return", result: decision.result };
    });
  }

  async finishWebSearch(
    jobId: string,
    toolCallId: string,
    status: "completed" | "failed",
    result: NormalizedToolResult,
  ): Promise<void> {
    await this.db
      .update(agentToolExecutions)
      .set({ status, result })
      .where(
        and(
          eq(agentToolExecutions.jobId, jobId),
          eq(agentToolExecutions.toolCallId, toolCallId),
        ),
      );
  }

  private spend(userId: string | undefined, workspaceId: string | undefined, start: Date) {
    return this.db
      .select({ value: sql<number>`coalesce(sum(${agentRuns.estimatedCostMicroUsd}), 0)` })
      .from(agentRuns)
      .innerJoin(jobs, eq(jobs.id, agentRuns.jobId))
      .where(
        and(
          eq(agentRuns.provider, "openai"),
          gte(agentRuns.startedAt, start),
          userId ? eq(jobs.userId, userId) : undefined,
          workspaceId ? eq(jobs.workspaceId, workspaceId) : undefined,
        ),
      );
  }

  async insertToolExecution(input: NewToolExecution): Promise<void> {
    await this.db.insert(agentToolExecutions).values({
      id: randomUUID(),
      jobId: input.jobId,
      agentRunId: input.agentRunId,
      toolCallId: input.toolCallId,
      toolName: input.toolName,
      arguments: input.arguments,
      status: input.status,
      result: input.result,
      createdAt: new Date(),
    });
  }
}

export interface NewAgentRun {
  jobId: string;
  attempt: number;
  model: string;
  provider: "ollama" | "openai";
  maxIterations: number;
  maxDurationMs: number;
  maxTokens: number;
}

export interface ReserveWebSearch {
  jobId: string;
  agentRunId: string;
  toolCallId: string;
  args: unknown;
  webResearch: boolean;
  webSearchCapability: string;
  handlerRegistered: boolean;
  maxAttempts: number;
}

export type ReserveWebSearchResult =
  | { action: "run" }
  | { action: "return"; result: NormalizedToolResult };

export interface NewToolExecution {
  jobId: string;
  agentRunId: string;
  toolCallId: string;
  toolName: string;
  arguments: unknown;
  status: "completed" | "failed";
  result: NormalizedToolResult;
}

export interface NormalizedToolResult {
  ok: boolean;
  data?: unknown;
  error?: string;
}
