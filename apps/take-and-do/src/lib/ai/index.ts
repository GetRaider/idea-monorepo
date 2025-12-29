import { getAIProvider } from "./provider";
import {
  buildDecomposePrompt,
  buildAnalyticsPrompt,
  buildComposePrompt,
} from "./prompts";
import {
  DecomposeTaskInputSchema,
  DecomposeTaskOutputSchema,
  AnalyticsInputSchema,
  AnalyticsOutputSchema,
  ComposeTaskInputSchema,
  ComposeTaskOutputSchema,
} from "./schemas";

import type {
  DecomposeTaskInput,
  DecomposeTaskOutput,
  AnalyticsInput,
  AnalyticsOutput,
  ComposeTaskInput,
  ComposeTaskOutput,
} from "./schemas";

export type {
  DecomposeTaskInput,
  DecomposeTaskOutput,
  DecomposedTask,
  AnalyticsInput,
  AnalyticsOutput,
  AnalyticsStats,
  ComposeTaskInput,
  ComposeTaskOutput,
} from "./schemas";

function parseJSON(content: string): unknown {
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

export async function decomposeTask(
  input: DecomposeTaskInput,
): Promise<DecomposeTaskOutput> {
  // Validate input
  const validatedInput = DecomposeTaskInputSchema.parse(input);

  // Build prompt
  const prompt = buildDecomposePrompt(validatedInput);

  // Call AI provider
  const provider = getAIProvider();
  const response = await provider.complete(prompt);

  // Parse and validate output
  const parsed = parseJSON(response);
  const result = DecomposeTaskOutputSchema.safeParse(parsed);

  if (!result.success) {
    const errors = result.error.errors
      .map(
        (e: { path: (string | number)[]; message: string }) =>
          `${e.path.join(".")}: ${e.message}`,
      )
      .join(", ");
    throw new Error(`AI response failed validation: ${errors}`);
  }

  return result.data;
}

export async function generateAnalytics(
  input: AnalyticsInput,
): Promise<AnalyticsOutput> {
  // Validate input
  const validatedInput = AnalyticsInputSchema.parse(input);

  // Build prompt
  const prompt = buildAnalyticsPrompt(validatedInput);

  // Call AI provider
  const provider = getAIProvider();
  const response = await provider.complete(prompt);

  // Parse and validate output
  const parsed = parseJSON(response);
  const result = AnalyticsOutputSchema.safeParse(parsed);

  if (!result.success) {
    const errors = result.error.errors
      .map(
        (e: { path: (string | number)[]; message: string }) =>
          `${e.path.join(".")}: ${e.message}`,
      )
      .join(", ");
    throw new Error(`AI response failed validation: ${errors}`);
  }

  return result.data;
}

export async function composeTask(
  input: ComposeTaskInput,
): Promise<ComposeTaskOutput> {
  const validatedInput = ComposeTaskInputSchema.parse(input);
  const prompt = buildComposePrompt(validatedInput);
  const provider = getAIProvider();
  const response = await provider.complete(prompt);
  const parsed = parseJSON(response);
  const result = ComposeTaskOutputSchema.safeParse(parsed);

  if (!result.success) {
    const errors = result.error.errors
      .map(
        (e: { path: (string | number)[]; message: string }) =>
          `${e.path.join(".")}: ${e.message}`,
      )
      .join(", ");
    throw new Error(`AI response failed validation: ${errors}`);
  }

  return result.data;
}
