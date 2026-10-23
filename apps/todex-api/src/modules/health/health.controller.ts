import { Controller, Get, Inject, ServiceUnavailableException } from "@nestjs/common";
import { AllowAnonymous } from "@thallesp/nestjs-better-auth";
import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type Redis from "ioredis";

import { DRIZZLE_DB, REDIS } from "../../db/tokens";

@AllowAnonymous()
@Controller("health")
export class HealthController {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: NodePgDatabase,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  @Get()
  async check() {
    await this.db.execute(sql`select 1`);
    const redisStatus = await this.redis.ping();
    if (redisStatus !== "PONG") {
      throw new ServiceUnavailableException("Redis unavailable");
    }
    return { ok: true, postgres: "up", redis: "up" };
  }
}
