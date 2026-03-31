import OpenAI from "openai";

import { env } from "@/env";
import { AI_CONFIG } from "@/constants/ai.constant";

class AIProvider {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor() {
    this.client = new OpenAI(AI_CONFIG);
    this.model = env.ai.model;
  }

  async complete(prompt: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;

    if (!content) throw new Error("AI returned an empty response");
    return content;
  }
}

let providerInstance: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (providerInstance) return providerInstance;
  providerInstance = new AIProvider();
  return providerInstance;
}
