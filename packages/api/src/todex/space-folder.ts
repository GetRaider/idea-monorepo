import { z } from "zod";

import { IsoDateTimeSchema } from "./iso.ts";

export const SpaceFolderSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  name: z.string(),
  emoji: z.string().nullable(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});

export const CreateSpaceFolderBodySchema = z
  .object({
    name: z.string().min(1),
    emoji: z.string().nullable().optional(),
  })
  .strict();

export const UpdateSpaceFolderBodySchema = z
  .object({
    name: z.string().min(1).optional(),
    emoji: z.string().nullable().optional(),
  })
  .strict()
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: "No changes",
  });

export type SpaceFolder = z.infer<typeof SpaceFolderSchema>;
export type CreateSpaceFolderBody = z.infer<typeof CreateSpaceFolderBodySchema>;
export type UpdateSpaceFolderBody = z.infer<typeof UpdateSpaceFolderBodySchema>;
