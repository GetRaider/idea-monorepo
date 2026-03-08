import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { env } from "@/env";

const { connectionString } = env.db;

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

if (env.nodeEnv === "development") {
  console.log(`[DB] Connecting to: ${getHostName(connectionString)}`);
}

function getHostName(connectionString: string): string {
  let hostname = "";
  try {
    const url = new URL(connectionString);
    hostname = url.hostname;
    if (!hostname) {
      throw new Error("Invalid connection string: missing hostname");
    }
    return hostname;
  } catch (error) {
    throw new Error(
      `Invalid connection string format: ${error instanceof Error ? error.message : "unknown error"}`,
    );
  }
}

export const db = drizzle(pool);
