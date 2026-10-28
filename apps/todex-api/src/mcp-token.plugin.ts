import { createAuthEndpoint, sessionMiddleware } from "better-auth/api";
import { z } from "zod";

const NINETY_DAYS_SECONDS = 90 * 24 * 60 * 60;

export function mcpTokenPlugin() {
  return {
    id: "mcp-token",
    endpoints: {
      createMcpToken: createAuthEndpoint(
        "/mcp-token/create",
        {
          method: "POST",
          use: [sessionMiddleware],
          body: z.object({
            name: z.string().trim().min(1).max(32),
            write: z.boolean().optional(),
          }),
        },
        async (ctx) => {
          const { auth } = await import("./auth.js");
          const write = ctx.body.write === true;
          return auth.api.createApiKey({
            body: {
              name: ctx.body.name,
              userId: ctx.context.session.user.id,
              prefix: "tdx_",
              expiresIn: NINETY_DAYS_SECONDS,
              permissions: { mcp: write ? ["read", "write"] : ["read"] },
            },
          });
        },
      ),
    },
  };
}
