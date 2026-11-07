import { z } from "zod";

import { TaskPriority } from "./enums.ts";
import { IsoDateTimeSchema } from "./iso.ts";
import { TaskRecurrenceSchema } from "./recurrence.ts";
import {
  AcceptanceCriteriaSchema,
  TaskComplexitySchema,
} from "./task.ts";
import { CreateTaskReferenceBodySchema } from "./task-reference.ts";

const prioritySchema = z.enum([
  TaskPriority.LOW,
  TaskPriority.MEDIUM,
  TaskPriority.HIGH,
  TaskPriority.CRITICAL,
]);

export const SlotOffsetSchema = z.object({
  dayOffset: z.number().int().min(-366).max(366),
  startLocal: z.string().regex(/^\d{2}:\d{2}$/),
  endLocal: z.string().regex(/^\d{2}:\d{2}$/),
});

export const SeriesTemplateSchema = z.lazy(() =>
  z.object({
    summary: z.string().min(1),
    outcome: z.string().max(500),
    description: z.string(),
    estimation: z.number().int().positive(),
    priority: prioritySchema,
    complexity: TaskComplexitySchema.nullable(),
    progressStageId: z.string().nullable(),
    spaceId: z.string().min(1),
    sectionId: z.string().min(1),
    epicId: z.string().nullable(),
    goalId: z.string().nullable(),
    ownerId: z.string().min(1),
    acceptanceCriteria: AcceptanceCriteriaSchema,
    references: z.array(CreateTaskReferenceBodySchema).max(50),
    subtasks: z.array(SeriesTemplateSchema).max(50),
    slotOffsets: z.array(SlotOffsetSchema).max(10),
    dueOffset: z.number().int().nullable(),
  }),
) as z.ZodType<SeriesTemplate>;

export const CreateSeriesBodySchema = z.object({
  anchor: IsoDateTimeSchema,
});

export const SeriesPatchSchema = z.object({
  summary: z.string().min(1).optional(),
  outcome: z.string().trim().max(500).optional(),
  description: z.string().optional(),
  estimation: z.number().int().positive().optional(),
  priority: prioritySchema.optional(),
  complexity: TaskComplexitySchema.nullable().optional(),
  progressStageId: z.string().nullable().optional(),
  spaceId: z.string().min(1).optional(),
  sectionId: z.string().min(1).optional(),
  epicId: z.string().nullable().optional(),
  goalId: z.string().nullable().optional(),
  dueDate: IsoDateTimeSchema.nullable().optional(),
  acceptanceCriteria: AcceptanceCriteriaSchema.optional(),
  references: z.array(CreateTaskReferenceBodySchema).max(50).optional(),
  subtasks: z.array(SeriesTemplateSchema).max(50).optional(),
  slotOffsets: z.array(SlotOffsetSchema).max(10).optional(),
  rule: TaskRecurrenceSchema.optional(),
  anchor: IsoDateTimeSchema.optional(),
  ruleEffectiveAt: IsoDateTimeSchema.optional(),
});

export const UpdateSeriesBodySchema = z.object({
  scope: z.enum(["instance", "future"]),
  patch: SeriesPatchSchema,
});

export const CreateSeriesExceptionBodySchema = z.object({
  occurrenceKey: z.string().min(1),
  kind: z.enum(["skipped", "deleted"]),
});

export const StopSeriesBodySchema = z.object({
  openTaskId: z.string().min(1).optional(),
});

export const DeleteSeriesResultSchema = z.object({
  kept: z.number().int().nonnegative(),
});

export type SeriesTemplate = {
  summary: string;
  outcome: string;
  description: string;
  estimation: number;
  priority: "low" | "medium" | "high" | "critical";
  complexity: "low" | "medium" | "high" | null;
  progressStageId: string | null;
  spaceId: string;
  sectionId: string;
  epicId: string | null;
  goalId: string | null;
  ownerId: string;
  acceptanceCriteria: z.infer<typeof AcceptanceCriteriaSchema>;
  references: z.infer<typeof CreateTaskReferenceBodySchema>[];
  subtasks: SeriesTemplate[];
  slotOffsets: z.infer<typeof SlotOffsetSchema>[];
  dueOffset: number | null;
};

export type CreateSeriesBody = z.infer<typeof CreateSeriesBodySchema>;
export type SeriesPatch = z.infer<typeof SeriesPatchSchema>;
export type UpdateSeriesBody = z.infer<typeof UpdateSeriesBodySchema>;
export type CreateSeriesExceptionBody = z.infer<
  typeof CreateSeriesExceptionBodySchema
>;
export type StopSeriesBody = z.infer<typeof StopSeriesBodySchema>;
export type DeleteSeriesResult = z.infer<typeof DeleteSeriesResultSchema>;
