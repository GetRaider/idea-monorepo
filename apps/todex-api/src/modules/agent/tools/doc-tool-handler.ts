import { BadRequestException, Injectable } from "@nestjs/common";
import { DocType, emptyGoalDocBody } from "@repo/api/todex";
import { z } from "zod";

import type { MessageCitation } from "../../../db/schema";
import { proseFromText } from "../../docs/prose-from-text";
import { DocsService } from "../../docs/docs.service";
import { DocFoldersService } from "../../folders/doc-folders.service";
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
    private readonly folders: DocFoldersService,
  ) {}

  handlers(): ToolHandler[] {
    return [
      {
        name: "list_docs",
        access: "read",
        description:
          "List docs in the current workspace. Goals are Planning goals stored with type goal, not Knowledge docs.",
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
        access: "read",
        description: "Get one doc in the current workspace by id.",
        parameters: z.object({ docId: z.string().min(1) }).strict(),
        handle: async ({ workspaceId, args }) => {
          const { docId } = args as { docId: string };
          return this.docs.get(workspaceId, docId);
        },
      },
      {
        name: "create_doc",
        access: "write",
        description:
          "Create a Knowledge doc (type common) or a Planning goal (type goal) in the current workspace. spaceId is required. content is plain text. To file a doc, pass folderName or folderId of a document folder in that space.",
        parameters: z
          .object({
            type: docTypeSchema,
            title: z.string().trim().min(1).max(200),
            spaceId: z.string().min(1),
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
        handle: async ({ workspaceId, args, sources }) => {
          const body = args as CreateDocArgs;
          const input = { sources };
          const folderId = await this.resolveDocsFolderId(
            workspaceId,
            body.spaceId,
            body.folderId,
            body.folderName,
          );
          if (body.type === DocType.COMMON) {
            return this.docs.create(workspaceId, {
              type: DocType.COMMON,
              title: body.title,
              spaceId: body.spaceId,
              ...(folderId !== undefined ? { folderId } : {}),
              ...(body.content !== undefined || input.sources?.length
                ? { body: { content: proseFromText(textWithSources(body.content, input.sources)) } }
                : {}),
            });
          }
          return this.docs.create(workspaceId, {
            type: DocType.GOAL,
            title: body.title,
            spaceId: body.spaceId,
            ...(folderId !== undefined ? { folderId } : {}),
            ...(body.linkedTaskIds !== undefined
              ? { linkedTaskIds: body.linkedTaskIds }
              : {}),
            ...(body.content !== undefined
              ? {
                  body: {
                    ...emptyGoalDocBody(),
                    why: proseFromText(textWithSources(body.content, input.sources)),
                  },
                }
              : {}),
          });
        },
      },
      {
        name: "update_doc",
        access: "write",
        description:
          "Update a Knowledge doc or Planning goal in the current workspace. content replaces the doc text or a goal's description. Move a doc with folderName or a docs folderId from list_folders. folderId null removes it from its folder.",
        parameters: z
          .object({
            docId: z.string().min(1),
            title: z.string().trim().min(1).max(200).optional(),
            spaceId: z.string().min(1).optional(),
            folderId: z.string().min(1).nullable().optional(),
            folderName: folderNameSchema.optional(),
            content: z.string().max(20_000).optional(),
            linkedTaskIds: linkedTaskIdsSchema.optional(),
          })
          .strict(),
        handle: async ({ workspaceId, args, sources }) => {
          const body = args as UpdateDocArgs;
          if (
            body.title === undefined &&
            body.spaceId === undefined &&
            body.folderId === undefined &&
            body.folderName === undefined &&
            body.content === undefined &&
            body.linkedTaskIds === undefined
          ) {
            throw new BadRequestException("No changes");
          }
          const existing =
            body.content !== undefined ||
            (body.spaceId === undefined &&
              (body.folderId !== undefined || body.folderName !== undefined))
              ? await this.docs.get(workspaceId, body.docId)
              : null;
          const spaceId = body.spaceId ?? existing?.spaceId;
          const folderId = await this.resolveDocsFolderId(
            workspaceId,
            spaceId,
            body.folderId,
            body.folderName,
          );
          return this.docs.update(workspaceId, body.docId, {
            ...(body.title !== undefined ? { title: body.title } : {}),
            ...(body.spaceId !== undefined ? { spaceId: body.spaceId } : {}),
            ...(folderId !== undefined ? { folderId } : {}),
            ...(body.linkedTaskIds !== undefined
              ? { linkedTaskIds: body.linkedTaskIds }
              : {}),
            ...(body.content !== undefined && existing
              ? {
                  body:
                    existing.type === DocType.GOAL
                      ? { why: proseFromText(textWithSources(body.content, sources)) }
                      : { content: proseFromText(textWithSources(body.content, sources)) },
                }
              : {}),
          });
        },
      },
      {
        name: "delete_doc",
        access: "write",
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
    spaceId: string | undefined,
    folderId: string | null | undefined,
    folderName: string | undefined,
  ): Promise<string | null | undefined> {
    if (folderId !== undefined && folderName !== undefined) {
      throw new BadRequestException("Pass folderId or folderName, not both");
    }
    const requested = folderName ?? folderId;
    if (requested === undefined || requested === null) return requested;
    if (!spaceId) {
      throw new BadRequestException("spaceId is required to choose a folder");
    }

    const docsFolders = await this.folders.list(workspaceId, spaceId);
    const byId = docsFolders.find((folder) => folder.id === requested);
    if (byId) return byId.id;

    const matches = docsFolders.filter((folder) =>
      sameFolderName(folder.name, requested),
    );
    if (matches.length === 1) return matches[0].id;
    if (matches.length > 1) {
      throw new BadRequestException(
        `Several docs folders are named "${requested}": ${matches.map((folder) => folder.id).join(", ")}`,
      );
    }

    const names =
      docsFolders.map((folder) => folder.name).join(", ") || "(none)";
    throw new BadRequestException(
      `No docs folder named "${requested}". Docs folders: ${names}`,
    );
  }
}

function textWithSources(content: string | undefined, sources: MessageCitation[] | undefined): string {
  const base = content ?? "";
  const fresh = (sources ?? []).filter((source) => source.url && !base.includes(source.url));
  if (fresh.length === 0) return base;
  const lines = fresh.map((source) => `${source.title} ${source.url}`.trim());
  return `${base}\n\nSources\n${lines.join("\n")}`.trim();
}

function sameFolderName(left: string, right: string): boolean {
  return left.localeCompare(right, undefined, { sensitivity: "accent" }) === 0;
}

interface CreateDocArgs {
  type: DocType;
  title: string;
  spaceId: string;
  folderId?: string | null;
  folderName?: string;
  content?: string;
  linkedTaskIds?: string[];
}

interface UpdateDocArgs {
  docId: string;
  title?: string;
  spaceId?: string;
  folderId?: string | null;
  folderName?: string;
  content?: string;
  linkedTaskIds?: string[];
}
