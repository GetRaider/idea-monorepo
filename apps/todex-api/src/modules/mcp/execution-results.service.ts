import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { and, desc, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { taskExecutionResults } from "../../db/schema";
import { DRIZZLE_DB } from "../../db/tokens";

@Injectable()
export class ExecutionResultsService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: NodePgDatabase) {}

  async insert(input: InsertExecutionResult): Promise<ExecutionResult> {
    const [row] = await this.db
      .insert(taskExecutionResults)
      .values({
        id: randomUUID(),
        workspaceId: input.workspaceId,
        taskId: input.taskId,
        userId: input.userId,
        summary: input.summary,
        outcome: input.outcome,
        artifactUrls: input.artifactUrls,
        decisions: input.decisions,
      })
      .returning();
    if (!row) throw new Error("Execution result insert returned no row");
    return mapResult(row);
  }

  async listRecent(
    workspaceId: string,
    taskId: string,
    limit = 5,
  ): Promise<ExecutionResult[]> {
    const rows = await this.db
      .select()
      .from(taskExecutionResults)
      .where(
        and(
          eq(taskExecutionResults.workspaceId, workspaceId),
          eq(taskExecutionResults.taskId, taskId),
        ),
      )
      .orderBy(desc(taskExecutionResults.createdAt))
      .limit(limit);
    return rows.map(mapResult);
  }
}

function mapResult(row: typeof taskExecutionResults.$inferSelect): ExecutionResult {
  return {
    id: row.id,
    summary: row.summary,
    outcome: row.outcome,
    artifactUrls: row.artifactUrls,
    decisions: row.decisions,
    createdAt: row.createdAt.toISOString(),
    userId: row.userId,
  };
}

interface InsertExecutionResult {
  workspaceId: string;
  taskId: string;
  userId: string;
  summary: string;
  outcome: "implemented" | "blocked" | "partial";
  artifactUrls: string[];
  decisions: string;
}

export interface ExecutionResult {
  id: string;
  summary: string;
  outcome: "implemented" | "blocked" | "partial";
  artifactUrls: string[];
  decisions: string;
  createdAt: string;
  userId: string;
}
