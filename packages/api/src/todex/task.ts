import { z } from "zod";

import { TaskPriority, TaskStatus } from "./enums.ts";
import { IsoDateTimeSchema } from "./iso.ts";

export const TaskSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  taskBoardId: z.string(),
  taskKey: z.string(),
  summary: z.string(),
  description: z.string(),
  status: z.enum([TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE]),
  priority: z.enum([
    TaskPriority.LOW,
    TaskPriority.MEDIUM,
    TaskPriority.HIGH,
    TaskPriority.CRITICAL,
  ]),
  dueDate: IsoDateTimeSchema.nullable(),
  scheduleDate: IsoDateTimeSchema.nullable(),
  estimation: z.number().int().nonnegative().nullable(),
  parentTaskId: z.string().nullable(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});

export const ListTasksQuerySchema = z
  .object({
    boardId: z.string().min(1).optional(),
    scheduleFrom: IsoDateTimeSchema.optional(),
    scheduleTo: IsoDateTimeSchema.optional(),
  })
  .superRefine((value, context) => {
    const hasBoard = value.boardId != null;
    const hasFrom = value.scheduleFrom != null;
    const hasTo = value.scheduleTo != null;
    if (hasBoard && (hasFrom || hasTo)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide either boardId or a schedule range, not both",
      });
      return;
    }
    if (!hasBoard && !hasFrom && !hasTo) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide boardId or both scheduleFrom and scheduleTo",
      });
      return;
    }
    if (!hasBoard && hasFrom !== hasTo) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "scheduleFrom and scheduleTo are both required",
      });
      return;
    }
    if (hasFrom && hasTo) {
      const fromTime = Date.parse(value.scheduleFrom!);
      const toTime = Date.parse(value.scheduleTo!);
      if (!(fromTime < toTime)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "scheduleTo must be after scheduleFrom",
        });
      }
    }
  });

export const CreateTaskBodySchema = z.object({
  taskBoardId: z.string().min(1),
  summary: z.string().min(1),
  description: z.string().optional().default(""),
  status: z
    .enum([TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE])
    .optional(),
  priority: z
    .enum([
      TaskPriority.LOW,
      TaskPriority.MEDIUM,
      TaskPriority.HIGH,
      TaskPriority.CRITICAL,
    ])
    .optional(),
  dueDate: IsoDateTimeSchema.nullable().optional(),
  scheduleDate: IsoDateTimeSchema.nullable().optional(),
  estimation: z.number().int().nonnegative().nullable().optional(),
  parentTaskId: z.string().nullable().optional(),
});

export const UpdateTaskBodySchema = z.object({
  taskBoardId: z.string().min(1).optional(),
  summary: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z
    .enum([TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE])
    .optional(),
  priority: z
    .enum([
      TaskPriority.LOW,
      TaskPriority.MEDIUM,
      TaskPriority.HIGH,
      TaskPriority.CRITICAL,
    ])
    .optional(),
  dueDate: IsoDateTimeSchema.nullable().optional(),
  scheduleDate: IsoDateTimeSchema.nullable().optional(),
  estimation: z.number().int().nonnegative().nullable().optional(),
  parentTaskId: z.string().nullable().optional(),
});

export type Task = z.infer<typeof TaskSchema>;
export type ListTasksQuery = z.infer<typeof ListTasksQuerySchema>;
export type CreateTaskBody = z.infer<typeof CreateTaskBodySchema>;
export type UpdateTaskBody = z.infer<typeof UpdateTaskBodySchema>;
