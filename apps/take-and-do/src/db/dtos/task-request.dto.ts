import { z } from "zod";

import { TaskPriority, TaskStatus } from "@/constants/tasks.constants";
import { tasksHelper } from "@/helpers/task.helper";
import type { TaskPostPayload } from "@/helpers/task.helper";
import type { TaskUpdate } from "@/types/task";

export const TaskPatchBodySchema = z
  .object({
    id: z.string().optional(),
    taskBoardId: z.string().optional(),
    taskKey: z.string().optional(),
    summary: z.string().optional(),
    description: z.string().optional(),
    status: z.nativeEnum(TaskStatus).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    labels: z.array(z.string()).optional(),
    dueDate: z.union([z.null(), z.coerce.date()]).optional(),
    estimation: z.union([z.null(), z.number()]).optional(),
    scheduleDate: z.union([z.null(), z.coerce.date()]).optional(),
    subtasks: z.array(z.unknown()).optional(),
    isPublic: z.boolean().optional(),
  })
  .strict()
  .transform(
    (body): TaskUpdate => ({
      ...body,
      subtasks:
        body.subtasks === undefined
          ? undefined
          : tasksHelper.fromJson.subtasksFromArray(body.subtasks),
    }),
  );

export const TaskPostBodySchema: z.ZodType<TaskPostPayload> = z
  .any()
  .superRefine((val, ctx) => {
    try {
      tasksHelper.fromJson.postPayload(val);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid task create body",
      });
    }
  })
  .transform((raw) => tasksHelper.fromJson.postPayload(raw));
