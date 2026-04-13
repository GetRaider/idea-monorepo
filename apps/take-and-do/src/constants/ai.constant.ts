import { envServer } from "@/env";

export const IS_LOCAL_AI = envServer.ai.provider === "local";

export const AI_CONFIG = {
  apiKey: envServer.ai.apiKey,
  ...(IS_LOCAL_AI ? { baseURL: envServer.ai.baseUrl } : {}),
};
