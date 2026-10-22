import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { rejectWorkspaceArgument } from "../guardrails/reject-workspace-argument";
import {
  AgentRunsRepository,
  type NormalizedToolResult,
} from "../runs/agent-runs.repository";
import { ToolRegistry } from "./tool-registry";

const TOOL_TIMEOUT_MS = 15_000;

@Injectable()
export class ToolExecutionLayer {
  constructor(
    private readonly registry: ToolRegistry,
    private readonly runs: AgentRunsRepository,
  ) {}

  async execute(input: ToolExecutionInput): Promise<NormalizedToolResult> {
    const existing = await this.runs.findToolExecution(input.jobId, input.toolCallId);
    if (existing) return existing.result as NormalizedToolResult;

    const rejected = rejectWorkspaceArgument(input.args);
    const handler = this.registry.get(input.name);
    if (rejected || !handler) {
      return this.finish(input, "failed", {
        ok: false,
        error: rejected ?? `Unknown tool: ${input.name}`,
      });
    }

    const parsed = handler.parameters.safeParse(input.args);
    if (!parsed.success) {
      return this.finish(input, "failed", {
        ok: false,
        error: "Invalid tool arguments",
      });
    }

    try {
      const data = await withTimeout(
        handler.handle({
          workspaceId: input.workspaceId,
          userId: input.userId,
          args: parsed.data,
        }),
        TOOL_TIMEOUT_MS,
      );
      return this.finish(input, "completed", { ok: true, data });
    } catch (error) {
      if (error instanceof ToolTimeoutError) {
        return this.finish(input, "failed", { ok: false, error: "timeout" });
      }
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        return this.finish(input, "failed", { ok: false, error: error.message });
      }
      throw error;
    }
  }

  private async finish(
    input: ToolExecutionInput,
    status: "completed" | "failed",
    result: NormalizedToolResult,
  ): Promise<NormalizedToolResult> {
    try {
      await this.runs.insertToolExecution({
        jobId: input.jobId,
        agentRunId: input.agentRunId,
        toolCallId: input.toolCallId,
        toolName: input.name,
        arguments: input.args,
        status,
        result,
      });
    } catch (error) {
      const raced = await this.runs.findToolExecution(input.jobId, input.toolCallId);
      if (raced) return raced.result as NormalizedToolResult;
      throw error;
    }
    return result;
  }
}

async function withTimeout<T>(work: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new ToolTimeoutError()), timeoutMs);
  });
  try {
    return await Promise.race([work, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

class ToolTimeoutError extends Error {}

export interface ToolExecutionInput {
  workspaceId: string;
  userId: string;
  jobId: string;
  agentRunId: string;
  toolCallId: string;
  name: string;
  args: unknown;
}
