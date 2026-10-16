import { z } from "zod";
import { config } from "dotenv";
import { resolve } from "path";

loadEnvFile();

const envSchema = z.object({
  WEB_BASE_URL: z.string().url(),
  API_BASE_URL: z.string().url(),
  PORT: z.string().optional().default("8091"),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(1),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().min(1).optional().default("redis://localhost:6379"),
  AI_PROVIDER: z.enum(["local", "external"]).optional().default("local"),
  AI_MODEL: z.string().min(1).optional().default("llama3.1:8b"),
  AI_BASE_URL: z.string().url().optional(),
  AI_API_KEY: z.string().optional(),
  AGENT_MAX_ITERATIONS: z.coerce.number().int().positive().optional().default(8),
  AGENT_MAX_DURATION_MS: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .default(120_000),
  AGENT_MAX_TOKENS: z.coerce.number().int().positive().optional().default(8000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .optional()
    .default("development"),
});

const parsedEnv = envSchema.parse(process.env);

if (parsedEnv.AI_PROVIDER === "external" && !parsedEnv.AI_API_KEY) {
  throw new Error("AI_API_KEY is required when AI_PROVIDER is external");
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
    clientId: parsedEnv.GOOGLE_CLIENT_ID,
    clientSecret: parsedEnv.GOOGLE_CLIENT_SECRET,
  },
  auth: {
    secret: parsedEnv.BETTER_AUTH_SECRET,
  },
  db: {
    connectionString: parsedEnv.DATABASE_URL,
  },
  redis: {
    url: parsedEnv.REDIS_URL,
  },
  ai: {
    provider: parsedEnv.AI_PROVIDER,
    model: parsedEnv.AI_MODEL,
    baseUrl: resolveAiBaseUrl(parsedEnv),
    apiKey: parsedEnv.AI_API_KEY,
  },
  agent: {
    maxIterations: parsedEnv.AGENT_MAX_ITERATIONS,
    maxDurationMs: parsedEnv.AGENT_MAX_DURATION_MS,
    maxTokens: parsedEnv.AGENT_MAX_TOKENS,
  },
};

function resolveAiBaseUrl(parsed: z.infer<typeof envSchema>): string | undefined {
  if (parsed.AI_BASE_URL) return parsed.AI_BASE_URL;
  if (parsed.AI_PROVIDER === "local") return "http://localhost:11434/v1";
  return undefined;
}

function loadEnvFile(): void {
  const nodeEnv = process.env.NODE_ENV || "development";
  const envFileName =
    nodeEnv === "production" ? ".env.production" : ".env.local";
  const path = resolve(process.cwd(), envFileName);
  config({ path });
}
