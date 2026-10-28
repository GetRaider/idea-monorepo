import {
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { IncomingMessage, ServerResponse } from "node:http";

import { env } from "../../env/env";
import { DocsService } from "../docs/docs.service";
import { SpacesService } from "../spaces/spaces.service";
import { TasksService } from "../tasks/tasks.service";
import { ExecutionResultsService } from "./execution-results.service";
import { KnowledgeSearch } from "./knowledge-search";
import { McpAuthService, WWW_AUTHENTICATE, type McpCaller } from "./mcp-auth";
import { callMcpTool, MCP_TOOL_DEFINITIONS } from "./mcp-tools";
import { TaskContextService } from "./task-context.service";

const SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "todex:read",
  "todex:write",
];

export function authorizationServerMetadata() {
  const issuer = `${env.api.baseUrl}/api/auth`;
  return {
    issuer,
    authorization_endpoint: `${issuer}/oauth2/authorize`,
    token_endpoint: `${issuer}/oauth2/token`,
    registration_endpoint: `${issuer}/oauth2/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: [
      "none",
      "client_secret_basic",
      "client_secret_post",
    ],
    scopes_supported: SCOPES,
  };
}

export function protectedResourceMetadata() {
  return {
    resource: `${env.api.baseUrl}/mcp`,
    authorization_servers: [`${env.api.baseUrl}/api/auth`],
    scopes_supported: SCOPES,
    bearer_methods_supported: ["header"],
  };
}

@Injectable()
export class McpHttp {
  private readonly logger = new Logger(McpHttp.name);

  constructor(
    private readonly authService: McpAuthService,
    private readonly docs: DocsService,
    private readonly tasks: TasksService,
    private readonly spaces: SpacesService,
    private readonly knowledge: KnowledgeSearch,
    private readonly context: TaskContextService,
    private readonly results: ExecutionResultsService,
  ) {}

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    if (req.method === "OPTIONS") {
      writeCors(res);
      res.statusCode = 204;
      res.end();
      return;
    }
    if (req.method !== "POST" && req.method !== "GET" && req.method !== "DELETE") {
      res.statusCode = 405;
      res.end();
      return;
    }
    let caller: McpCaller;
    try {
      caller = await this.authService.authenticate(header(req, "authorization"));
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        writeCors(res);
        res.statusCode = 401;
        res.setHeader("WWW-Authenticate", WWW_AUTHENTICATE);
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Not authenticated" }));
        return;
      }
      if (error instanceof ForbiddenException) {
        writeCors(res);
        res.statusCode = 403;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: error.message }));
        return;
      }
      throw error;
    }

    const server = new McpServer({ name: "todex", version: "0.0.0" });
    for (const tool of MCP_TOOL_DEFINITIONS) {
      server.registerTool(
        tool.name,
        { description: tool.description, inputSchema: tool.schema },
        async (args) => {
          const result = await callMcpTool(
            {
              docs: this.docs,
              tasks: this.tasks,
              spaces: this.spaces,
              knowledge: this.knowledge,
              context: this.context,
              results: this.results,
            },
            caller,
            tool.name,
            args,
            this.logger,
          );
          return {
            isError: result.isError,
            content: [
              {
                type: "text" as const,
                text:
                  typeof result.data === "string"
                    ? result.data
                    : JSON.stringify(result.data),
              },
            ],
          };
        },
      );
    }
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    await server.connect(transport);
    writeCors(res);
    await transport.handleRequest(req, res);
    res.on("close", () => {
      void transport.close();
      void server.close();
    });
  }
}

function header(req: IncomingMessage, name: string): string | undefined {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

function writeCors(res: ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type, Accept, Mcp-Protocol-Version, Mcp-Session-Id",
  );
}
