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
        return betterAuth({
          database: drizzleAdapter(db, {
            provider: "pg",
            usePlural: true,
            schema: { users, sessions, accounts, verifications },
          }),
          baseURL: env.web.baseUrl,
          trustedOrigins: [env.web.baseUrl],
          basePath: "/api/auth",
          emailAndPassword: { enabled: false },
          socialProviders: {
            github: {
              clientId: env.github.clientId,
              clientSecret: env.github.clientSecret,
            },
          },
        });
      },
    },
  ],
  exports: [BETTER_AUTH],
})
export class AuthModule {}
