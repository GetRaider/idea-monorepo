import { betterAuth } from "better-auth";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { anonymous } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";

import { AUTH_RESTRICTION_MESSAGE } from "@/constants/auth-restriction.constant";
import { env } from "@/env";
import { db } from "@/db/client";
import * as authSchema from "@/db/schemas/auth.schema";

function isRestrictedAuthPath(path: string): boolean {
  if (path === "/sign-in/anonymous") return false;
  if (path.startsWith("/sign-in/")) return true;
  if (path.startsWith("/sign-up")) return true;
  if (path.startsWith("/callback")) return true;
  if (path.startsWith("/oauth2/callback")) return true;
  if (path.startsWith("/request-password-reset")) return true;
  if (path.startsWith("/forget-password")) return true;
  if (path.startsWith("/reset-password")) return true;
  if (path.startsWith("/verify-email")) return true;
  if (path.startsWith("/magic-link")) return true;
  if (path.startsWith("/email-otp")) return true;
  if (path.startsWith("/one-tap/callback")) return true;
  if (path.startsWith("/passkey")) return true;
  if (path.startsWith("/link-social")) return true;
  return false;
}

const productionAuthRestrictionBefore = createAuthMiddleware(async (ctx) => {
  if (env.nodeEnv !== "production") return;
  if (!isRestrictedAuthPath(ctx.path)) return;
  throw new APIError("FORBIDDEN", { message: AUTH_RESTRICTION_MESSAGE });
});

export const auth = betterAuth({
  secret: env.auth.secret,
  baseURL: env.auth.baseURL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: authSchema.user,
      session: authSchema.session,
      account: authSchema.account,
      verification: authSchema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  ...(env.auth.google
    ? {
        socialProviders: {
          google: {
            clientId: env.auth.google.clientId,
            clientSecret: env.auth.google.clientSecret,
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
  hooks: {
    before: productionAuthRestrictionBefore,
  },
  plugins: [anonymous(), nextCookies()],
});
