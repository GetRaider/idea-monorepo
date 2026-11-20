import { config } from 'dotenv';
import { resolve } from 'node:path';
import { z } from 'zod';

config({ path: resolve(process.cwd(), '.env.local') });

const parsedEnv = z
  .object({
    PORT: z.coerce.number().int().positive().default(8092),
    DATABASE_URL: z
      .string()
      .url()
      .default('postgresql://postgres:password@localhost:5435/evolin'),
    WEB_ORIGIN: z.string().url().default('http://localhost:8081'),
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
  })
  .parse(process.env);

export const env = {
  port: parsedEnv.PORT,
  databaseUrl: parsedEnv.DATABASE_URL,
  webOrigin: parsedEnv.WEB_ORIGIN,
  nodeEnv: parsedEnv.NODE_ENV,
};
