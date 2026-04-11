import { z } from "zod";

import { taskStatsSchema } from "@/db/dtos/analytics.dto";

const TaskPrioritySchema = z.enum(["low", "medium", "high", "critical"]);

// ============================================
// Task Decomposition Schemas
// ============================================

export const DecomposeTaskInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

export const DecomposedTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  priority: TaskPrioritySchema,
});

export const DecomposeTaskOutputSchema = z.object({
  tasks: z
    .array(DecomposedTaskSchema)
    .min(1, "At least one task is required")
    .max(7, "Maximum 7 subtasks allowed"),
});

// ============================================
// Analytics Summary Schemas
// ============================================

export const AnalyticsStatsSchema = taskStatsSchema;

export const AnalyticsInputSchema = z.object({
  stats: AnalyticsStatsSchema,
  timeframe: z.enum(["week", "month", "quarter", "all"]),
});

export const AnalyticsOutputSchema = z.object({
  summary: z.string().min(1),
  insights: z.array(z.string()).min(1),
  risks: z.array(z.string()),
  recommendations: z.array(z.string()).min(1),
});

// ============================================
// Type Exports
// ============================================

export type DecomposeTaskInput = z.infer<typeof DecomposeTaskInputSchema>;
export type DecomposedTask = z.infer<typeof DecomposedTaskSchema>;
export type DecomposeTaskOutput = z.infer<typeof DecomposeTaskOutputSchema>;

export type AnalyticsStats = z.infer<typeof AnalyticsStatsSchema>;

/** @deprecated Prefer AnalyticsStats — alias retained for dashboard wording */
export type DashboardMetrics = AnalyticsStats;
export type AnalyticsInput = z.infer<typeof AnalyticsInputSchema>;
export type AnalyticsOutput = z.infer<typeof AnalyticsOutputSchema>;

// ============================================
// Task Composition Schemas
// ============================================

export const ComposeTaskInputSchema = z.object({
  text: z.string().min(1, "Text is required"),
});

const TaskStatusSchema = z.enum(["To Do", "In Progress", "Done"]);

export const ComposeTaskOutputSchema = z.object({
  id: z.string().nullish(),
  taskBoardId: z.string().nullish(),
  taskKey: z.string().nullish(),
  summary: z.string().min(1),
  description: z.string().min(1),
  status: TaskStatusSchema.nullish(),
  priority: TaskPrioritySchema,
  labels: z.array(z.string()).nullish(),
  dueDate: z.string().nullish(),
  estimation: z.number().positive().nullish(),
  subtasks: z.array(z.any()).nullish(),
  scheduleDate: z.string().nullish(),
});

export type ComposeTaskInput = z.infer<typeof ComposeTaskInputSchema>;
export type ComposeTaskOutput = z.infer<typeof ComposeTaskOutputSchema>;

// ============================================
// Schedule Optimization Schemas
// ============================================

export const OptimizeScheduleTaskSchema = z.object({
  id: z.string(),
  summary: z.string(),
  priority: TaskPrioritySchema,
  dueDate: z.string().nullish(),
  estimation: z.number().nullish(),
  scheduleDate: z.string().nullish(),
  status: z.string(),
});

export const OptimizeScheduleInputSchema = z.object({
  tasks: z.array(OptimizeScheduleTaskSchema).min(1),
  currentDate: z.string(),
});

export const ScheduleRecommendationSchema = z.object({
  taskId: z.string(),
  taskSummary: z.string(),
  currentSchedule: z.string().nullish(),
  suggestedSchedule: z.string().nullish(),
  reason: z.string(),
});

export const OptimizeScheduleOutputSchema = z.object({
  summary: z.string(),
  currentWorkload: z.object({
    today: z.number(),
    tomorrow: z.number(),
    unscheduled: z.number(),
  }),
  recommendations: z.array(ScheduleRecommendationSchema),
  risks: z.array(z.string()),
  insights: z.array(z.string()),
});

export type OptimizeScheduleTask = z.infer<typeof OptimizeScheduleTaskSchema>;
export type OptimizeScheduleInput = z.infer<typeof OptimizeScheduleInputSchema>;
export type ScheduleRecommendation = z.infer<
  typeof ScheduleRecommendationSchema
>;
export type OptimizeScheduleOutput = z.infer<
  typeof OptimizeScheduleOutputSchema
>;
