import { z } from "zod";

import { IsoDateTimeSchema } from "./iso.ts";

export const SpaceSectionSchema = z.object({
  id: z.string(),
  spaceId: z.string(),
  name: z.string(),
  position: z.number().int().nonnegative(),
  isDefault: z.boolean(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});

export const CreateSpaceSectionBodySchema = z.object({
  name: z.string().trim().min(1).max(80),
});

export const UpdateSpaceSectionBodySchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    position: z.number().int().nonnegative().optional(),
  })
  .refine((value) => value.name !== undefined || value.position !== undefined, {
    message: "Provide a name or a position",
  });

export type SpaceSection = z.infer<typeof SpaceSectionSchema>;
export type CreateSpaceSectionBody = z.infer<
  typeof CreateSpaceSectionBodySchema
>;
export type UpdateSpaceSectionBody = z.infer<
  typeof UpdateSpaceSectionBodySchema
>;
