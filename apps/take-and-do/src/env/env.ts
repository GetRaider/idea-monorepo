import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .optional()
    .default("development"),
  AI_PROVIDER: z.enum(["local", "external"]).optional().default("local"),
  AI_MODEL: z.string().optional().default("llama3.1:8b"),
  AI_API_KEY: z.string().optional(),
  AI_BASE_URL: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  DB_CONNECTION_STRING: z.string().optional(),
  BETTER_AUTH_SECRET: z.string().min(1).optional(),
  BETTER_AUTH_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().optional(),
  NEXT_PUBLIC_MIXPANEL_TOKEN: z.string().optional(),
  LOG_LEVEL: z.string().optional(),
});

const parsedEnv = envSchema.parse(process.env);

const databaseUrl =
  parsedEnv.DATABASE_URL ?? parsedEnv.DB_CONNECTION_STRING ?? "";
const directUrl = parsedEnv.DIRECT_URL ?? databaseUrl;

if (!databaseUrl) {
  throw new Error("Set DATABASE_URL or DB_CONNECTION_STRING");
}

export const env = {
  nodeEnv: parsedEnv.NODE_ENV,
  ai: {
    apiKey: parsedEnv.AI_API_KEY,
    model: parsedEnv.AI_MODEL,
    provider: parsedEnv.AI_PROVIDER,
    baseUrl: parsedEnv.AI_BASE_URL,
  },
  db: {
    connectionString: databaseUrl,
    directUrl,
  },
  auth: {
    secret: parsedEnv.BETTER_AUTH_SECRET,
    baseURL:
      parsedEnv.BETTER_AUTH_URL ??
      parsedEnv.NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000",
    google:
      parsedEnv.GOOGLE_CLIENT_ID && parsedEnv.GOOGLE_CLIENT_SECRET
        ? {
            clientId: parsedEnv.GOOGLE_CLIENT_ID,
            clientSecret: parsedEnv.GOOGLE_CLIENT_SECRET,
          }
        : undefined,
  },
  public: {
    appUrl: parsedEnv.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    mixpanelToken: parsedEnv.NEXT_PUBLIC_MIXPANEL_TOKEN,
    googleClientId:
      parsedEnv.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? parsedEnv.GOOGLE_CLIENT_ID,
  },
  logLevel: parsedEnv.LOG_LEVEL,
};
