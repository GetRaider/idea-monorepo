import { z } from "zod";

import { FolderKind } from "./enums.ts";
import { IsoDateTimeSchema } from "./iso.ts";

export const FolderSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  parentId: z.string().nullable(),
  kind: z.enum([FolderKind.TASKS, FolderKind.DOCS]),
  name: z.string(),
  emoji: z.string().nullable(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});

export const ListFoldersQuerySchema = z.object({
  kind: z.enum([FolderKind.TASKS, FolderKind.DOCS]).optional(),
});

export const CreateFolderBodySchema = z.object({
  name: z.string().min(1),
  kind: z.enum([FolderKind.TASKS, FolderKind.DOCS]).default(FolderKind.TASKS),
  parentId: z.string().nullable().optional(),
  emoji: z.string().nullable().optional(),
});

export const UpdateFolderBodySchema = z.object({
  name: z.string().min(1).optional(),
  parentId: z.string().nullable().optional(),
  emoji: z.string().nullable().optional(),
});

export type Folder = z.infer<typeof FolderSchema>;
export type ListFoldersQuery = z.infer<typeof ListFoldersQuerySchema>;
export type CreateFolderBody = z.infer<typeof CreateFolderBodySchema>;
export type UpdateFolderBody = z.infer<typeof UpdateFolderBodySchema>;
