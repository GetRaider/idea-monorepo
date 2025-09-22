import { z } from "zod";
import { config } from "dotenv";
import { resolve } from "path";
import { existsSync } from "fs";

// Load environment variables based on NODE_ENV
const nodeEnv = process.env.NODE_ENV || "development";
const envFileName = nodeEnv === "production" ? ".env.production" : ".env.local";

let envPath: string;
if (nodeEnv === "production") {
  // Production: load .env.production from root directory (monorepo root)
  const isInAppsDir = process.cwd().includes("/apps/devinity-api");
  const rootDir = isInAppsDir
    ? resolve(process.cwd(), "../../")
    : process.cwd();
  envPath = resolve(rootDir, envFileName);
} else {
  // Development: load .env.local from current directory
  envPath = resolve(process.cwd(), envFileName);
}

// Debug information for CI/deployment
console.log("🔧 Environment Debug Info:");
console.log(`  NODE_ENV: ${nodeEnv}`);
console.log(`  ENV_FILE: ${envFileName}`);
console.log(`  PWD: ${process.cwd()}`);
console.log(`  ENV_PATH: ${envPath}`);
console.log(`  ENV_FILE_EXISTS: ${existsSync(envPath) ? "✅" : "❌"}`);

// Load the appropriate .env file
const dotenvResult = config({ path: envPath });
console.log(
  `  DOTENV_RESULT: ${dotenvResult.error ? `❌ ${dotenvResult.error.message}` : "✅ Success"}`,
);
console.log(
  `  DOTENV_PARSED_KEYS: ${Object.keys(dotenvResult.parsed || {}).join(", ") || "None"}`,
);

// Check specific environment variables (without exposing values)
const requiredEnvVars = [
  "WEB_BASE_URL",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "GITHUB_TOKEN",
  "BETTER_AUTH_SECRET",
  "DEV_DB_URL",
];
console.log("🔑 Environment Variables Status:");
requiredEnvVars.forEach((varName) => {
  const exists = !!process.env[varName];
  const length = process.env[varName]?.length || 0;
  console.log(
    `  ${varName}: ${exists ? "✅" : "❌"} ${exists ? `(${length} chars)` : ""}`,
  );
});

// Define the schema for all environments
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

// Parse and validate environment variables for all environments
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

console.log("🎉 Environment configuration loaded successfully!");
