import { Module } from "@nestjs/common";
import { CacheModule as NestCacheModule } from "@nestjs/cache-manager";
import { redisStore } from "cache-manager-ioredis-yet";
import { env } from "../env/env";

@Module({
  imports: [
    NestCacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const store = await redisStore({
          host: env.redis.host,
          port: env.redis.port,
          password: env.redis.password,
          db: env.redis.db,
          ttl: 60 * 1000, // 60 seconds default TTL (in milliseconds)
        });

        return {
          store: store as any,
          ttl: 60 * 1000, // 60 seconds
        };
      },
    }),
  ],
})
export class CacheModule {}
