import { APP_FILTER } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { Logger, Module } from "@nestjs/common";
import { resolve } from "path";
import { AuthModule } from "@thallesp/nestjs-better-auth";

import { HttpExceptionFilter } from "@repo/api/helpers/httpExceptionFilter.helper";
import { UserModule } from "./user/user.module";
import { DatabaseModule } from "../db/database.module";
import { RedisModule } from "../db/redis.module";
import { CacheModule } from "../db/cache.module";
import { auth } from "../auth";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Search both app-level and repo-root .env files
      envFilePath: [
        // App-level
        `.env.${process.env.NODE_ENV}.local`,
        `.env.${process.env.NODE_ENV}`,
        ".env.local",
        ".env",
        // Monorepo root - specifically for Render deployments
        resolve(process.cwd(), "../../.env.local"),
        resolve(process.cwd(), `../../.env.${process.env.NODE_ENV}.local`),
        resolve(process.cwd(), `../../.env.${process.env.NODE_ENV}`),
        resolve(process.cwd(), "../../.env"),
      ],
      expandVariables: true,
    }),
    DatabaseModule,
    RedisModule,
    CacheModule,
    UserModule,
    AuthModule.forRoot({
      auth,
      disableTrustedOriginsCors: true, // We handle CORS in main.ts
    }),
  ],
  providers: [
    {
      provide: APP_FILTER,
      useFactory: () => new HttpExceptionFilter(),
    },
    Logger,
  ],
})
export class AppModule {}
