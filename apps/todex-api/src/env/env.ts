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
  AI_MODEL: z.string().min(1).optional().default("llama3.1:8b"),
  AI_EMBEDDING_MODEL: z.string().min(1).optional().default("nomic-embed-text"),
  AI_BASE_URL: z.string().url().optional(),
  AI_PROVIDER: z.enum(["ollama", "openai"]).optional().default("ollama"),
  AI_OPENAI_API_KEY: z.string().optional(),
  AI_WEB_SEARCH: z.enum(["native", "tool", "none"]).optional(),
  AI_NATIVE_SEARCH_MODELS: z.string().optional().default("gpt-5.5"),
  AI_PRICE_JSON: z.string().optional(),
  AI_USER_DAILY_USD: z.coerce.number().nonnegative().optional().default(2),
  AI_WORKSPACE_DAILY_USD: z.coerce.number().nonnegative().optional().default(5),
  SEARXNG_BASE_URL: z.string().url().optional(),
  SEARXNG_TIMEOUT_MS: z.coerce.number().int().positive().optional().default(8000),
  SEARXNG_MAX_RESULTS: z.coerce.number().int().positive().optional().default(5),
  SEARXNG_MAX_SNIPPET_CHARS: z.coerce.number().int().positive().optional().default(500),
  SEARXNG_MAX_QUERY_CHARS: z.coerce.number().int().positive().optional().default(400),
  AGENT_MAX_WEB_SEARCH_CALLS: z.coerce.number().int().positive().optional().default(3),
  MCP_SERVER_URL: z.string().url().optional(),
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
assertTodexAiConfig(parsedEnv);

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
    model: parsedEnv.AI_MODEL,
    embeddingModel: parsedEnv.AI_EMBEDDING_MODEL,
    baseUrl: resolveAiBaseUrl(parsedEnv),
    provider: parsedEnv.AI_PROVIDER,
    openaiApiKey: parsedEnv.AI_OPENAI_API_KEY ?? "",
    webSearch: parsedEnv.AI_WEB_SEARCH,
    nativeSearchModels: parsedEnv.AI_NATIVE_SEARCH_MODELS,
    priceJson: parsedEnv.AI_PRICE_JSON,
    userDailyUsd: parsedEnv.AI_USER_DAILY_USD,
    workspaceDailyUsd: parsedEnv.AI_WORKSPACE_DAILY_USD,
    searxngBaseUrl: parsedEnv.SEARXNG_BASE_URL,
    searxngTimeoutMs: parsedEnv.SEARXNG_TIMEOUT_MS,
    searxngMaxResults: parsedEnv.SEARXNG_MAX_RESULTS,
    searxngMaxSnippetChars: parsedEnv.SEARXNG_MAX_SNIPPET_CHARS,
    searxngMaxQueryChars: parsedEnv.SEARXNG_MAX_QUERY_CHARS,
    maxWebSearchCalls: parsedEnv.AGENT_MAX_WEB_SEARCH_CALLS,
    mcpServerUrl: parsedEnv.MCP_SERVER_URL,
  },
  agent: {
    maxIterations: parsedEnv.AGENT_MAX_ITERATIONS,
    maxDurationMs: parsedEnv.AGENT_MAX_DURATION_MS,
    maxTokens: parsedEnv.AGENT_MAX_TOKENS,
  },
};

function resolveAiBaseUrl(parsed: z.infer<typeof envSchema>): string {
  return parsed.AI_BASE_URL ?? "http://localhost:11434/v1";
}

export function assertTodexAiConfig(parsed: {
  AI_PROVIDER: "ollama" | "openai";
  AI_OPENAI_API_KEY?: string;
  AI_WEB_SEARCH?: "native" | "tool" | "none";
  SEARXNG_BASE_URL?: string;
}): void {
  if (parsed.AI_PROVIDER === "openai" && !parsed.AI_OPENAI_API_KEY?.trim()) {
    throw new Error("AI_OPENAI_API_KEY is required when AI_PROVIDER=openai");
  }
  if (parsed.AI_WEB_SEARCH === "native" && parsed.AI_PROVIDER !== "openai") {
    throw new Error("AI_WEB_SEARCH=native requires AI_PROVIDER=openai");
  }
  if (parsed.AI_WEB_SEARCH === "tool" && parsed.AI_PROVIDER !== "ollama") {
    throw new Error("AI_WEB_SEARCH=tool requires AI_PROVIDER=ollama");
  }
  if (parsed.AI_WEB_SEARCH === "tool" && !parsed.SEARXNG_BASE_URL) {
    throw new Error("SEARXNG_BASE_URL is required when AI_WEB_SEARCH=tool");
  }
}

function loadEnvFile(): void {
  const nodeEnv = process.env.NODE_ENV || "development";
  const envFileName =
    nodeEnv === "production" ? ".env.production" : ".env.local";
  const path = resolve(process.cwd(), envFileName);
  config({ path });
}
