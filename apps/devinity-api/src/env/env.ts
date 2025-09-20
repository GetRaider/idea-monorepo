import { z } from "zod";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables based on NODE_ENV
const nodeEnv = process.env.NODE_ENV || "development";
const envFile = nodeEnv === "production" ? ".env.production" : ".env.local";

// Load the appropriate .env file
config({ path: resolve(process.cwd(), envFile) });

const envSchema = z.object({
  //   NODE_ENV: z.enum(["development", "test", "production"]),
  WEB_BASE_URL: z.url(),
  PORT: z.string().optional().default("8090"),
  GITHUB_CLIENT_ID: z.string(),
  GITHUB_CLIENT_SECRET: z.string(),
  GITHUB_TOKEN: z.string(),
  BETTER_AUTH_SECRET: z.string(),
  DB_URL: z.url(),
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
    url: parsedEnv.DB_URL,
  },
};
