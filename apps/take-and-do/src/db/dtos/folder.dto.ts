import { z } from "zod";

const emojiField = z.string().min(1).nullable().optional();

export const CreateFolderDto = z.object({
  name: z.string().min(1, "Name is required"),
  emoji: emojiField,
});

export const UpdateFolderDto = z.object({
  name: z.string().min(1, "Name must be a non-empty string").optional(),
  emoji: emojiField,
  isPublic: z.boolean().optional(),
  createdAt: z.string().min(1).optional(),
});

export const FolderByIdRequestDto = z.object({ id: z.string() });

export const UpdateFolderRequestDto = z.intersection(
  FolderByIdRequestDto,
  UpdateFolderDto,
);

export type CreateFolderInput = z.infer<typeof CreateFolderDto>;
export type UpdateFolderInput = z.infer<typeof UpdateFolderDto>;
