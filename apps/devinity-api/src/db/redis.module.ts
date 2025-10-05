import { Global, Module, OnModuleDestroy } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import Redis from "ioredis";
import { REDIS_CLIENT } from "./redis.tokens";
import { env } from "../env/env";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => {
        const redis = new Redis({
          host: env.redis.host,
          port: env.redis.port,
          password: env.redis.password,
          db: env.redis.db,
          retryStrategy: (times: number) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          maxRetriesPerRequest: 3,
        });

        redis.on("connect", () => {
          console.log("✅ Redis connected successfully");
        });

        redis.on("error", (error) => {
          console.error("❌ Redis connection error:", error);
        });

        return redis;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnModuleDestroy {
  constructor() {}

  async onModuleDestroy() {
    // Redis client will be closed by the cache manager
  }
}
