import { z } from "zod";

import { IsoDateTimeSchema } from "./iso.ts";

export const DocFolderSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  spaceId: z.string(),
  name: z.string(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});

export const ListDocFoldersQuerySchema = z.object({
  spaceId: z.string().min(1).optional(),
});

export const CreateDocFolderBodySchema = z
  .object({
    name: z.string().min(1),
    spaceId: z.string().min(1),
  })
  .strict();

export const UpdateDocFolderBodySchema = z
  .object({
    name: z.string().min(1),
  })
  .strict();

export type DocFolder = z.infer<typeof DocFolderSchema>;
export type ListDocFoldersQuery = z.infer<typeof ListDocFoldersQuerySchema>;
export type CreateDocFolderBody = z.infer<typeof CreateDocFolderBodySchema>;
export type UpdateDocFolderBody = z.infer<typeof UpdateDocFolderBodySchema>;
