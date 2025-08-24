import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

import { DRIZZLE_DB, PG_POOL } from './tokens';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: PG_POOL,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const connectionString =
          configService.get<string>('DB_URL') ||
          process.env.DATABASE_URL ||
          process.env.POSTGRES_URL ||
          process.env.POSTGRES_PRISMA_URL;

        if (!connectionString) {
          throw new Error(
            "Database connection string is missing. Set 'DB_URL' or 'DATABASE_URL'",
          );
        }

        const sslEnabled =
          configService.get('DB_SSL') === 'true' ||
          process.env.PGSSLMODE === 'require';

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
