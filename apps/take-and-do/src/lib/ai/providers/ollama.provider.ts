import OpenAI from "openai";

import { AIProvider } from "../provider";

const OLLAMA_BASE_URL = "http://localhost:11434/v1";
const DEFAULT_MODEL = "llama3.1:8b";

export class OllamaProvider implements AIProvider {
  private client: OpenAI;
  private model: string;

  constructor() {
    this.client = new OpenAI({
      baseURL: OLLAMA_BASE_URL,
      apiKey: "ollama", // Ollama doesn't require a real API key
    });
    this.model = process.env.OLLAMA_MODEL || DEFAULT_MODEL;
  }

  async complete(prompt: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Ollama returned an empty response");
    }

    return content;
  }
}



