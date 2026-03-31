import { z } from "zod";

export const timeframeEnum = z.enum(["week", "month", "quarter", "all"]);

export const taskStatsSchema = z.object({
  tasksCreated: z.number(),
  tasksCompleted: z.number(),
  avgCompletionTimeDays: z.number(),
  overdueRate: z.number(),
});

export const GenerateAnalyticsDto = z.object({
  stats: taskStatsSchema,
  timeframe: timeframeEnum,
  shouldUseAI: z.boolean().optional(),
});

export const OptimizeTasksDto = z.object({
  taskIds: z.array(z.string()).min(1, "'taskIds' must be a non-empty array"),
});

export type Timeframe = z.infer<typeof timeframeEnum>;
export type GenerateAnalyticsInput = z.infer<typeof GenerateAnalyticsDto>;
export type TaskStatsInput = z.infer<typeof taskStatsSchema>;
export type OptimizeTasksInput = z.infer<typeof OptimizeTasksDto>;
