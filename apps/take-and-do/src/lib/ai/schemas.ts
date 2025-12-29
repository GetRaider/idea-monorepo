import { z } from "zod";

// Re-use existing TaskPriority values
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

export const AnalyticsStatsSchema = z.object({
  tasksCreated: z.number().int().min(0),
  tasksCompleted: z.number().int().min(0),
  avgCompletionTimeDays: z.number().min(0),
  overdueRate: z.number().min(0).max(1),
});

export const AnalyticsInputSchema = z.object({
  stats: AnalyticsStatsSchema,
  timeframe: z.enum(["week", "month", "quarter"]),
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
  id: z.string().optional(),
  taskBoardId: z.string().optional(),
  taskKey: z.string().optional(),
  summary: z.string().min(1),
  description: z.string().min(1),
  status: TaskStatusSchema.optional(),
  priority: TaskPrioritySchema,
  labels: z.array(z.string()).optional(),
  dueDate: z.string().optional(),
  estimation: z.number().positive().optional(),
  subtasks: z.array(z.any()).optional(),
  schedule: z.enum(["today", "tomorrow"]).optional(),
  scheduleDate: z.string().optional(),
});

export type ComposeTaskInput = z.infer<typeof ComposeTaskInputSchema>;
export type ComposeTaskOutput = z.infer<typeof ComposeTaskOutputSchema>;
