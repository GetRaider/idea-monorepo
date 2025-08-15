import type { Config } from 'drizzle-kit';

export default {
  schema: ['./src/db/schema.ts', './auth-schema.ts'],
  dialect: 'postgresql',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      'postgres://postgres:password@localhost:5432/devdb',
  },
  out: './drizzle',
} satisfies Config;
