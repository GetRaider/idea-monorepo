import { z } from "zod";
import { config } from "dotenv";
import { resolve } from "path";
import { existsSync } from "fs";

// Load environment variables based on NODE_ENV
const nodeEnv = process.env.NODE_ENV || "development";
const envFileName = nodeEnv === "production" ? ".env.production" : ".env.local";
const rootDir = process.cwd();
const envPath = resolve(rootDir, envFileName);

// Load the appropriate .env file
config({ path: envPath });

let parsedEnv: any;

if (nodeEnv === "production") {
  // Production: skip Zod validation, use process.env directly
  parsedEnv = process.env;
} else {
  // Development: use Zod validation
  const envSchema = z.object({
    WEB_BASE_URL: z.url(),
    PORT: z.string().optional().default("8090"),
    GITHUB_CLIENT_ID: z.string(),
    GITHUB_CLIENT_SECRET: z.string(),
    GITHUB_TOKEN: z.string(),
    BETTER_AUTH_SECRET: z.string(),
    DEV_DB_URL: z.url(),
    LOCAL_DB_URL: z.url().optional(),
  });

  parsedEnv = envSchema.parse(process.env);
}

console.log({ parsedEnv });

export const env = {
  web: {
    baseUrl: parsedEnv.WEB_BASE_URL,
  },
  port: parsedEnv.PORT,
  github: {
    clientId: parsedEnv.GITHUB_CLIENT_ID,
    clientSecret: parsedEnv.GITHUB_CLIENT_SECRET,
    token: parsedEnv.GITHUB_TOKEN,
  },
  auth: {
    secret: parsedEnv.BETTER_AUTH_SECRET,
  },
  db: {
    dev_url: parsedEnv.DEV_DB_URL,
    local_url: parsedEnv.LOCAL_DB_URL,
  },
};
