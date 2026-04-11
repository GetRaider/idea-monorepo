import { z } from "zod";

export const timeframeEnum = z.enum(["week", "month", "quarter", "all"]);

export const taskCompletionByDaySchema = z.object({
  date: z.string(),
  label: z.string(),
  created: z.number(),
  completed: z.number(),
});

export const avgCompletionTimeWeekSchema = z.object({
  weekLabel: z.string(),
  avgDays: z.number(),
});

export const completionRateByWeekdaySchema = z.object({
  weekday: z.string(),
  ratePercent: z.number(),
});

export const priorityBucketSchema = z.object({
  total: z.number(),
  unresolved: z.number(),
});

export const tasksByPrioritySchema = z.object({
  critical: priorityBucketSchema,
  high: priorityBucketSchema,
  medium: priorityBucketSchema,
  low: priorityBucketSchema,
});

export const taskStatsSchema = z.object({
  tasksCreated: z.number(),
  tasksCompleted: z.number(),
  avgCompletionTimeDays: z.number(),
  overdueRate: z.number(),
  completionRateWeekOverWeekDeltaPp: z.number(),
  overdueRateWeekOverWeekDeltaPp: z.number(),
  taskCompletionByDay: z.array(taskCompletionByDaySchema),
  avgCompletionTimeDaysByWeek: z.array(avgCompletionTimeWeekSchema),
  completionRateByWeekday: z.array(completionRateByWeekdaySchema),
  tasksByPriority: tasksByPrioritySchema,
});

export const GenerateAnalyticsDto = z.object({
  stats: taskStatsSchema,
  timeframe: timeframeEnum,
  shouldUseAI: z.boolean().optional(),
});

export const GetAnalyticsQueryDto = z.object({
  timeframe: timeframeEnum,
  stats: taskStatsSchema.optional(),
  shouldUseAI: z.boolean().optional(),
});

export const OptimizeTasksDto = z.object({
  taskIds: z.array(z.string()).min(1, "'taskIds' must be a non-empty array"),
});

export type Timeframe = z.infer<typeof timeframeEnum>;
export type GenerateAnalyticsInput = z.infer<typeof GenerateAnalyticsDto>;
export type TaskStatsInput = z.infer<typeof taskStatsSchema>;
export type OptimizeTasksInput = z.infer<typeof OptimizeTasksDto>;
