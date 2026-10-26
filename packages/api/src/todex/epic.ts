import { z } from "zod";

import { TaskPriority, TaskStatus } from "./enums.ts";
import { IsoDateTimeSchema } from "./iso.ts";
import { TaskSchema } from "./task.ts";

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

const nameSchema = z.string().trim().min(1).max(80);
const descriptionSchema = z.string().trim().max(4000);

export const PlanningProgressSchema = z.object({
  totalTasks: z.number().int().nonnegative(),
  completedTasks: z.number().int().nonnegative(),
  progressPercent: z.number().int().min(0).max(100),
});

export const EpicSchema = z.object({
  id: z.string(),
  spaceId: z.string(),
  sectionId: z.string(),
  name: z.string(),
  description: z.string(),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
  progress: PlanningProgressSchema,
});

export const CreateEpicBodySchema = z.object({
  name: nameSchema,
  description: descriptionSchema.optional().default(""),
  sectionId: z.string().optional(),
});

export const UpdateEpicBodySchema = z
  .object({
    name: nameSchema.optional(),
    description: descriptionSchema.optional(),
    status: taskStatusSchema.optional(),
    priority: taskPrioritySchema.optional(),
    sectionId: z.string().optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.description !== undefined ||
      value.status !== undefined ||
      value.priority !== undefined ||
      value.sectionId !== undefined,
    { message: "Provide a field to update" },
  );

export const EpicDetailSchema = z.object({
  epic: EpicSchema,
  tasks: z.array(TaskSchema),
});

export type PlanningProgress = z.infer<typeof PlanningProgressSchema>;
export type Epic = z.infer<typeof EpicSchema>;
export type CreateEpicBody = z.infer<typeof CreateEpicBodySchema>;
export type UpdateEpicBody = z.infer<typeof UpdateEpicBodySchema>;
export type EpicDetail = z.infer<typeof EpicDetailSchema>;
