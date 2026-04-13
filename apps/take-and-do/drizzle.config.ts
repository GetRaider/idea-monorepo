import type { Config } from "drizzle-kit";

import { envServer } from "./src/env";

export default {
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: { url: envServer.db.connectionString },
  out: "./drizzle",
} satisfies Config;
