import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { env } from "@/env";

const { connectionString } = env.db;

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
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

if (env.nodeEnv === "development") {
  console.log(`[DB] Connecting to: ${hostname}`);
}

export const db = drizzle(pool);
