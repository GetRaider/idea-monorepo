import { z } from "zod";

import { WorkspaceMemberRole } from "./enums.ts";
import { IsoDateTimeSchema } from "./iso.ts";

export const WorkspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  taskSeq: z.number().int().nonnegative(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});

export const WorkspaceMemberSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  userId: z.string(),
  role: z.enum([WorkspaceMemberRole.OWNER, WorkspaceMemberRole.MEMBER]),
  createdAt: IsoDateTimeSchema,
});

export type Workspace = z.infer<typeof WorkspaceSchema>;
export type WorkspaceMember = z.infer<typeof WorkspaceMemberSchema>;
