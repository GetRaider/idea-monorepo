import { AnalyticsAIService } from "./analytics.ai.service";
import { ScheduleAIService } from "./schedule.ai.service";
import { TaskAIService } from "./tasks.ai.service";
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
  buildAnalytics: buildAnalyticsPrompt,
  buildOptimizeSchedulePrompt,
};

export const aiServices = {
  task: new TaskAIService(),
  schedule: new ScheduleAIService(),
  analytics: new AnalyticsAIService(),
};
