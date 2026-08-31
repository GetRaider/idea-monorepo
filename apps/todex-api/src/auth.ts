import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "./db/client";
import { users, sessions, accounts, verifications } from "./db/auth-schema";
import { ensureOwnerWorkspace } from "./db/ensure-workspace";
import { env } from "./env/env";

const isDevelopment = env.nodeEnv !== "production";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
    schema: { users, sessions, accounts, verifications },
  }),
  baseURL: env.api.baseUrl,
  secret: env.auth.secret,
  trustedOrigins: [env.web.baseUrl],
  basePath: "/api/auth",
  advanced: {
    useSecureCookies: !isDevelopment,
    cookiePrefix: "better-auth",
    cookies: {
      session_token: {
        attributes: {
          sameSite: isDevelopment ? "lax" : "none",
          secure: !isDevelopment,
          httpOnly: true,
        },
      },
      session_data: {
        attributes: {
          sameSite: isDevelopment ? "lax" : "none",
          secure: !isDevelopment,
          httpOnly: true,
        },
      },
    },
  },
  emailAndPassword: { enabled: false },
  socialProviders: {
    google: {
      clientId: env.google.clientId,
      clientSecret: env.google.clientSecret,
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
