import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { envServer } from "@/env";

import {
  asc,
  desc,
  eq,
  and,
  or,
  isNull,
  isNotNull,
  inArray,
  gte,
  lte,
  lt,
  gt,
  like,
} from "drizzle-orm";

export {
  asc,
  desc,
  eq,
  and,
  or,
  isNull,
  isNotNull,
  inArray,
  gte,
  lte,
  lt,
  gt,
  like,
};

const connectionString = envServer.db.connectionString;

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

if (envServer.nodeEnv === "development") {
  console.log(`[DB] Connecting to: ${getHostName(connectionString)}`);
}

function getHostName(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    const hostname = url.hostname;
    if (!hostname) {
      throw new Error("Missing hostname in connection string.");
    }
    return hostname;
  } catch (error) {
    throw new Error(
      `Invalid DB_CONNECTION_STRING for drizzle/pool: ${
        error instanceof Error ? error.message : "unknown"
      }`,
    );
  }
}

export const db = drizzle(pool);

export type DB = typeof db;

