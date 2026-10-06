import { z } from "zod";

import { IsoDateTimeSchema } from "./iso.ts";

export const BoardAreaSchema = z.object({
  id: z.string(),
  boardId: z.string(),
  name: z.string(),
  position: z.number().int().nonnegative(),
  isDefault: z.boolean(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});

export const CreateBoardAreaBodySchema = z.object({
  name: z.string().trim().min(1).max(80),
});

export const UpdateBoardAreaBodySchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    position: z.number().int().nonnegative().optional(),
  })
  .refine((value) => value.name !== undefined || value.position !== undefined, {
    message: "Provide a name or a position",
  });

export type BoardArea = z.infer<typeof BoardAreaSchema>;
export type CreateBoardAreaBody = z.infer<typeof CreateBoardAreaBodySchema>;
export type UpdateBoardAreaBody = z.infer<typeof UpdateBoardAreaBodySchema>;
