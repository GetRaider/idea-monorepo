import type { Config } from "drizzle-kit";

const connectionString = process.env.DB_CONNECTION_STRING;

if (!connectionString) {
  throw new Error("'DB_CONNECTION_STRING' var is missing");
}

export default {
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: { url: connectionString },
  out: "./drizzle",
} satisfies Config;
