import { z } from "zod";

import { AcceptanceCriteriaSchema } from "./task.ts";
import { DocType } from "./enums.ts";
import { EMPTY_PROSE_DOC, ProseDocSchema } from "./prose.ts";
import { IsoDateTimeSchema } from "./iso.ts";

const TitleSchema = z.string().trim().min(1).max(200);

const LinkedTaskIdsSchema = z
  .array(z.string().trim().min(1).max(128))
  .max(100)
  .superRefine((taskIds, context) => {
    const seen = new Set<string>();
    for (const [index, taskId] of taskIds.entries()) {
      if (seen.has(taskId)) {
        context.addIssue({
          code: "custom",
          message: "Duplicate linked task",
          path: [index],
        });
      }
      seen.add(taskId);
    }
  });

export const CommonDocBodySchema = z
  .object({
    content: ProseDocSchema,
  })
  .strict();

export const GoalDocBodySchema = z
  .object({
    why: ProseDocSchema,
    successCriteria: AcceptanceCriteriaSchema,
    preconditions: AcceptanceCriteriaSchema,
  })
  .strict();

export const UpdateCommonDocBodySchema = z
  .object({
    content: ProseDocSchema.optional(),
  })
  .strict();

export const UpdateGoalDocBodySchema = z
  .object({
    why: ProseDocSchema.optional(),
    successCriteria: AcceptanceCriteriaSchema.optional(),
    preconditions: AcceptanceCriteriaSchema.optional(),
  })
  .strict();

const DocSummaryFields = {
  id: z.string(),
  workspaceId: z.string(),
  folderId: z.string().nullable(),
  docKey: z.string(),
  title: z.string(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
};

export const DocSummarySchema = z.object({
  ...DocSummaryFields,
  type: z.enum([DocType.COMMON, DocType.GOAL]),
});

export const CommonDocSchema = z.object({
  ...DocSummaryFields,
  type: z.literal(DocType.COMMON),
  body: CommonDocBodySchema,
});

export const GoalDocSchema = z.object({
  ...DocSummaryFields,
  type: z.literal(DocType.GOAL),
  body: GoalDocBodySchema,
  linkedTaskIds: z.array(z.string()),
});

export const DocSchema = z.discriminatedUnion("type", [
  CommonDocSchema,
  GoalDocSchema,
]);

export const ListDocsQuerySchema = z.object({
  type: z.enum([DocType.COMMON, DocType.GOAL]).optional(),
  folderId: z.string().min(1).optional(),
});

export const CreateDocBodySchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal(DocType.COMMON),
      title: TitleSchema,
      folderId: z.string().min(1).nullable().optional(),
      body: CommonDocBodySchema.optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal(DocType.GOAL),
      title: TitleSchema,
      folderId: z.string().min(1).nullable().optional(),
      body: GoalDocBodySchema.optional(),
      linkedTaskIds: LinkedTaskIdsSchema.optional(),
    })
    .strict(),
]);

export const UpdateDocBodySchema = z
  .object({
    title: TitleSchema.optional(),
    folderId: z.string().min(1).nullable().optional(),
    body: z.unknown().optional(),
    linkedTaskIds: LinkedTaskIdsSchema.optional(),
  })
  .strict()
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: "No changes",
  });

export function emptyCommonDocBody(): CommonDocBody {
  return { content: EMPTY_PROSE_DOC };
}

export function emptyGoalDocBody(): GoalDocBody {
  return {
    why: EMPTY_PROSE_DOC,
    successCriteria: [],
    preconditions: [],
  };
}

export function readGoalDocBody(value: unknown): GoalDocBody {
  const record =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const parsed = GoalDocBodySchema.safeParse({
    why: record.why ?? EMPTY_PROSE_DOC,
    successCriteria: record.successCriteria ?? [],
    preconditions: record.preconditions ?? [],
  });
  return parsed.success ? parsed.data : emptyGoalDocBody();
}

export type CommonDocBody = z.infer<typeof CommonDocBodySchema>;
export type GoalDocBody = z.infer<typeof GoalDocBodySchema>;
export type DocBody = CommonDocBody | GoalDocBody;
export type UpdateCommonDocBody = z.infer<typeof UpdateCommonDocBodySchema>;
export type UpdateGoalDocBody = z.infer<typeof UpdateGoalDocBodySchema>;
export type DocSummary = z.infer<typeof DocSummarySchema>;
export type CommonDoc = z.infer<typeof CommonDocSchema>;
export type GoalDoc = z.infer<typeof GoalDocSchema>;
export type Doc = z.infer<typeof DocSchema>;
export type ListDocsQuery = z.infer<typeof ListDocsQuerySchema>;
export type CreateDocBody = z.infer<typeof CreateDocBodySchema>;
export type UpdateDocBody = z.infer<typeof UpdateDocBodySchema>;

export interface DocPlainText {
  content?: string;
  why?: string;
}
