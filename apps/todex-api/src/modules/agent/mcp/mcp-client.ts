import { BadRequestException } from "@nestjs/common";
import { z } from "zod";

import type { ToolHandler } from "../tools/tool-handler";

const looseArgs = z.record(z.string(), z.unknown());

export class McpClient {
  private sessionId: string | null = null;
  private nextId = 1;
  private ready = false;

  constructor(
    private readonly serverUrl: string,
    private readonly post: JsonRpcPost["post"],
  ) {}

  async listTools(): Promise<McpToolDefinition[]> {
    await this.initialize();
    const result = await this.rpc("tools/list", {});
    const tools = readTools(result);
    return tools;
  }

  async callTool(name: string, args: unknown): Promise<unknown> {
    await this.initialize();
    const result = await this.rpc("tools/call", { name, arguments: args });
    if (isRecord(result) && result.isError === true) {
      throw new BadRequestException(readToolError(result));
    }
    return result;
  }

  private async initialize(): Promise<void> {
    if (this.ready) return;
    const response = await this.rpc("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "todex", version: "0.0.0" },
    });
    if (!isRecord(response)) throw new Error("MCP initialize failed");
    await this.notify("notifications/initialized");
    this.ready = true;
  }

  private async rpc(method: string, params: unknown): Promise<unknown> {
    const id = this.nextId;
    this.nextId += 1;
    const response = await this.post({
      url: this.serverUrl,
      body: { jsonrpc: "2.0", id, method, params },
      sessionId: this.sessionId,
    });
    if (response.sessionId) this.sessionId = response.sessionId;
    const payload = readPayload(response.data);
    if (!isRecord(payload)) throw new Error(`MCP ${method} returned no JSON`);
    if (payload.error) throw new Error(`MCP ${method} failed`);
    return payload.result;
  }

  private async notify(method: string): Promise<void> {
    const response = await this.post({
      url: this.serverUrl,
      body: { jsonrpc: "2.0", method },
      sessionId: this.sessionId,
    });
    if (response.sessionId) this.sessionId = response.sessionId;
  }
}

export function handlersForMcpTools(
  client: McpClient,
  tools: McpToolDefinition[],
): ToolHandler[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description || tool.name,
    access: tool.name.startsWith("list_") || tool.name.startsWith("get_") ? "read" : "write",
    parameters: looseArgs,
    parametersJson: tool.inputSchema ?? { type: "object", additionalProperties: true },
    handle: (input) => client.callTool(tool.name, input.args),
  }));
}

function readTools(result: unknown): McpToolDefinition[] {
  if (!isRecord(result) || !Array.isArray(result.tools)) return [];
  const tools: McpToolDefinition[] = [];
  for (const entry of result.tools) {
    if (!isRecord(entry) || typeof entry.name !== "string") continue;
    if (!/^[A-Za-z0-9_-]+$/.test(entry.name)) continue;
    tools.push({
      name: entry.name,
      description: typeof entry.description === "string" ? entry.description : "",
      inputSchema: isRecord(entry.inputSchema) ? entry.inputSchema : undefined,
    });
  }
  return tools;
}

function readToolError(result: Record<string, unknown>): string {
  if (!Array.isArray(result.content)) return "MCP tool failed";
  const text = result.content.find(
    (entry) => isRecord(entry) && entry.type === "text" && typeof entry.text === "string",
  );
  return isRecord(text) && typeof text.text === "string" ? text.text : "MCP tool failed";
}

function readPayload(data: unknown): unknown {
  if (typeof data !== "string") return data;
  const line = data
    .split("\n")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith("data:"));
  if (!line) return data;
  try {
    return JSON.parse(line.slice("data:".length).trim());
  } catch {
    return data;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export interface JsonRpcPost {
  post(input: {
    url: string;
    body: unknown;
    sessionId: string | null;
  }): Promise<{ data: unknown; sessionId: string | null }>;
}

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
}
