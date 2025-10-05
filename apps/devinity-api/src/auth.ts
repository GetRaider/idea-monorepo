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
    // TODO: check this out
    // crossSubDomainCookies: {
    //   enabled: true,
    //   // In production, this will use the root domain (e.g., .onrender.com)
    //   // In development, cookies won't work across localhost:3001 and localhost:8090
    //   domain: isDevelopment ? undefined : undefined,
    // },
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
