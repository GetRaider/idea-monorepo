import { z } from "zod";

export const CreateLabelDto = z.object({
  label: z.string().min(1, "Label is required"),
});

export const RenameLabelDto = z.object({
  oldName: z.string().min(1, "oldName is required"),
  newName: z.string().min(1, "newName is required"),
});

export const DeleteLabelDto = z.object({
  name: z.string().min(1, "Name is required"),
});

export type CreateLabelInput = z.infer<typeof CreateLabelDto>;
export type RenameLabelInput = z.infer<typeof RenameLabelDto>;
export type DeleteLabelInput = z.infer<typeof DeleteLabelDto>;
