import { httpClient } from "@repo/api/helpers";
import {
  CreateFolderBodySchema,
  CreateTaskBoardBodySchema,
  CreateTaskBodySchema,
  FolderSchema,
  TaskBoardSchema,
  TaskSchema,
  UpdateFolderBodySchema,
  UpdateTaskBoardBodySchema,
  UpdateTaskBodySchema,
  WorkspaceSchema,
} from "@repo/api/todex";
import { z } from "zod";

import { env } from "./env";

const WorkspaceListSchema = z.object({
  workspace: WorkspaceSchema,
  members: z.array(z.unknown()),
});

async function call<T>(
  method: "get" | "post" | "patch" | "delete",
  path: string,
  schema: z.ZodType<T>,
  body?: unknown,
): Promise<T> {
  const response = await httpClient[method]<unknown>({
    url: `${env.api.baseUrl}${path}`,
    body,
    withCredentials: true,
    headers: { "Content-Type": "application/json", Accept: "application/json" },
  });
  if (response.status >= 400) {
    throw new Error(`Request failed (${response.status})`);
  }
  return schema.parse(response.data);
}

export const todexClient = {
  workspaces: {
    list: () => call("get", "/v1/workspaces", WorkspaceListSchema),
  },
  folders: {
    list: () => call("get", "/v1/folders?kind=tasks", z.array(FolderSchema)),
    create: (body: unknown) =>
      call(
        "post",
        "/v1/folders",
        FolderSchema,
        CreateFolderBodySchema.parse(body),
      ),
    update: (folderId: string, body: unknown) =>
      call(
        "patch",
        `/v1/folders/${folderId}`,
        FolderSchema,
        UpdateFolderBodySchema.parse(body),
      ),
    remove: (folderId: string) =>
      call("delete", `/v1/folders/${folderId}`, z.object({ ok: z.boolean() })),
  },
  boards: {
    list: () => call("get", "/v1/boards", z.array(TaskBoardSchema)),
    create: (body: unknown) =>
      call(
        "post",
        "/v1/boards",
        TaskBoardSchema,
        CreateTaskBoardBodySchema.parse(body),
      ),
    update: (boardId: string, body: unknown) =>
      call(
        "patch",
        `/v1/boards/${boardId}`,
        TaskBoardSchema,
        UpdateTaskBoardBodySchema.parse(body),
      ),
    remove: (boardId: string) =>
      call("delete", `/v1/boards/${boardId}`, z.object({ ok: z.boolean() })),
  },
  tasks: {
    list: (boardId: string) =>
      call(
        "get",
        `/v1/tasks?boardId=${encodeURIComponent(boardId)}`,
        z.array(TaskSchema),
      ),
    create: (body: unknown) =>
      call("post", "/v1/tasks", TaskSchema, CreateTaskBodySchema.parse(body)),
    update: (taskId: string, body: unknown) =>
      call(
        "patch",
        `/v1/tasks/${taskId}`,
        TaskSchema,
        UpdateTaskBodySchema.parse(body),
      ),
    remove: (taskId: string) =>
      call("delete", `/v1/tasks/${taskId}`, z.object({ ok: z.boolean() })),
  },
};
