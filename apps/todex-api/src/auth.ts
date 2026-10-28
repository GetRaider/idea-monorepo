import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { apiKey, oidcProvider } from "better-auth/plugins";
import { eq } from "drizzle-orm";

import { db } from "./db/client";
import {
  accounts,
  apikeys,
  oauthAccessTokens,
  oauthApplications,
  oauthConsents,
  sessions,
  users,
  verifications,
} from "./db/auth-schema";
import { ensureOwnerWorkspace } from "./db/ensure-workspace";
import { env } from "./env/env";
import { mcpTokenPlugin } from "./mcp-token.plugin";

const isDevelopment = env.nodeEnv !== "production";
const crossSiteSession = env.api.baseUrl.startsWith("https://");

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
    schema: {
      users,
      sessions,
      accounts,
      verifications,
      oauthApplications,
      oauthAccessTokens,
      oauthConsents,
      apikeys,
    },
  }),
  baseURL: env.api.baseUrl,
  secret: env.auth.secret,
  trustedOrigins: [env.web.baseUrl],
  basePath: "/api/auth",
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (!ctx.path?.includes("/oauth2/register")) return;
      const clientId = registeredClientId(ctx.context.returned);
      if (!clientId) return;
      await markOauthClientPublic(clientId);
    }),
  },
  advanced: {
    useSecureCookies: crossSiteSession,
    cookiePrefix: "better-auth",
    cookies: {
      session_token: {
        attributes: {
          sameSite: crossSiteSession ? "none" : "lax",
          secure: crossSiteSession,
          httpOnly: true,
        },
      },
      session_data: {
        attributes: {
          sameSite: crossSiteSession ? "none" : "lax",
          secure: crossSiteSession,
          httpOnly: true,
        },
      },
    },
  },
  emailAndPassword: { enabled: false },
  plugins: [
    oidcProvider({
      loginPage: `${env.web.baseUrl}/sign-in`,
      consentPage: `${env.web.baseUrl}/oauth/consent`,
      allowDynamicClientRegistration: true,
      requirePKCE: true,
      allowPlainCodeChallengeMethod: false,
      scopes: [
        "openid",
        "profile",
        "email",
        "offline_access",
        "todex:read",
        "todex:write",
      ],
    }),
    apiKey({
      defaultPrefix: "tdx_",
      requireName: true,
      disableSessionForAPIKeys: true,
      rateLimit: { enabled: false },
      keyExpiration: {
        defaultExpiresIn: 90 * 24 * 60 * 60,
      },
      permissions: {
        defaultPermissions: { mcp: ["read"] },
      },
    }),
    mcpTokenPlugin(),
  ],
  account: {
    accountLinking: {
      trustedProviders: ["google"],
    },
  },
  socialProviders: {
    google: {
      clientId: env.google.clientId,
      clientSecret: env.google.clientSecret,
      accessType: "offline",
      prompt: "select_account consent",
      scope: ["https://www.googleapis.com/auth/calendar.events"],
      ...(isDevelopment ? {} : { disableSignUp: true }),
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await ensureOwnerWorkspace(db, user.id, user.name);
        },
      },
    },
  },
});

export async function promotePkceClients(): Promise<void> {
  await db
    .update(oauthApplications)
    .set({ type: "public" })
    .where(eq(oauthApplications.type, "web"));
}

async function markOauthClientPublic(clientId: string): Promise<void> {
  await db
    .update(oauthApplications)
    .set({ type: "public" })
    .where(eq(oauthApplications.clientId, clientId));
}

function registeredClientId(returned: unknown): string | null {
  if (!returned || typeof returned !== "object" || !("client_id" in returned)) return null;
  const clientId = returned.client_id;
  return typeof clientId === "string" && clientId.length > 0 ? clientId : null;
}
