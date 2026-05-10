import type { Config } from "drizzle-kit";
import "dotenv/config";

export default {
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DB_CONNECTION_STRING ??
      (() => {
        throw new Error("Missing DB_CONNECTION_STRING for drizzle-kit.");
      })(),
  },
  out: "./drizzle",
} satisfies Config;
