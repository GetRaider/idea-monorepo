import { describe, expect, it, vi } from "vitest";

import { handlersForMcpTools, McpClient, type JsonRpcPost } from "./mcp-client";

describe("McpClient", () => {
  it("lists tools and calls one through the same session", async () => {
    const post = vi.fn<JsonRpcPost["post"]>(async (input) => {
      const body = input.body as { method: string };
      if (body.method === "initialize") {
        return {
          data: { jsonrpc: "2.0", id: 1, result: { protocolVersion: "2024-11-05" } },
          sessionId: "session-1",
        };
      }
      if (body.method === "notifications/initialized") {
        return { data: "", sessionId: null };
      }
      if (body.method === "tools/list") {
        return {
          data: {
            jsonrpc: "2.0",
            id: 2,
            result: {
              tools: [
                {
                  name: "lookup_note",
                  description: "Find a note",
                  inputSchema: { type: "object", properties: { q: { type: "string" } } },
                },
              ],
            },
          },
          sessionId: null,
        };
      }
      return {
        data: { jsonrpc: "2.0", id: 3, result: { content: [{ type: "text", text: "found" }] } },
        sessionId: null,
      };
    });
    const client = new McpClient("http://localhost:3001/mcp", post);

    const tools = await client.listTools();
    const result = await client.callTool("lookup_note", { q: "feedback" });

    expect(tools.map((tool) => tool.name)).toEqual(["lookup_note"]);
    expect(result).toEqual({ content: [{ type: "text", text: "found" }] });
    expect(post).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: "session-1", body: expect.objectContaining({ method: "tools/call" }) }),
    );
    const handlers = handlersForMcpTools(client, tools);
    expect(handlers[0]?.parametersJson).toEqual({
      type: "object",
      properties: { q: { type: "string" } },
    });
  });
});
