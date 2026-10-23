import { Injectable, Logger, OnModuleInit } from "@nestjs/common";

import { httpClient } from "@repo/api/helpers";

import { env } from "../../../env/env";
import { ToolRegistry } from "../tools/tool-registry";
import { handlersForMcpTools, McpClient, type JsonRpcPost } from "./mcp-client";

@Injectable()
export class McpRegistration implements OnModuleInit {
  private readonly logger = new Logger(McpRegistration.name);

  constructor(private readonly registry: ToolRegistry) {}

  async onModuleInit(): Promise<void> {
    const serverUrl = env.ai.mcpServerUrl;
    if (!serverUrl || env.nodeEnv === "test") return;
    try {
      const client = new McpClient(serverUrl, httpPost);
      const tools = await client.listTools();
      const available = tools.filter((tool) => !this.registry.get(tool.name));
      this.registry.register(handlersForMcpTools(client, available));
      this.logger.log(`Registered ${available.length} MCP tools`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "MCP registration failed";
      this.logger.error(message);
    }
  }
}

const httpPost: JsonRpcPost["post"] = async (input) => {
  const response = await httpClient.post<unknown>({
    url: input.url,
    body: input.body,
    timeout: 15_000,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      ...(input.sessionId ? { "Mcp-Session-Id": input.sessionId } : {}),
    },
  });
  const sessionHeader = headerValue(response.headers, "mcp-session-id");
  return { data: response.data, sessionId: sessionHeader };
};

function headerValue(headers: unknown, name: string): string | null {
  if (!headers || typeof headers !== "object") return null;
  const value = (headers as Record<string, unknown>)[name];
  return typeof value === "string" ? value : null;
}
