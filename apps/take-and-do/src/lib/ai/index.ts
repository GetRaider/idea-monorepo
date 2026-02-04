import {
  buildAnalyticsPrompt,
  buildComposeTaskPrompt,
  buildDecomposeTaskPrompt,
  buildOptimizeSchedulePrompt,
} from "./prompts";

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

export const aiPrompts = {
  buildComposeTaskPrompt,
  buildDecomposeTaskPrompt,
  buildAnalyticsPrompt,
  buildOptimizeSchedulePrompt,
};
