import { OllamaProvider } from "./providers/ollama.provider";
import { OpenAIProvider } from "./providers/openai.provider";

export interface AIProvider {
  complete(prompt: string): Promise<string>;
}

export type AIProviderType = "local" | "openai";

let providerInstance: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (providerInstance) return providerInstance;

  const providerType = (process.env.AI_PROVIDER || "local") as AIProviderType;

  switch (providerType) {
    case "openai":
      providerInstance = new OpenAIProvider();
      break;
    case "local":
    default:
      providerInstance = new OllamaProvider();
      break;
  }

  return providerInstance;
}

export function resetAIProvider(): void {
  providerInstance = null;
}



