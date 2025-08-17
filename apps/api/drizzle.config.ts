import type { Config } from 'drizzle-kit';

import { processEnv } from '@helpers/processEnv.helper';

export default {
  schema: ['./src/db/schema.ts', './auth-schema.ts'],
  dialect: 'postgresql',
  dbCredentials: { url: processEnv.DB_URL },
  out: './drizzle',
} satisfies Config;
