import { z } from "zod";

import { TaskPriority, TaskStatus } from "./enums.ts";
import { IsoDateTimeSchema } from "./iso.ts";
import { TaskRecurrenceSchema } from "./recurrence.ts";

export const AcceptanceCriterionSchema = z.object({
  id: z.string().trim().min(1).max(64),
  text: z.string().trim().min(1).max(280),
  done: z.boolean(),
});

export const AcceptanceCriteriaSchema = z
  .array(AcceptanceCriterionSchema)
  .max(30)
  .superRefine((criteria, context) => {
    const seenIds = new Set<string>();
    for (const [index, criterion] of criteria.entries()) {
      if (seenIds.has(criterion.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Duplicate acceptance criterion id",
          path: [index, "id"],
        });
      }
      seenIds.add(criterion.id);
    }
  });

const taskStatusSchema = z.enum([
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.DONE,
  TaskStatus.CANCELLED,
]);

const estimationSchema = z.number().int().positive();

export const TaskComplexitySchema = z.enum(["low", "medium", "high"]);

export const ScheduleSlotSchema = z.object({
  id: z.string().min(1),
  startAt: IsoDateTimeSchema,
  endAt: IsoDateTimeSchema,
  retiredAt: IsoDateTimeSchema.nullable(),
});

export const ScheduleSlotInputSchema = z.object({
  id: z.string().min(1).optional(),
  startAt: IsoDateTimeSchema,
  endAt: IsoDateTimeSchema,
  retiredAt: IsoDateTimeSchema.nullable().optional(),
});

export const TaskConflictSchema = z.object({
  slotId: z.string(),
  title: z.string(),
});

const taskPrioritySchema = z.enum([
  TaskPriority.LOW,
  TaskPriority.MEDIUM,
  TaskPriority.HIGH,
  TaskPriority.CRITICAL,
]);

const outcomeSchema = z.string().trim().max(500);

export const TaskSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  spaceId: z.string(),
  taskKey: z.string(),
  summary: z.string(),
  description: z.string(),
  outcome: z.string(),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  complexity: TaskComplexitySchema.nullable(),
  dueDate: IsoDateTimeSchema.nullable(),
  estimation: estimationSchema,
  actualTime: z.number().int().nonnegative(),
  color: z.string().nullable(),
  acceptanceCriteria: AcceptanceCriteriaSchema.default([]),
  recurrence: TaskRecurrenceSchema.nullable(),
  scheduleSlots: z.array(ScheduleSlotSchema).max(10),
  sectionId: z.string(),
  progressStageId: z.string().nullable(),
  parentTaskId: z.string().nullable(),
  epicId: z.string().nullable(),
  goalId: z.string().nullable(),
  ownerId: z.string(),
  seriesId: z.string().nullable(),
  occurrenceKey: z.string().nullable(),
  occurrenceAnchor: IsoDateTimeSchema.nullable(),
  originSeriesId: z.string().nullable(),
  overriddenFields: z.array(z.string()),
  version: z.number().int().positive(),
  conflicts: z.array(TaskConflictSchema).default([]),
  position: z.number().int().nonnegative(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});

export const ListTasksQuerySchema = z
  .object({
    spaceId: z.string().min(1).optional(),
    epicId: z.string().min(1).optional(),
    scheduleFrom: IsoDateTimeSchema.optional(),
    scheduleTo: IsoDateTimeSchema.optional(),
  })
  .superRefine((value, context) => {
    const hasBoard = value.spaceId != null || value.epicId != null;
    const hasFrom = value.scheduleFrom != null;
    const hasTo = value.scheduleTo != null;
    if ((value.spaceId != null || value.epicId != null) && (hasFrom || hasTo)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Provide either a space or epic, or a schedule range, not both",
      });
      return;
    }
    if (!hasBoard && !hasFrom && !hasTo) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide spaceId, epicId, or both scheduleFrom and scheduleTo",
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
  spaceId: z.string().min(1),
  summary: z.string().min(1),
  description: z.string().optional().default(""),
  status: taskStatusSchema.optional(),
  priority: z
    .enum([
      TaskPriority.LOW,
      TaskPriority.MEDIUM,
      TaskPriority.HIGH,
      TaskPriority.CRITICAL,
    ])
    .optional(),
  dueDate: IsoDateTimeSchema.nullable().optional(),
  outcome: outcomeSchema.optional(),
  complexity: TaskComplexitySchema.nullable().optional(),
  scheduleSlots: z.array(ScheduleSlotInputSchema).max(10).optional(),
  estimation: estimationSchema,
  acceptanceCriteria: AcceptanceCriteriaSchema.optional(),
  recurrence: TaskRecurrenceSchema.nullable().optional(),
  sectionId: z.string().min(1).optional(),
  progressStageId: z.string().min(1).nullable().optional(),
  parentTaskId: z.string().nullable().optional(),
  epicId: z.string().nullable().optional(),
});

