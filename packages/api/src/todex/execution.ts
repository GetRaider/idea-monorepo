import { z } from "zod";

import { TaskPriority, TaskStatus } from "./enums.ts";
import { IsoDateTimeSchema } from "./iso.ts";
import { AcceptanceCriteriaSchema } from "./task.ts";

export const ExecutionExecutorTypeSchema = z.enum(["human", "ai"]);

const taskStatusSchema = z.enum([
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.DONE,
  TaskStatus.CANCELLED,
]);

const taskPrioritySchema = z.enum([
  TaskPriority.LOW,
  TaskPriority.MEDIUM,
  TaskPriority.HIGH,
  TaskPriority.CRITICAL,
]);

export const ExecutionTaskRefSchema = z.object({
  id: z.string(),
  taskKey: z.string(),
  summary: z.string(),
});

export const ExecutionIntervalSchema = z.object({
  startedAt: IsoDateTimeSchema,
  endedAt: IsoDateTimeSchema.nullable(),
});

export const ExecutionQueueTaskSchema = ExecutionTaskRefSchema.extend({
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  estimation: z.number().int().positive(),
  actualTime: z.number().int().nonnegative(),
  scheduleDate: IsoDateTimeSchema.nullable(),
  boardId: z.string(),
  boardName: z.string(),
  areaName: z.string(),
  isDefaultArea: z.boolean(),
  dueDate: IsoDateTimeSchema.nullable(),
  stageName: z.string().nullable(),
});

export const ExecutionSuggestionSchema = z.object({
  id: z.string(),
  taskKey: z.string(),
  summary: z.string(),
  priority: taskPrioritySchema,
  estimation: z.number().int().positive(),
  scheduleDate: IsoDateTimeSchema.nullable(),
  dueDate: IsoDateTimeSchema.nullable(),
  boardId: z.string(),
  boardName: z.string(),
  areaName: z.string(),
  isDefaultArea: z.boolean(),
  stageName: z.string().nullable(),
});

export const ExecutionSubtaskSchema = z.object({
  id: z.string(),
  taskKey: z.string(),
  summary: z.string(),
  status: taskStatusSchema,
});

export const ExecutionCurrentSchema = ExecutionQueueTaskSchema.extend({
  description: z.string(),
  acceptanceCriteria: AcceptanceCriteriaSchema,
  intervals: z.array(ExecutionIntervalSchema),
  goal: z
    .object({
      id: z.string(),
      title: z.string(),
    })
    .nullable(),
  subtasks: z.array(ExecutionSubtaskSchema),
});

export const ExecutionSessionSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  tasks: z.array(ExecutionTaskRefSchema),
  startedAt: IsoDateTimeSchema,
  endedAt: IsoDateTimeSchema.nullable(),
  duration: z.number().int().nonnegative().nullable(),
  executorType: ExecutionExecutorTypeSchema,
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});

export const ExecutionQueueItemSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  position: z.number().int().nonnegative(),
  task: ExecutionQueueTaskSchema,
});

export const ExecutionStateSchema = z.object({
  session: ExecutionSessionSchema.nullable(),
  tasks: z.array(ExecutionCurrentSchema),
  focusedTaskId: z.string().nullable(),
  queue: z.array(ExecutionQueueItemSchema),
});

export const ReorderExecutionQueueBodySchema = z.object({
  taskIds: z.array(z.string().trim().min(1)).max(100),
});

export const ExecuteTaskBodySchema = z.object({
  taskIds: z.array(z.string().trim().min(1)).max(100),
});

export const EnqueueExecutionBodySchema = z.object({
  taskId: z.string().trim().min(1),
});

export const FocusExecutionTaskBodySchema = EnqueueExecutionBodySchema;

export const CompleteExecutionBodySchema = z.object({
  duration: z
    .number()
    .int()
    .nonnegative()
    .max(60 * 60 * 24 * 14)
    .optional(),
});

export const UpdateExecutionSessionBodySchema = z.object({
  startedAt: IsoDateTimeSchema,
  endedAt: IsoDateTimeSchema,
});

export const ExecutionActivityQuerySchema = z
  .object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    timeZone: z.string().trim().min(1).max(100),
    boardId: z.string().trim().min(1).optional(),
  })
  .refine((query) => query.from <= query.to, { message: "Invalid range" });

export const ExecutionActivitySchema = z.object({
  executionSeconds: z.number().int().nonnegative(),
  sessionCount: z.number().int().nonnegative(),
  dailyAverageSeconds: z.number().int().nonnegative(),
  averageSessionSeconds: z.number().int().nonnegative(),
  longestSessionSeconds: z.number().int().nonnegative(),
  activeDays: z.number().int().nonnegative(),
  rangeDays: z.number().int().positive(),
  days: z.array(
    z.object({
      date: z.string(),
      seconds: z.number().int().nonnegative(),
    }),
  ),
  boards: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    }),
  ),
  activities: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      seconds: z.number().int().nonnegative(),
    }),
  ),
});

export type ExecutionExecutorType = z.infer<typeof ExecutionExecutorTypeSchema>;
export type ExecutionInterval = z.infer<typeof ExecutionIntervalSchema>;
export type ExecutionTaskRef = z.infer<typeof ExecutionTaskRefSchema>;
export type ExecutionQueueTask = z.infer<typeof ExecutionQueueTaskSchema>;
export type ExecutionSuggestion = z.infer<typeof ExecutionSuggestionSchema>;
export type ExecutionSubtask = z.infer<typeof ExecutionSubtaskSchema>;
export type ExecutionCurrent = z.infer<typeof ExecutionCurrentSchema>;
export type ExecutionSession = z.infer<typeof ExecutionSessionSchema>;
export type ExecutionQueueItem = z.infer<typeof ExecutionQueueItemSchema>;
export type ExecutionState = z.infer<typeof ExecutionStateSchema>;
export type FocusExecutionTaskBody = z.infer<typeof FocusExecutionTaskBodySchema>;
export type ExecuteTaskBody = z.infer<typeof ExecuteTaskBodySchema>;
export type EnqueueExecutionBody = z.infer<typeof EnqueueExecutionBodySchema>;
export type ReorderExecutionQueueBody = z.infer<
  typeof ReorderExecutionQueueBodySchema
>;
export type CompleteExecutionBody = z.infer<typeof CompleteExecutionBodySchema>;
export type UpdateExecutionSessionBody = z.infer<
  typeof UpdateExecutionSessionBodySchema
>;
export type ExecutionActivityQuery = z.infer<typeof ExecutionActivityQuerySchema>;
export type ExecutionActivity = z.infer<typeof ExecutionActivitySchema>;
