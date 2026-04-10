import { betterAuth } from "better-auth";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { anonymous } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";

import { AUTH_RESTRICTION_MESSAGE } from "@/constants/auth-restriction.constant";
import { ACCESS_RESTRICTED_NO_ACCOUNT_CODE } from "@/constants/whitelist.constant";
import { env } from "@/env";
import { db } from "@/db/client";
import * as authSchema from "@/db/schemas/auth.schema";

export const auth = betterAuth({
  secret: env.auth.secret,
  baseURL: env.auth.baseURL,
  onAPIError: { errorURL: `${env.auth.baseURL.replace(/\/$/, "")}/auth/error` },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: authSchema.user,
      session: authSchema.session,
      account: authSchema.account,
      verification: authSchema.verification,
    },
  }),
  emailAndPassword: { enabled: true },
  ...(env.auth.google
    ? {
        socialProviders: {
          google: {
            clientId: env.auth.google.clientId,
            clientSecret: env.auth.google.clientSecret,
            ...(env.nodeEnv === "production" ? { disableSignUp: true } : {}),
          },
        },
      }
    : {}),
  user: {
    additionalFields: {
      dateOfBirth: {
        type: "date",
        required: false,
        input: false,
      },
      isAnonymous: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
    },
  },
  plugins: [anonymous(), nextCookies()],
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (
        ctx.path === "/sign-in/email" &&
        ctx.body &&
        typeof ctx.body === "object"
      ) {
        const body = ctx.body as { email?: unknown };
        const email = body.email;
        if (typeof email === "string" && email.length > 0) {
          const rows = await db
            .select({ id: authSchema.user.id })
            .from(authSchema.user)
            .where(eq(authSchema.user.email, email))
            .limit(1);
          if (rows.length === 0) {
            throw new APIError("UNAUTHORIZED", {
              message: ACCESS_RESTRICTED_NO_ACCOUNT_CODE,
            });
          }
        }
      }
      if (env.nodeEnv !== "production") return;
      if (!isRestrictedAuthPath(ctx.path)) return;
      throw new APIError("FORBIDDEN", { message: AUTH_RESTRICTION_MESSAGE });
    }),
  },
});

function isRestrictedAuthPath(path: string): boolean {
  if (path === "/sign-in/anonymous") return false;
  if (path === "/sign-in/social") return false;
  if (path === "/sign-in/email") return false;
  if (path.startsWith("/callback")) return false;
  if (path.startsWith("/oauth2/callback")) return false;
  if (path.startsWith("/link-social")) return false;
  if (path.startsWith("/sign-in/")) return true;
  if (path.startsWith("/sign-up")) return true;
  if (path.startsWith("/request-password-reset")) return true;
  if (path.startsWith("/forget-password")) return true;
  if (path.startsWith("/reset-password")) return true;
  if (path.startsWith("/verify-email")) return true;
  if (path.startsWith("/magic-link")) return true;
  if (path.startsWith("/email-otp")) return true;
  if (path.startsWith("/one-tap/callback")) return true;
  if (path.startsWith("/passkey")) return true;
  return false;
}
