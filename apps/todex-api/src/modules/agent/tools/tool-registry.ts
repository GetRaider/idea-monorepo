import { Injectable } from "@nestjs/common";
import type { ZodType } from "zod";
import { toJSONSchema } from "zod";

import type { LlmToolDefinition } from "../llm/llm-client";
import type { ToolHandler } from "./tool-handler";

@Injectable()
export class ToolRegistry {
  private readonly handlers = new Map<string, ToolHandler>();

  register(handlers: ToolHandler[]): void {
    for (const handler of handlers) {
      this.handlers.set(handler.name, handler);
    }
  }

  get(name: string): ToolHandler | undefined {
    return this.handlers.get(name);
  }

  definitions(mode: "execute" | "ask" = "execute"): LlmToolDefinition[] {
    return [...this.handlers.values()]
      .filter((handler) => mode === "execute" || handler.access === "read")
      .map((handler) => ({
        name: handler.name,
        description: handler.description,
        parameters: handler.parametersJson ?? parametersJsonSchema(handler.parameters),
      }));
  }
}

function parametersJsonSchema(schema: ZodType): Record<string, unknown> {
  const json = toJSONSchema(schema) as Record<string, unknown>;
  delete json.$schema;
  return json;
}
