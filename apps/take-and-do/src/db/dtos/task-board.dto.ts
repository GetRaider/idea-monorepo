import { z } from "zod";

const emojiField = z.string().min(1).nullable().optional();

const folderIdField = z
  .string()
  .nullable()
  .optional()
  .transform((value) => (value === "" ? null : value));

export const CreateTaskBoardDto = z.object({
  name: z.string().min(1, "Name is required"),
  folderId: folderIdField,
  emoji: emojiField,
});

export const UpdateTaskBoardDto = z.object({
  name: z.string().min(1, "Name must be a non-empty string").optional(),
  folderId: folderIdField,
  emoji: emojiField,
  isPublic: z.boolean().optional(),
  createdAt: z.string().min(1).optional(),
});

export type CreateTaskBoardInput = z.infer<typeof CreateTaskBoardDto>;
export type UpdateTaskBoardInput = z.infer<typeof UpdateTaskBoardDto>;
