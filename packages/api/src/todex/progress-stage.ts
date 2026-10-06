import { z } from "zod";

import { ProgressStageTemplate } from "./enums.ts";
import { IsoDateTimeSchema } from "./iso.ts";

export const BoardProgressStageSchema = z.object({
  id: z.string(),
  boardId: z.string(),
  name: z.string(),
  position: z.number().int().nonnegative(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});

export const ProgressStageInputSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().trim().min(1).max(80),
});

export const ReplaceBoardProgressStagesBodySchema = z.object({
  stages: z.array(ProgressStageInputSchema).max(30),
});

export const ApplyProgressStageTemplateBodySchema = z.object({
  template: z.enum([ProgressStageTemplate.FOUNDER]),
});

export type BoardProgressStage = z.infer<typeof BoardProgressStageSchema>;
export type ProgressStageInput = z.infer<typeof ProgressStageInputSchema>;
export type ReplaceBoardProgressStagesBody = z.infer<
  typeof ReplaceBoardProgressStagesBodySchema
>;
export type ApplyProgressStageTemplateBody = z.infer<
  typeof ApplyProgressStageTemplateBodySchema
>;
