import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { DRIZZLE_DB } from "../../../db/tokens";
import {
  agentRuns,
  agentToolExecutions,
  type AgentRunRow,
  type AgentToolExecutionRow,
} from "../../../db/schema";

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
    input: { outcomeText: string; promptTokens: number; completionTokens: number; iterationCount: number },
  ): Promise<void> {
    await this.db
      .update(agentRuns)
      .set({
        status: "completed",
        outcomeText: input.outcomeText,
        promptTokens: input.promptTokens,
        completionTokens: input.completionTokens,
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
    progress?: { promptTokens: number; completionTokens: number; iterationCount: number },
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
  maxIterations: number;
  maxDurationMs: number;
  maxTokens: number;
}

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
