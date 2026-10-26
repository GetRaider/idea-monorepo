import { z } from "zod";

import { SpaceSectionSchema } from "./section.ts";
import { IsoDateTimeSchema } from "./iso.ts";
import { SpaceProgressStageSchema } from "./progress-stage.ts";

export const SpaceSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  folderId: z.string().nullable(),
  name: z.string(),
  emoji: z.string().nullable(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});

export const ListSpacesQuerySchema = z.object({
  folderId: z.string().optional(),
});

export const CreateSpaceBodySchema = z.object({
  name: z.string().min(1),
  folderId: z.string().nullable().optional(),
  emoji: z.string().nullable().optional(),
});

export const UpdateSpaceBodySchema = z.object({
  name: z.string().min(1).optional(),
  folderId: z.string().nullable().optional(),
  emoji: z.string().nullable().optional(),
});

export const SpaceDetailSchema = SpaceSchema.extend({
  sections: z.array(SpaceSectionSchema),
  progressStages: z.array(SpaceProgressStageSchema),
});

export type Space = z.infer<typeof SpaceSchema>;
export type SpaceDetail = z.infer<typeof SpaceDetailSchema>;
export type ListSpacesQuery = z.infer<typeof ListSpacesQuerySchema>;
export type CreateSpaceBody = z.infer<typeof CreateSpaceBodySchema>;
export type UpdateSpaceBody = z.infer<typeof UpdateSpaceBodySchema>;
