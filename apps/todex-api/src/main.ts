import { NestFactory } from "@nestjs/core";
import { RequestMethod } from "@nestjs/common";
import type { IncomingMessage, ServerResponse } from "node:http";

import { AppModule } from "./modules/app.module";
import { promotePkceClients } from "./auth";
import { env } from "./env/env";
import {
  authorizationServerMetadata,
  McpHttp,
  protectedResourceMetadata,
} from "./modules/mcp/mcp-http";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  app.enableCors({
    origin: env.web.baseUrl,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  app.use((req: IncomingMessage & { path?: string; url?: string }, res: ServerResponse, next: () => void) => {
    const path = req.url?.split("?")[0] ?? "";
    if (req.method === "GET" && isDiscoveryPath(path)) {
      const body =
        path.endsWith("oauth-protected-resource")
          ? protectedResourceMetadata()
          : authorizationServerMetadata();
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.end(JSON.stringify(body));
      return;
    }
    if (req.method === "GET" && path === "/api/auth/oauth2/authorize" && req.url) {
      const url = new URL(req.url, env.api.baseUrl);
      if (!url.searchParams.get("prompt")) {
        url.searchParams.set("prompt", "consent");
        req.url = `${url.pathname}${url.search}`;
      }
    }
    next();
  });

  app.setGlobalPrefix("v1", {
    exclude: [
      { path: "health", method: RequestMethod.GET },
      { path: "api/auth/{*path}", method: RequestMethod.ALL },
    ],
  });

  const http = app.getHttpAdapter().getInstance() as {
    all: (
      path: string,
      handler: (req: IncomingMessage, res: ServerResponse) => void,
    ) => void;
  };
  const mcp = app.get(McpHttp);
  http.all("/mcp", (req, res) => {
    void mcp.handle(req, res);
  });

  const port = Number(env.port);
  await promotePkceClients();
  await app.listen(port);
}

function isDiscoveryPath(path: string): boolean {
  return (
    path === "/.well-known/oauth-authorization-server" ||
    path === "/.well-known/oauth-protected-resource" ||
    path === "/api/auth/.well-known/oauth-authorization-server" ||
    path === "/api/auth/.well-known/oauth-protected-resource"
  );
}

void bootstrap();
