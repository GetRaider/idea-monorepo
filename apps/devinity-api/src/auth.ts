import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db/client";
import { users, sessions, accounts, verifications } from "./db/auth-schema";
import { env } from "./env/env";

const isDevelopment = process.env.NODE_ENV !== "production";

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
          sameSite: "lax",
          secure: !isDevelopment,
          httpOnly: true,
        },
      },
      session_data: {
        attributes: {
          sameSite: "lax",
          secure: !isDevelopment,
          httpOnly: true,
        },
      },
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  },
  emailAndPassword: { enabled: false },
  socialProviders: {
    github: {
      clientId: env.github.clientId,
      clientSecret: env.github.clientSecret,
      callbackURL: `${env.api.baseUrl}/api/auth/callback/github`,
      redirectURL: env.web.baseUrl,
    },
  },
});