export const UpdateTaskBodySchema = z.object({
  spaceId: z.string().min(1).optional(),
  summary: z.string().min(1).optional(),
  description: z.string().optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullable()
    .optional(),
  status: taskStatusSchema.optional(),
  priority: z
    .enum([
      TaskPriority.LOW,
      TaskPriority.MEDIUM,
      TaskPriority.HIGH,
      TaskPriority.CRITICAL,
    ])
    .optional(),
  dueDate: IsoDateTimeSchema.nullable().optional(),
  outcome: outcomeSchema.optional(),
  complexity: TaskComplexitySchema.nullable().optional(),
  scheduleSlots: z.array(ScheduleSlotInputSchema).max(10).optional(),
  estimation: estimationSchema.optional(),
  acceptanceCriteria: AcceptanceCriteriaSchema.optional(),
  recurrence: TaskRecurrenceSchema.nullable().optional(),
  version: z.number().int().positive(),
  transitionId: z.string().uuid().optional(),
  sectionId: z.string().min(1).optional(),
  progressStageId: z.string().min(1).nullable().optional(),
  parentTaskId: z.string().nullable().optional(),
  epicId: z.string().nullable().optional(),
  goalId: z.string().nullable().optional(),
});

export const MoveTaskBodySchema = z.object({
  status: taskStatusSchema,
  index: z.number().int().nonnegative().optional(),
  version: z.number().int().positive(),
  transitionId: z.string().uuid().optional(),
});

export const DeleteTaskBodySchema = z.object({
  version: z.number().int().positive(),
  transitionId: z.string().uuid(),
});

export const TaskCalendarPreviewSchema = z.object({
  seriesId: z.string(),
  occurrenceKey: z.string(),
  title: z.string(),
  slots: z.array(
    z.object({
      startAt: IsoDateTimeSchema,
      endAt: IsoDateTimeSchema,
    }),
  ),
});

export const TaskCalendarRangeSchema = z.object({
  tasks: z.array(TaskSchema),
  previews: z.array(TaskCalendarPreviewSchema),
  conflicts: z.array(TaskConflictSchema),
});

export type AcceptanceCriterion = z.infer<typeof AcceptanceCriterionSchema>;
export type ScheduleSlot = z.infer<typeof ScheduleSlotSchema>;
export type ScheduleSlotInput = z.infer<typeof ScheduleSlotInputSchema>;
export type TaskConflict = z.infer<typeof TaskConflictSchema>;
export type TaskComplexity = z.infer<typeof TaskComplexitySchema>;
export type Task = z.infer<typeof TaskSchema>;
export type ListTasksQuery = z.infer<typeof ListTasksQuerySchema>;
export type CreateTaskBody = z.infer<typeof CreateTaskBodySchema>;
export type UpdateTaskBody = z.infer<typeof UpdateTaskBodySchema>;
export type MoveTaskBody = z.infer<typeof MoveTaskBodySchema>;
export type DeleteTaskBody = z.infer<typeof DeleteTaskBodySchema>;
export type TaskCalendarPreview = z.infer<typeof TaskCalendarPreviewSchema>;
export type TaskCalendarRange = z.infer<typeof TaskCalendarRangeSchema>;
