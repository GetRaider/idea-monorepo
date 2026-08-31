import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { env } from "../env/env";

export const pool = new Pool({
  connectionString: env.db.connectionString,
  ssl: false,
});

export const db = drizzle(pool);
