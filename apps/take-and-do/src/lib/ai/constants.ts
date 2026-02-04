import { env } from "@/env";

export const IS_LOCAL_AI = env.ai.provider === "local";

export const AI_CONFIG = {
  apiKey: env.ai.apiKey,
  ...(IS_LOCAL_AI && { baseURL: env.ai.baseUrl }),
};
