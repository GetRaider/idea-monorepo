import type { Config } from 'drizzle-kit';

import { env } from './src/env/env';

export default {
  schema: './src/database/schema.ts',
  dialect: 'postgresql',
  dbCredentials: { url: env.databaseUrl },
  out: './drizzle',
} satisfies Config;
