import { Controller, Get, Inject } from "@nestjs/common";
import { AllowAnonymous } from "@thallesp/nestjs-better-auth";
import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { DRIZZLE_DB } from "../../db/tokens";

@AllowAnonymous()
@Controller("health")
export class HealthController {
  constructor(@Inject(DRIZZLE_DB) private readonly db: NodePgDatabase) {}

  @Get()
  async check() {
    await this.db.execute(sql`select 1`);
    return { ok: true, postgres: "up" };
  }
}
