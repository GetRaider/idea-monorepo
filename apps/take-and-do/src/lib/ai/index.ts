import { getAIProvider } from "./provider";
import {
  buildDecomposePrompt,
  buildAnalyticsPrompt,
  buildComposePrompt,
  buildOptimizeSchedulePrompt,
} from "./prompts";
import {
  DecomposeTaskInputSchema,
  DecomposeTaskOutputSchema,
  AnalyticsInputSchema,
  AnalyticsOutputSchema,
  ComposeTaskInputSchema,
  ComposeTaskOutputSchema,
  OptimizeScheduleInputSchema,
  OptimizeScheduleOutputSchema,
} from "./schemas";

import type {
  DecomposeTaskInput,
  DecomposeTaskOutput,
  AnalyticsInput,
  AnalyticsOutput,
  ComposeTaskInput,
  ComposeTaskOutput,
  OptimizeScheduleInput,
  OptimizeScheduleOutput,
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
  OptimizeScheduleInput,
  OptimizeScheduleOutput,
  OptimizeScheduleTask,
  ScheduleRecommendation,
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
  const validatedInput = AnalyticsInputSchema.parse(input);
  const prompt = buildAnalyticsPrompt(validatedInput);
  const provider = getAIProvider();
  const response = await provider.complete(prompt);
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

function removeNullValues(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

export async function composeTask(
  input: ComposeTaskInput,
): Promise<ComposeTaskOutput> {
  const validatedInput = ComposeTaskInputSchema.parse(input);
  const prompt = buildComposePrompt(validatedInput);
  const provider = getAIProvider();
  const response = await provider.complete(prompt);
  const parsed = parseJSON(response);
  const cleaned = removeNullValues(parsed as Record<string, unknown>);
  const result = ComposeTaskOutputSchema.safeParse(cleaned);

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

export async function optimizeSchedule(
  input: OptimizeScheduleInput,
): Promise<OptimizeScheduleOutput> {
  const validatedInput = OptimizeScheduleInputSchema.parse(input);
  const prompt = buildOptimizeSchedulePrompt(validatedInput);
  const provider = getAIProvider();
  const response = await provider.complete(prompt);
  const parsed = parseJSON(response);
  const result = OptimizeScheduleOutputSchema.safeParse(parsed);

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
