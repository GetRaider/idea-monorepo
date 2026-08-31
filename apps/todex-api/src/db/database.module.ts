import { Global, Module } from "@nestjs/common";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

import { DRIZZLE_DB, PG_POOL } from "./tokens";
import { env } from "../env/env";

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      useFactory: () => {
        return new Pool({
          connectionString: env.db.connectionString,
          ssl: false,
        });
      },
    },
    {
      provide: DRIZZLE_DB,
      inject: [PG_POOL],
      useFactory: (pool: Pool) => drizzle(pool),
    },
  ],
  exports: [PG_POOL, DRIZZLE_DB],
})
export class DatabaseModule {}
