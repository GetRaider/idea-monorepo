import { z } from "zod";

import { primitiveHelper } from "@repo/shared";
import { getAIProvider } from "./provider";

type AIError = { path: (string | number)[]; message: string };
type AIResult<OutputSchema extends z.ZodTypeAny> = z.SafeParseSuccess<
  z.output<OutputSchema>
>;
type ParsePromptResult<OutputSchema extends z.ZodTypeAny> =
  z.SafeParseReturnType<unknown, z.output<OutputSchema>>;

export class BaseAIService {
  protected readonly aiProvider = getAIProvider();

  constructor() {}

  async processPrompt<OutputSchema extends z.ZodTypeAny>(
    prompt: string,
    outputSchema: OutputSchema,
  ): Promise<AIResult<OutputSchema>> {
    const result = await this.parsePrompt(prompt, outputSchema);
    this.validateResult(result);
    return result;
  }

  protected validateInput<InputSchema extends z.ZodTypeAny>(
    input: unknown,
    inputSchema: InputSchema,
  ): z.output<InputSchema> {
    try {
      return inputSchema.parse(input);
    } catch (error) {
      throw new Error(`Failed on AI input validation: ${error}`);
    }
  }

  private async parsePrompt<OutputSchema extends z.ZodTypeAny>(
    prompt: string,
    outputSchema: OutputSchema,
  ): Promise<ParsePromptResult<OutputSchema>> {
    try {
      const response = await this.aiProvider.complete(prompt);
      const parsedResponse = this.parseJSON(response);
      const cleanedResponse = primitiveHelper.removeNullValues(
        parsedResponse as Record<string, unknown>,
      );
      return outputSchema.safeParse(cleanedResponse);
    } catch (error) {
      throw new Error(`Failed to parse AI response: ${error}`);
    }
  }

  private validateResult<T>(
    result: z.SafeParseReturnType<unknown, T>,
  ): asserts result is z.SafeParseSuccess<T> {
    if (result.success) return;

    const errors = result.error.errors
      .map((error: AIError) => `${error.path.join(".")}: ${error.message}`)
      .join(", ");
    throw new Error(`AI response failed validation: ${errors}`);
  }

  private parseJSON(content: string): unknown {
    // Handle potential markdown code blocks from AI
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    const cleanContent = jsonMatch ? jsonMatch[1].trim() : content.trim();

    try {
      return JSON.parse(cleanContent);
    } catch {
      throw new Error(
        `Failed to parse AI response as JSON: ${cleanContent.slice(0, 200)}`,
      );
    }
  }
}
