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
  DB_CONNECTION_STRING: z
    .string()
    .min(1, "Set DB_CONNECTION_STRING or DATABASE_URL"),
  LOG_LEVEL: z.string().optional(),
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
  nodeEnv: parsedEnv.NODE_ENV,
  ai: {
    apiKey: parsedEnv.AI_API_KEY,
    model: parsedEnv.AI_MODEL,
    provider: parsedEnv.AI_PROVIDER,
    baseUrl: parsedEnv.AI_BASE_URL,
  },
  db: { connectionString: parsedEnv.DB_CONNECTION_STRING },
  logLevel: parsedEnv.LOG_LEVEL,
};
