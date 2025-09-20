import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

import { DRIZZLE_DB, PG_POOL } from "./tokens";
import { env } from "../env/env";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: PG_POOL,
      inject: [ConfigService],
      useFactory: () => {
        const connectionString = env.db.dev_url;

        if (!connectionString) {
          throw new Error(
            "Database connection string is missing. Set 'DEV_DB_URL' or 'LOCAL_DB_URL'",
          );
        }

        // Supabase requires SSL connections
        const sslEnabled = true;

        return new Pool({
          connectionString,
          ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
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
