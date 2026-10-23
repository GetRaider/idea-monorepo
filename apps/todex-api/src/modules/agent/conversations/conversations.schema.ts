import { z } from "zod";

export const PostConversationMessageSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  idempotencyKey: z.string().trim().min(1).max(200).optional(),
  mode: z.enum(["execute", "ask"]).optional(),
});

export type PostConversationMessageBody = z.infer<
  typeof PostConversationMessageSchema
>;
