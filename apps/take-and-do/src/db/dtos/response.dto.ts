import { z } from "zod";

import {
  AnalyticsOutputSchema,
  ComposeTaskOutputSchema,
  OptimizeScheduleOutputSchema,
} from "@/services/server/ai/schemas";

import { taskStatsSchema, timeframeEnum } from "./analytics.dto";

const dateLike = z.union([z.date(), z.string()]);

export const FolderResponseDto = z.object({
  id: z.string(),
  name: z.string(),
  emoji: z.string().nullable().optional(),
  isPublic: z.boolean(),
  createdAt: dateLike,
  updatedAt: dateLike,
  guest: z.literal(true).optional(),
});

export const FoldersListResponseDto = z.array(FolderResponseDto);

export const TaskBoardResponseDto = z.object({
  id: z.string(),
  isPublic: z.boolean(),
  name: z.string(),
  emoji: z.string().nullable().optional(),
  folderId: z.string().nullable().optional(),
  createdAt: dateLike,
  updatedAt: dateLike,
  guest: z.literal(true).optional(),
});

export const TaskBoardListResponseDto = z.array(TaskBoardResponseDto);

export const TaskBoardSingleQueryResponseDto = z.tuple([TaskBoardResponseDto]);

const taskStatusSchema = z.enum(["To Do", "In Progress", "Done"]);
const taskPrioritySchema = z.enum(["low", "medium", "high", "critical"]);

export const TaskResponseDto: z.ZodTypeAny = z.lazy(() =>
  z.object({
    id: z.string(),
    taskBoardId: z.string(),
    taskKey: z.string().optional(),
    summary: z.string(),
    description: z.string(),
    status: taskStatusSchema,
    priority: taskPrioritySchema,
    labels: z.array(z.string()).optional(),
    dueDate: dateLike.optional(),
    estimation: z.number().optional(),
    scheduleDate: dateLike.optional(),
    subtasks: z.array(TaskResponseDto).optional(),
    guest: z.literal(true).optional(),
  }),
);

export const TaskListResponseDto = z.array(TaskResponseDto);

export const TaskByKeyResponseDto = z.object({
  task: TaskResponseDto,
  parent: TaskResponseDto.nullable(),
});

export const LabelsListResponseDto = z.array(z.string());

export const LabelMutationResponseDto = z.object({
  label: z.string(),
});

export const OkTrueResponseDto = z.object({
  ok: z.literal(true),
});

export const WorkspacesResponseDto = z.object({
  folders: FoldersListResponseDto,
  taskBoards: TaskBoardListResponseDto,
});

export const TaskCountsResponseDto = z.object({
  total: z.number(),
  todo: z.number(),
  inProgress: z.number(),
  done: z.number(),
  highPriority: z.number(),
  overdue: z.number(),
});

export const AnalyticsGetResponseDto = z.object({
  timeframe: timeframeEnum,
  stats: taskStatsSchema,
});

export const AnalyticsPostResponseDto = z.object({
  timeframe: timeframeEnum,
  stats: taskStatsSchema,
  analytics: AnalyticsOutputSchema,
  aiGenerated: z.boolean(),
});

export const OptimizeTasksResponseDto = z.object({
  optimization: OptimizeScheduleOutputSchema,
  tasksCount: z.number(),
});

export const TasksDeletedCountResponseDto = z.object({
  deleted: z.number(),
});

export const TaskDeleteSuccessResponseDto = z.object({
  success: z.literal(true),
});

export const GuestResourceDeleteResponseDto = z.object({
  id: z.string(),
  deleted: z.literal(true),
  guest: z.literal(true),
});

export const TaskBoardCreateErrorResponseDto = z.object({
  error: z.string(),
  details: z.string().optional(),
});

export const ComposeTaskOnlyResponseDto = ComposeTaskOutputSchema;

export const TaskCreateResponseDto = z.union([
  ComposeTaskOutputSchema,
  TaskResponseDto,
]);
