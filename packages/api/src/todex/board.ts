import { z } from "zod";

import { BoardAreaSchema } from "./area.ts";
import { IsoDateTimeSchema } from "./iso.ts";
import { BoardProgressStageSchema } from "./progress-stage.ts";

export const TaskBoardSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  folderId: z.string().nullable(),
  name: z.string(),
  emoji: z.string().nullable(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});

export const ListTaskBoardsQuerySchema = z.object({
  folderId: z.string().optional(),
});

export const CreateTaskBoardBodySchema = z.object({
  name: z.string().min(1),
  folderId: z.string().nullable().optional(),
  emoji: z.string().nullable().optional(),
});

export const UpdateTaskBoardBodySchema = z.object({
  name: z.string().min(1).optional(),
  folderId: z.string().nullable().optional(),
  emoji: z.string().nullable().optional(),
});

export const TaskBoardDetailSchema = TaskBoardSchema.extend({
  areas: z.array(BoardAreaSchema),
  progressStages: z.array(BoardProgressStageSchema),
});

export type TaskBoard = z.infer<typeof TaskBoardSchema>;
export type TaskBoardDetail = z.infer<typeof TaskBoardDetailSchema>;
export type ListTaskBoardsQuery = z.infer<typeof ListTaskBoardsQuerySchema>;
export type CreateTaskBoardBody = z.infer<typeof CreateTaskBoardBodySchema>;
export type UpdateTaskBoardBody = z.infer<typeof UpdateTaskBoardBodySchema>;
