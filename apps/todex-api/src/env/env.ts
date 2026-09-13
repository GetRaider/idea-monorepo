import { resolve } from "path";

import { z } from "zod";
import { config } from "dotenv";

loadEnvFile();

const envSchema = z.object({
  WEB_BASE_URL: z.string().url(),
  API_BASE_URL: z.string().url(),
  PORT: z.string().optional().default("8091"),
  TODEX_AUTH_DISABLED: z.enum(["true", "false"]).optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  BETTER_AUTH_SECRET: z.string().min(1),
  DATABASE_URL: z.string().url(),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .optional()
    .default("development"),
});

const parsedEnv = envSchema.parse(process.env);
const authDisabled = isAuthDisabled(
  parsedEnv.TODEX_AUTH_DISABLED,
  parsedEnv.NODE_ENV,
);

if (!authDisabled) {
  if (!parsedEnv.GOOGLE_CLIENT_ID || !parsedEnv.GOOGLE_CLIENT_SECRET) {
    throw new Error(
      "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required when auth is on",
    );
  }
}

export const env = {
  nodeEnv: parsedEnv.NODE_ENV,
  web: {
    baseUrl: parsedEnv.WEB_BASE_URL,
  },
  api: {
    baseUrl: parsedEnv.API_BASE_URL,
  },
  port: parsedEnv.PORT,
  google: {
    clientId: parsedEnv.GOOGLE_CLIENT_ID ?? "",
    clientSecret: parsedEnv.GOOGLE_CLIENT_SECRET ?? "",
  },
  auth: {
    secret: parsedEnv.BETTER_AUTH_SECRET,
    disabled: authDisabled,
  },
  db: {
    connectionString: parsedEnv.DATABASE_URL,
  },
};

function isAuthDisabled(
  flag: "true" | "false" | undefined,
  nodeEnv: string,
): boolean {
  if (flag === "true") return true;
  if (flag === "false") return false;
  return nodeEnv !== "production";
}

function loadEnvFile(): void {
  const nodeEnv = process.env.NODE_ENV || "development";
  const envFileName =
    nodeEnv === "production" ? ".env.production" : ".env.local";
  const path = resolve(process.cwd(), envFileName);
  config({ path });
}
