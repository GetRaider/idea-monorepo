import { describe, expect, it } from "vitest";

import { assertTodexAiConfig } from "../../../env/env";
import { webSearchCapability } from "./web-search-capability";

describe("webSearchCapability", () => {
  it("marks an unset gpt-5.5 OpenAI model as native", () => {
    expect(
      webSearchCapability({
        provider: "openai",
        model: "gpt-5.5",
        nativeSearchModels: "gpt-5.5",
      }),
    ).toBe("native");
  });

  it("marks an unset other OpenAI model as none", () => {
    expect(
      webSearchCapability({
        provider: "openai",
        model: "gpt-4.1",
        nativeSearchModels: "gpt-5.5",
      }),
    ).toBe("none");
  });

  it("marks unset Ollama as none even when SearXNG is configured", () => {
    expect(
      webSearchCapability({
        provider: "ollama",
        model: "qwen2.5:7b",
        nativeSearchModels: "gpt-5.5",
      }),
    ).toBe("none");
  });

  it("returns tool for Ollama when the operator selects it", () => {
    expect(
      webSearchCapability({
        provider: "ollama",
        webSearch: "tool",
        model: "qwen2.5:7b",
        nativeSearchModels: "gpt-5.5",
      }),
    ).toBe("tool");
  });

  it("fails boot when the search mode disagrees with the provider", () => {
    expect(() =>
      assertTodexAiConfig({
        AI_PROVIDER: "openai",
        AI_OPENAI_API_KEY: "sk-test",
        AI_WEB_SEARCH: "tool",
        SEARXNG_BASE_URL: "http://localhost:8080",
      }),
    ).toThrow(/AI_WEB_SEARCH=tool/);
    expect(() =>
      assertTodexAiConfig({
        AI_PROVIDER: "ollama",
        AI_WEB_SEARCH: "native",
      }),
    ).toThrow(/AI_WEB_SEARCH=native/);
  });
});
