import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { DRIZZLE_DB } from "../../db/tokens";
import { users, sessions, accounts, verifications } from "../../db/auth-schema";
import { BetterAuthProxyController } from "./auth.controller";
import { BETTER_AUTH } from "./auth.constants";
import { env } from "../../env/env";

@Module({
  imports: [ConfigModule],
  controllers: [BetterAuthProxyController],
  providers: [
    {
      provide: BETTER_AUTH,
      inject: [ConfigService, DRIZZLE_DB],
      useFactory: (_, db: any) => {
        const isDevelopment = process.env.NODE_ENV !== "production";

        return betterAuth({
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
            // In dev: Lax allows same-site cookies (won't work cross-origin on different ports)
            // In prod: None + Secure allows cross-origin cookies over HTTPS
            useSecureCookies: !isDevelopment,
            cookiePrefix: "better-auth",
            // Custom cookie attributes
            cookies: {
              session_token: {
                attributes: {
                  sameSite: "lax",
                  secure: !isDevelopment,
                  // httpOnly: true,
                },
              },
              session_data: {
                attributes: {
                  sameSite: "lax",
                  secure: !isDevelopment,
                  // httpOnly: true,
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
              // Redirect back to frontend after successful auth
              redirectURL: env.web.baseUrl,
            },
          },
        });
      },
    },
  ],
  exports: [BETTER_AUTH],
})
export class AuthModule {}
