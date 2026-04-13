import "server-only";
import { z } from "zod";

const envSchema = z.object({
  DB_CONNECTION_STRING: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.string().url().optional(),
  VERCEL_URL: z.string().min(1).optional(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().min(1),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .optional()
    .default("development"),
  AI_PROVIDER: z.enum(["local", "external"]).optional().default("local"),
  AI_MODEL: z.string().optional().default("llama3.1:8b"),
  AI_API_KEY: z.string().optional(),
  AI_BASE_URL: z.string().optional(),
  NEXT_PUBLIC_MIXPANEL_TOKEN: z.string().optional(),
  LOG_LEVEL: z.string().optional(),
});

const parsedEnv = envSchema.parse(process.env);
const resolvedBetterAuthUrl = resolveBetterAuthBaseUrl(parsedEnv);

export const env = {
  nodeEnv: parsedEnv.NODE_ENV,
  ai: {
    apiKey: parsedEnv.AI_API_KEY,
    model: parsedEnv.AI_MODEL,
    provider: parsedEnv.AI_PROVIDER,
    baseUrl: parsedEnv.AI_BASE_URL,
  },
  db: {
    connectionString: parsedEnv.DB_CONNECTION_STRING,
  },
  auth: {
    secret: parsedEnv.BETTER_AUTH_SECRET,
    baseURL: resolvedBetterAuthUrl,
    google:
      parsedEnv.GOOGLE_CLIENT_ID && parsedEnv.GOOGLE_CLIENT_SECRET
        ? {
            clientId: parsedEnv.GOOGLE_CLIENT_ID,
            clientSecret: parsedEnv.GOOGLE_CLIENT_SECRET,
          }
        : undefined,
  },
  public: {
    mixpanelToken: parsedEnv.NEXT_PUBLIC_MIXPANEL_TOKEN,
    googleClientId:
      parsedEnv.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? parsedEnv.GOOGLE_CLIENT_ID,
  },
  logLevel: parsedEnv.LOG_LEVEL,
};

function resolveBetterAuthBaseUrl(parsedEnv: ParsedEnv): string {
  const fromBetterAuthUrl = parsedEnv.BETTER_AUTH_URL;
  if (fromBetterAuthUrl) return removeTrailingSlash(fromBetterAuthUrl);

  const vercelUrl = parsedEnv.VERCEL_URL;
  if (vercelUrl) return `https://${removeTrailingSlash(vercelUrl)}`;

  return "http://localhost:3000";
}

function removeTrailingSlash(value: string): string {
  return value.replace(/\/$/, "");
}

type ParsedEnv = z.infer<typeof envSchema>;
