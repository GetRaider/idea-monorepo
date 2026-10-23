import { Injectable } from "@nestjs/common";
import { FolderKind } from "@repo/api/todex";
import { z } from "zod";

import { FoldersService } from "../../folders/folders.service";
import type { ToolHandler } from "./tool-handler";

const folderKindSchema = z.enum([FolderKind.DOCS, FolderKind.TASKS]);

@Injectable()
export class FolderToolHandler {
  constructor(private readonly folders: FoldersService) {}

  handlers(): ToolHandler[] {
    return [
      {
        name: "list_folders",
        access: "read",
        description:
          "List folders in the current workspace. Pass kind docs before filing a doc, or kind tasks before filing a task. Use the returned id as folderId.",
        parameters: z
          .object({
            kind: folderKindSchema.optional(),
          })
          .strict(),
        handle: async ({ workspaceId, args }) => {
          const { kind } = args as { kind?: (typeof FolderKind)[keyof typeof FolderKind] };
          return this.folders.list(workspaceId, kind);
        },
      },
    ];
  }
}
