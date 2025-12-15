import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const connectionString =
  process.env.DB_CONNECTION_STRING || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DB connection string is missing. Set 'DB_CONNECTION_STRING' or 'DATABASE_URL' environment variable.",
  );
}

let hostname: string;
try {
  const url = new URL(connectionString);
  hostname = url.hostname;
  if (!hostname) {
    throw new Error("Invalid connection string: missing hostname");
  }
} catch (error) {
  throw new Error(
    `Invalid connection string format: ${error instanceof Error ? error.message : "unknown error"}`,
  );
}

export const pool = new Pool({
  connectionString,
  // TODO: Enable SSL once auth is implemented
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

if (process.env.NODE_ENV === "development") {
  console.log(`[DB] Connecting to: ${hostname}`);
}

export const db = drizzle(pool);
