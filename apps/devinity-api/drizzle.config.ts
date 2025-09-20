import type { Config } from "drizzle-kit";

import { env } from "./src/env/env";

export default {
  schema: ["./src/db/schema.ts", "./src/db/auth-schema.ts"],
  dialect: "postgresql",
  dbCredentials: { url: env.db.url },
  out: "./drizzle",
} satisfies Config;
