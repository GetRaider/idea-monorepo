import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import type { MessageCitation, WebSearchCapability } from "../../../db/schema";
import { env } from "../../../env/env";
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
    if (input.name === "web_search") return this.executeWebSearch(input);
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
          sources: input.sources,
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

  private async executeWebSearch(input: ToolExecutionInput): Promise<NormalizedToolResult> {
    const handler = this.registry.get("web_search");
    const gate = await this.runs.reserveWebSearch({
      jobId: input.jobId,
      agentRunId: input.agentRunId,
      toolCallId: input.toolCallId,
      args: input.args,
      webResearch: input.webResearch === true,
      webSearchCapability: input.webSearchCapability ?? "none",
      handlerRegistered: Boolean(handler),
      maxAttempts: env.ai.maxWebSearchCalls,
    });
    if (gate.action === "return") return gate.result;
    if (!handler) {
      return { ok: false, error: "web_search_unauthorized" };
    }
    const parsed = handler.parameters.safeParse(input.args);
    if (!parsed.success) {
      const result: NormalizedToolResult = { ok: false, error: "invalid_response" };
      await this.runs.finishWebSearch(input.jobId, input.toolCallId, "failed", result);
      return result;
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
      const error = readToolError(data);
      const result: NormalizedToolResult = error
        ? { ok: false, error }
        : { ok: true, data };
      await this.runs.finishWebSearch(input.jobId, input.toolCallId, error ? "failed" : "completed", result);
      return result;
    } catch (error) {
      const result: NormalizedToolResult = {
        ok: false,
        error: error instanceof ToolTimeoutError ? "timeout" : "unavailable",
      };
      await this.runs.finishWebSearch(input.jobId, input.toolCallId, "failed", result);
      if (
        error instanceof ToolTimeoutError ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        return result;
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

function readToolError(data: unknown): string | null {
  if (!data || typeof data !== "object" || !("error" in data)) return null;
  const error = (data as { error?: unknown }).error;
  return typeof error === "string" ? error : "unavailable";
}

export interface ToolExecutionInput {
  workspaceId: string;
  userId: string;
  jobId: string;
  agentRunId: string;
  toolCallId: string;
  name: string;
  args: unknown;
  sources?: MessageCitation[];
  webResearch?: boolean;
  webSearchCapability?: WebSearchCapability;
}
