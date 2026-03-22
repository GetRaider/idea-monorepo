import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { anonymous } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";

import { env } from "@/env";
import { db } from "@/lib/db/client";
import * as authSchema from "@/lib/db/modules/auth/auth.schema";

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
    },
  },
  plugins: [anonymous(), nextCookies()],
});
