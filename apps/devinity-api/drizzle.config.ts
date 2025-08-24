import type { Config } from 'drizzle-kit';

import { processEnv } from './src/helpers/processEnv.helper';

export default {
  schema: ['./src/db/schema.ts', './src/db/auth-schema.ts'],
  dialect: 'postgresql',
  dbCredentials: { url: processEnv.DB_URL },
  out: './drizzle',
} satisfies Config;
