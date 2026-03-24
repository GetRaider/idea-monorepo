import "dotenv/config";
import type { Config } from "drizzle-kit";

if (!process.env.DB_CONNECTION_STRING) {
  throw new Error("Set DB_CONNECTION_STRING for Drizzle");
}

export default {
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DB_CONNECTION_STRING },
  out: "./drizzle",
} satisfies Config;
