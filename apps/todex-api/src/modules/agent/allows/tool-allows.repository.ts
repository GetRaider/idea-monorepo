import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { and, eq, inArray } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { agentToolAllows } from "../../../db/schema";
import { DRIZZLE_DB } from "../../../db/tokens";
import { isWriteTool, stableJson, toolAllowKey } from "./tool-allow-key";

@Injectable()
export class ToolAllowsRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: NodePgDatabase) {}

  async allowedKeys(
    workspaceId: string,
    userId: string,
    calls: NamedCall[],
  ): Promise<Set<string>> {
    const writes = calls.filter((call) => isWriteTool(call.name));
    if (writes.length === 0) return new Set();
    const names = [...new Set(writes.map((call) => call.name))];
    const rows = await this.db
      .select({
        toolName: agentToolAllows.toolName,
        argumentsJson: agentToolAllows.argumentsJson,
      })
      .from(agentToolAllows)
      .where(
        and(
          eq(agentToolAllows.workspaceId, workspaceId),
          eq(agentToolAllows.userId, userId),
          inArray(agentToolAllows.toolName, names),
        ),
      );
    return new Set(rows.map((row) => `${row.toolName}\0${row.argumentsJson}`));
  }

  async grant(workspaceId: string, userId: string, calls: NamedCall[]): Promise<void> {
    const writes = calls.filter((call) => isWriteTool(call.name));
    const seen = new Set<string>();
    const values = writes.flatMap((call) => {
      const key = toolAllowKey(call.name, call.arguments);
      if (seen.has(key)) return [];
      seen.add(key);
      return [
        {
          id: randomUUID(),
          workspaceId,
          userId,
          toolName: call.name,
          argumentsJson: stableJson(call.arguments),
        },
      ];
    });
    if (values.length === 0) return;
    await this.db.insert(agentToolAllows).values(values).onConflictDoNothing();
  }
}

interface NamedCall {
  name: string;
  arguments: unknown;
}
