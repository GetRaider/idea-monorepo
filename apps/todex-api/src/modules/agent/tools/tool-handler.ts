import type { ZodType } from "zod";

import type { MessageCitation } from "../../../db/schema";

export interface ToolHandler {
  readonly name: string;
  readonly description: string;
  readonly access: ToolAccess;
  readonly parameters: ZodType;
  readonly parametersJson?: Record<string, unknown>;
  handle(input: ToolHandlerInput): Promise<unknown>;
}

export type ToolAccess = "read" | "write";

export interface ToolHandlerInput {
  workspaceId: string;
  userId: string;
  args: unknown;
  sources?: MessageCitation[];
}
