import { BadRequestException, Injectable } from "@nestjs/common";
import { DocType, FolderKind, type ProseDoc } from "@repo/api/todex";
import { z } from "zod";

import { DocsService } from "../../docs/docs.service";
import { FoldersService } from "../../folders/folders.service";
import type { ToolHandler } from "./tool-handler";

const docTypeSchema = z.enum([DocType.COMMON, DocType.GOAL]);

const folderNameSchema = z.string().trim().min(1).max(200);

const linkedTaskIdsSchema = z
  .array(z.string().trim().min(1).max(128))
  .max(100)
  .superRefine((taskIds, context) => {
    const seen = new Set<string>();
    for (const [index, taskId] of taskIds.entries()) {
      if (seen.has(taskId)) {
        context.addIssue({
          code: "custom",
          message: "Duplicate linked task",
          path: [index],
        });
      }
      seen.add(taskId);
    }
  });

@Injectable()
export class DocToolHandler {
  constructor(
    private readonly docs: DocsService,
    private readonly folders: FoldersService,
  ) {}

  handlers(): ToolHandler[] {
    return [
      {
        name: "list_docs",
        description: "List docs in the current workspace. Goals are docs with type goal.",
        parameters: z
          .object({
            type: docTypeSchema.optional(),
            folderId: z.string().min(1).optional(),
          })
          .strict(),
        handle: async ({ workspaceId, args }) => {
          const query = args as { type?: DocType; folderId?: string };
          return this.docs.list(workspaceId, query);
        },
      },
      {
        name: "get_doc",
        description: "Get one doc in the current workspace by id.",
        parameters: z.object({ docId: z.string().min(1) }).strict(),
        handle: async ({ workspaceId, args }) => {
          const { docId } = args as { docId: string };
          return this.docs.get(workspaceId, docId);
        },
      },
      {
        name: "create_doc",
        description:
          "Create a common doc or a goal in the current workspace. content is plain text. To file it, pass folderName of a docs folder or folderId from list_folders. Do not put the folder name in the title.",
        parameters: z
          .object({
            type: docTypeSchema,
            title: z.string().trim().min(1).max(200),
            folderId: z.string().min(1).nullable().optional(),
            folderName: folderNameSchema.optional(),
            content: z.string().max(20_000).optional(),
            linkedTaskIds: linkedTaskIdsSchema.optional(),
          })
          .strict()
          .superRefine((body, context) => {
            if (body.type === DocType.COMMON && body.linkedTaskIds) {
              context.addIssue({
                code: "custom",
                message: "Common docs cannot link tasks",
                path: ["linkedTaskIds"],
              });
            }
          }),
        handle: async ({ workspaceId, args }) => {
          const body = args as CreateDocArgs;
          const folderId = await this.resolveDocsFolderId(
            workspaceId,
            body.folderId,
            body.folderName,
          );
          if (body.type === DocType.COMMON) {
            return this.docs.create(workspaceId, {
              type: DocType.COMMON,
              title: body.title,
              ...(folderId !== undefined ? { folderId } : {}),
              ...(body.content !== undefined
                ? { body: { content: proseFromText(body.content) } }
                : {}),
            });
          }
          return this.docs.create(workspaceId, {
            type: DocType.GOAL,
            title: body.title,
            ...(folderId !== undefined ? { folderId } : {}),
            ...(body.linkedTaskIds !== undefined
              ? { linkedTaskIds: body.linkedTaskIds }
              : {}),
            ...(body.content !== undefined
              ? {
                  body: {
                    why: proseFromText(body.content),
                    successCriteria: [],
                    preconditions: [],
                  },
                }
              : {}),
          });
        },
      },
      {
        name: "update_doc",
        description:
          "Update a doc in the current workspace. content replaces the common doc text or a goal's why. Move it with folderName or a docs folderId from list_folders. folderId null removes it from its folder.",
        parameters: z
          .object({
            docId: z.string().min(1),
            title: z.string().trim().min(1).max(200).optional(),
            folderId: z.string().min(1).nullable().optional(),
            folderName: folderNameSchema.optional(),
            content: z.string().max(20_000).optional(),
            linkedTaskIds: linkedTaskIdsSchema.optional(),
          })
          .strict(),
        handle: async ({ workspaceId, args }) => {
          const body = args as UpdateDocArgs;
          if (
            body.title === undefined &&
            body.folderId === undefined &&
            body.folderName === undefined &&
            body.content === undefined &&
            body.linkedTaskIds === undefined
          ) {
            throw new BadRequestException("No changes");
          }
          const folderId = await this.resolveDocsFolderId(
            workspaceId,
            body.folderId,
            body.folderName,
          );
          const existing =
            body.content !== undefined
              ? await this.docs.get(workspaceId, body.docId)
              : null;
          return this.docs.update(workspaceId, body.docId, {
            ...(body.title !== undefined ? { title: body.title } : {}),
            ...(folderId !== undefined ? { folderId } : {}),
            ...(body.linkedTaskIds !== undefined
              ? { linkedTaskIds: body.linkedTaskIds }
              : {}),
            ...(body.content !== undefined && existing
              ? {
                  body:
                    existing.type === DocType.GOAL
                      ? { why: proseFromText(body.content) }
                      : { content: proseFromText(body.content) },
                }
              : {}),
          });
        },
      },
      {
        name: "delete_doc",
        description: "Delete a doc in the current workspace.",
        parameters: z.object({ docId: z.string().min(1) }).strict(),
        handle: async ({ workspaceId, args }) => {
          const { docId } = args as { docId: string };
          await this.docs.remove(workspaceId, docId);
          return { ok: true };
        },
      },
    ];
  }

  private async resolveDocsFolderId(
    workspaceId: string,
    folderId: string | null | undefined,
    folderName: string | undefined,
  ): Promise<string | null | undefined> {
    if (folderId !== undefined && folderName !== undefined) {
      throw new BadRequestException("Pass folderId or folderName, not both");
    }
    const requested = folderName ?? folderId;
    if (requested === undefined || requested === null) return requested;

    const docsFolders = await this.folders.list(workspaceId, FolderKind.DOCS);
    const byId = docsFolders.find((folder) => folder.id === requested);
    if (byId) return byId.id;

    const matches = docsFolders.filter((folder) => sameFolderName(folder.name, requested));
    if (matches.length === 1) return matches[0].id;
    if (matches.length > 1) {
      throw new BadRequestException(
        `Several docs folders are named "${requested}": ${matches.map((folder) => folder.id).join(", ")}`,
      );
    }

    const names = docsFolders.map((folder) => folder.name).join(", ") || "(none)";
    throw new BadRequestException(
      `No docs folder named "${requested}". Docs folders: ${names}`,
    );
  }
}

function sameFolderName(left: string, right: string): boolean {
  return left.localeCompare(right, undefined, { sensitivity: "accent" }) === 0;
}

function proseFromText(text: string): ProseDoc {
  const trimmed = text.trim();
  if (!trimmed) return { type: "doc", content: [] };
  return {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: trimmed }] }],
  };
}

interface CreateDocArgs {
  type: DocType;
  title: string;
  folderId?: string | null;
  folderName?: string;
  content?: string;
  linkedTaskIds?: string[];
}

interface UpdateDocArgs {
  docId: string;
  title?: string;
  folderId?: string | null;
  folderName?: string;
  content?: string;
  linkedTaskIds?: string[];
}
