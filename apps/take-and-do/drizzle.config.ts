import type { Config } from "drizzle-kit";

const connectionString = process.env.DB_CONNECTION_STRING;

if (!connectionString) {
  throw new Error(
    "Database connection string is missing. Set 'DB_CONNECTION_STRING' or 'DATABASE_URL' environment variable in .env.local",
  );
}

export default {
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: { url: connectionString },
  out: "./drizzle",
} satisfies Config;
