import { Global, Module } from "@nestjs/common";
import Redis from "ioredis";

import { env } from "../env/env";
import { REDIS } from "./tokens";

@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      useFactory: () =>
        new Redis(env.redis.url, {
          lazyConnect: true,
          connectTimeout: 1000,
          maxRetriesPerRequest: 1,
        }),
    },
  ],
  exports: [REDIS],
})
export class RedisModule {}
