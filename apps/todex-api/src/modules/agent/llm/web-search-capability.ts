import type { WebSearchCapability } from "../../../db/schema";

export function webSearchCapability(input: WebSearchCapabilityInput): WebSearchCapability {
  if (input.webSearch === "none") return "none";
  if (input.webSearch === "native") return "native";
  if (input.webSearch === "tool") return "tool";
  if (input.provider === "openai") {
    const allowed = input.nativeSearchModels
      .split(",")
      .map((model) => model.trim())
      .filter((model) => model.length > 0);
    return allowed.includes(input.model) ? "native" : "none";
  }
  return "none";
}

export interface WebSearchCapabilityInput {
  provider: "ollama" | "openai";
  webSearch?: "native" | "tool" | "none";
  model: string;
  nativeSearchModels: string;
}
