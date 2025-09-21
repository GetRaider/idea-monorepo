import { z } from "zod";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables based on NODE_ENV
const nodeEnv = process.env.NODE_ENV || "development";
const envFileName = nodeEnv === "production" ? ".env.production" : ".env.local";

let envPath: string;

if (nodeEnv === "production") {
  // Production: look for .env in root directory
  const isInAppsDir = process.cwd().includes("/apps/devinity-api");
  const rootDir = isInAppsDir
    ? resolve(process.cwd(), "../../")
    : process.cwd();
  envPath = resolve(rootDir, envFileName);
} else {
  envPath = resolve(process.cwd(), envFileName);
}

// Load the appropriate .env file
config({ path: envPath });

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

const parsedEnv = envSchema.parse(process.env);

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
