import type { ZodType } from "zod";

export interface ToolHandler {
  readonly name: string;
  readonly description: string;
  readonly parameters: ZodType;
  handle(input: ToolHandlerInput): Promise<unknown>;
}

export interface ToolHandlerInput {
  workspaceId: string;
  userId: string;
  args: unknown;
}
