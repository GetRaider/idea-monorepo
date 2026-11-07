import { z } from "zod";

export const TaskReferenceKindSchema = z.enum(["doc", "conversation", "url"]);

export const TaskReferenceSchema = z.object({
  id: z.string(),
  kind: TaskReferenceKindSchema,
  docId: z.string().nullable(),
  conversationId: z.string().nullable(),
  url: z.string().nullable(),
  title: z.string(),
});

export const CreateTaskReferenceBodySchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("doc"),
    docId: z.string().min(1),
  }),
  z.object({
    kind: z.literal("conversation"),
    conversationId: z.string().min(1),
  }),
  z.object({
    kind: z.literal("url"),
    url: z.string().trim().url().max(2000),
    title: z.string().trim().min(1).max(200).optional(),
  }),
]);

export type TaskReference = z.infer<typeof TaskReferenceSchema>;
export type CreateTaskReferenceBody = z.infer<
  typeof CreateTaskReferenceBodySchema
>;
