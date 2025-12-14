import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const connectionString =
  process.env.DB_CONNECTION_STRING || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DB connection string is missing. Set 'DB_CONNECTION_STRING' or 'DATABASE_URL' environment variable.",
  );
}

// Validate connection string format
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

// Supabase requires SSL connections
export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  // Add connection timeout
  connectionTimeoutMillis: 10000,
});

// Log connection info in development (without password)
if (process.env.NODE_ENV === "development") {
  console.log(`[DB] Connecting to: ${hostname}`);
}

export const db = drizzle(pool);
