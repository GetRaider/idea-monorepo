import { Injectable } from "@nestjs/common";
import { z } from "zod";

import { DocFoldersService } from "../../folders/doc-folders.service";
import { SpaceFoldersService } from "../../folders/space-folders.service";
import type { ToolHandler } from "./tool-handler";

@Injectable()
export class FolderToolHandler {
  constructor(
    private readonly spaceFolders: SpaceFoldersService,
    private readonly docFolders: DocFoldersService,
  ) {}

  handlers(): ToolHandler[] {
    return [
      {
        name: "list_folders",
        access: "read",
        description:
          "List space folders, or document folders inside one space. Pass spaceId to list document folders. Use a document folder id as folderId only with that same spaceId.",
        parameters: z
          .object({
            spaceId: z.string().min(1).optional(),
          })
          .strict(),
        handle: async ({ workspaceId, args }) => {
          const { spaceId } = args as { spaceId?: string };
          if (spaceId) return this.docFolders.list(workspaceId, spaceId);
          return this.spaceFolders.list(workspaceId);
        },
      },
    ];
  }
}
