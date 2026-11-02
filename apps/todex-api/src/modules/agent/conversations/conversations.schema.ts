import { z } from "zod";

export const PostConversationMessageSchema = z
  .object({
    message: z.string().trim().min(1).max(4000),
    idempotencyKey: z.string().trim().min(1).max(200).optional(),
    mode: z.enum(["execute", "ask"]).optional(),
    webResearch: z.boolean().optional(),
    focalType: z.enum(["task", "doc"]).optional(),
    focalId: z.string().trim().min(1).optional(),
  })
  .refine((value) => (value.focalType == null) === (value.focalId == null), {
    message: "focalType and focalId are set together",
  });

export type PostConversationMessageBody = z.infer<
  typeof PostConversationMessageSchema
>;
