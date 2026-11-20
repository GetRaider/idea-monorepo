import { z } from "zod";

export const KnowledgePropertyTypeSchema = z.enum([
  "title",
  "text",
  "number",
  "select",
  "multi_select",
  "date",
  "checkbox",
]);

export const KnowledgeCellValueSchema = z.union([
  z.string().max(10000),
  z.number().finite(),
  z.boolean(),
  z.array(z.string().max(200)).max(100),
  z.null(),
]);

export const KnowledgePropertySchema = z.object({
  id: z.string(),
  databaseId: z.string(),
  name: z.string(),
  type: KnowledgePropertyTypeSchema,
  options: z.array(z.string()),
  position: z.number().int(),
});

export const KnowledgeRowSchema = z.object({
  id: z.string(),
  databaseId: z.string(),
  cells: z.record(z.string(), KnowledgeCellValueSchema),
  position: z.number().int(),
  updatedAt: z.string(),
});

export const KnowledgeSortSchema = z.object({
  propertyId: z.string(),
  direction: z.enum(["asc", "desc"]),
});

export const KnowledgeFilterSchema = z.object({
  propertyId: z.string(),
  operator: z.enum([
    "contains", "equals", "not_equals", "is_empty", "not_empty",
    "greater_than", "less_than",
  ]),
  value: KnowledgeCellValueSchema.optional(),
});

export const KnowledgeViewSchema = z.object({
  id: z.string(),
  databaseId: z.string(),
  name: z.string(),
  kind: z.literal("table"),
  sorts: z.array(KnowledgeSortSchema),
  filters: z.array(KnowledgeFilterSchema),
});

export const KnowledgeDatabaseSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  spaceId: z.string(),
  name: z.string(),
  properties: z.array(KnowledgePropertySchema),
  rows: z.array(KnowledgeRowSchema),
  view: KnowledgeViewSchema,
});

export const CreateKnowledgeDatabaseSchema = z.object({
  spaceId: z.string().min(1),
  name: z.string().trim().min(1).max(200).default("Untitled database"),
}).strict();

export const CreateKnowledgePropertySchema = z.object({
  name: z.string().trim().min(1).max(80),
  type: KnowledgePropertyTypeSchema.exclude(["title"]),
  options: z.array(z.string().trim().min(1).max(80)).max(100).default([]),
}).strict();

export const UpdateKnowledgePropertySchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  type: KnowledgePropertyTypeSchema.exclude(["title"]).optional(),
  options: z.array(z.string().trim().min(1).max(80)).max(100).optional(),
}).strict().refine((value) => Object.keys(value).length > 0);

export const PatchKnowledgeCellSchema = z.object({
  propertyId: z.string().min(1),
  value: KnowledgeCellValueSchema,
}).strict();

export const UpdateKnowledgeViewSchema = z.object({
  sorts: z.array(KnowledgeSortSchema).max(8).optional(),
  filters: z.array(KnowledgeFilterSchema).max(20).optional(),
}).strict();

export type KnowledgePropertyType = z.infer<typeof KnowledgePropertyTypeSchema>;
export type KnowledgeCellValue = z.infer<typeof KnowledgeCellValueSchema>;
export type KnowledgeProperty = z.infer<typeof KnowledgePropertySchema>;
export type KnowledgeRow = z.infer<typeof KnowledgeRowSchema>;
export type KnowledgeView = z.infer<typeof KnowledgeViewSchema>;
export type KnowledgeDatabase = z.infer<typeof KnowledgeDatabaseSchema>;
export type CreateKnowledgeDatabase = z.infer<typeof CreateKnowledgeDatabaseSchema>;
export type CreateKnowledgeProperty = z.infer<typeof CreateKnowledgePropertySchema>;
export type UpdateKnowledgeProperty = z.infer<typeof UpdateKnowledgePropertySchema>;
export type PatchKnowledgeCell = z.infer<typeof PatchKnowledgeCellSchema>;
export type UpdateKnowledgeView = z.infer<typeof UpdateKnowledgeViewSchema>;
