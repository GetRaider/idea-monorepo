import type { Config } from "drizzle-kit";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// Load .env.local if it exists
const envLocalPath = resolve(process.cwd(), ".env.local");
if (existsSync(envLocalPath)) {
  const envContent = readFileSync(envLocalPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const connectionString =
  process.env.DB_CONNECTION_STRING || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "Database connection string is missing. Set 'DB_CONNECTION_STRING' or 'DATABASE_URL' environment variable in .env.local",
  );
}

export default {
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: { url: connectionString },
  out: "./drizzle",
} satisfies Config;
