import { Controller, All, Req, Res, Inject } from "@nestjs/common";
import type { Request, Response as ExpressResponse } from "express";

import { BETTER_AUTH } from "./auth.constants";
import { env } from "src/env/env";

@Controller("api/auth")
export class BetterAuthProxyController {
  constructor(@Inject(BETTER_AUTH) private readonly auth: any) {}

  @All("*path")
  async proxy(@Req() req: Request, @Res() res: ExpressResponse) {
    try {
      // Convert Express request to standard Request format for better-auth
      const protocol =
        (req.headers["x-forwarded-proto"] as string) || req.protocol;
      const host = req.get("host");
      const url = `${protocol}://${host}${req.originalUrl}`;

      const headers = new Headers();
      Object.entries(req.headers).forEach(([key, value]) => {
        if (typeof value === "undefined") return;
        if (Array.isArray(value)) headers.set(key, value.join(","));
        else headers.set(key, String(value));
      });

      const method = req.method.toUpperCase();
      const hasBody = method !== "GET" && method !== "HEAD";

      const body = await (async () => {
        if (!hasBody) return undefined;
        const chunks: Buffer[] = [];
        await new Promise<void>((resolve, reject) => {
          req.on("data", (chunk) =>
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)),
          );
          req.on("end", () => resolve());
          req.on("error", reject);
        });
        return Buffer.concat(chunks);
      })();

      const request = new Request(url, { method, headers, body });
      const response = await this.auth.handler(request as any);

      // Debug logging
      console.log(`[Auth] ${method} ${req.originalUrl}`);
      console.log(`[Auth] Response status: ${response.status}`);
      const setCookieHeaders = response.headers.getSetCookie?.() || [];
      if (setCookieHeaders.length > 0) {
        console.log("[Auth] Set-Cookie headers:", setCookieHeaders);
      }

      // Set all headers from better-auth response first (includes Set-Cookie)
      res.status(response.status);
      response.headers.forEach((value, key) => res.setHeader(key, value));

      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (error) {
      console.error("Auth handler error:", error);
      res.status(500).json({
        error: "Authentication error",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
