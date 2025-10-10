import { z } from "zod";
import { config } from "dotenv";
import { resolve } from "path";

loadEnvFile();

const envSchema = z.object({
  WEB_BASE_URL: z.url(),
  API_BASE_URL: z.url(),
  PORT: z.string().optional().default("8090"),
  GITHUB_CLIENT_ID: z.string(),
  GITHUB_CLIENT_SECRET: z.string(),
  GITHUB_TOKEN: z.string(),
  BETTER_AUTH_SECRET: z.string(),
  DB_CONNECTION_STRING: z.url(),
  REDIS_HOST: z.string().optional().default("localhost"),
  REDIS_PORT: z.string().optional().default("6379"),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().optional().default("0"),
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
  web: {
    baseUrl: parsedEnv.WEB_BASE_URL,
  },
  api: {
    baseUrl: parsedEnv.API_BASE_URL,
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
    connectionString: parsedEnv.DB_CONNECTION_STRING,
  },
  redis: {
    host: parsedEnv.REDIS_HOST,
    port: parseInt(parsedEnv.REDIS_PORT, 10),
    password: parsedEnv.REDIS_PASSWORD,
    db: parseInt(parsedEnv.REDIS_DB, 10),
  },
};

function loadEnvFile(): void {
  let path: string | null = null;
  const nodeEnv = process.env.NODE_ENV || "development";
  const envFileName =
    nodeEnv === "production" ? ".env.production" : ".env.local";

  if (nodeEnv === "production") {
    // loads .env.production from root directory because it sets there on deployments
    const isInAppsDir = process.cwd().includes("/apps/devinity-api");
    const rootDir = isInAppsDir
      ? resolve(process.cwd(), "../../")
      : process.cwd();
    path = resolve(rootDir, envFileName);
  } else {
    // loads .env.local from current directory
    path = resolve(process.cwd(), envFileName);
  }

  config({ path });
}
