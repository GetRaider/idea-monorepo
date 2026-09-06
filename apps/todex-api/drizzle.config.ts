import type { Config } from "drizzle-kit";

import { env } from "./src/env/env";

export default {
  schema: ["./src/db/auth-schema.ts", "./src/db/schema.ts"],
  dialect: "postgresql",
  dbCredentials: { url: env.db.connectionString },
  out: "./drizzle",
} satisfies Config;
