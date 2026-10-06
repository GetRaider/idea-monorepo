import { httpClient } from "@repo/api/helpers";
import {
  ApplyProgressStageTemplateBodySchema,
  BoardAreaSchema,
  BoardProgressStageSchema,
  CreateBoardAreaBodySchema,
  CreateDocBodySchema,
  CreateFolderBodySchema,
  CreateTaskBoardBodySchema,
  CreateTaskBodySchema,
  DocSchema,
  DocSummarySchema,
  FolderKind,
  FolderSchema,
  MoveTaskBodySchema,
  ReplaceBoardProgressStagesBodySchema,
  TaskBoardDetailSchema,
  TaskBoardSchema,
  TaskSchema,
  UpdateBoardAreaBodySchema,
  UpdateFolderBodySchema,
  UpdateTaskBoardBodySchema,
  UpdateDocBodySchema,
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
  method: "get" | "post" | "patch" | "put" | "delete",
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
    list: (kind: "tasks" | "docs" = FolderKind.TASKS) =>
      call("get", `/v1/folders?kind=${kind}`, z.array(FolderSchema)),
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
    get: (boardId: string) =>
      call("get", `/v1/boards/${boardId}`, TaskBoardDetailSchema),
    createArea: (boardId: string, body: unknown) =>
      call(
        "post",
        `/v1/boards/${boardId}/areas`,
        BoardAreaSchema,
        CreateBoardAreaBodySchema.parse(body),
      ),
    updateArea: (boardId: string, areaId: string, body: unknown) =>
      call(
        "patch",
        `/v1/boards/${boardId}/areas/${areaId}`,
        BoardAreaSchema,
        UpdateBoardAreaBodySchema.parse(body),
      ),
    removeArea: (boardId: string, areaId: string) =>
      call(
        "delete",
        `/v1/boards/${boardId}/areas/${areaId}`,
        z.object({ ok: z.boolean() }),
      ),
    replaceProgressStages: (boardId: string, body: unknown) =>
      call(
        "put",
        `/v1/boards/${boardId}/progress-stages`,
        z.array(BoardProgressStageSchema),
        ReplaceBoardProgressStagesBodySchema.parse(body),
      ),
    applyProgressStageTemplate: (boardId: string, body: unknown) =>
      call(
        "post",
        `/v1/boards/${boardId}/progress-stages/apply`,
        z.array(BoardProgressStageSchema),
        ApplyProgressStageTemplateBodySchema.parse(body),
      ),
  },
  tasks: {
    list: (
      query: { boardId: string } | { scheduleFrom: string; scheduleTo: string },
    ) => {
      const searchParams =
        "boardId" in query
          ? new URLSearchParams({ boardId: query.boardId })
          : new URLSearchParams({
              scheduleFrom: query.scheduleFrom,
              scheduleTo: query.scheduleTo,
            });
      return call(
        "get",
        `/v1/tasks?${searchParams.toString()}`,
        z.array(TaskSchema),
      );
    },
    create: (body: unknown) =>
      call("post", "/v1/tasks", TaskSchema, CreateTaskBodySchema.parse(body)),
    update: (taskId: string, body: unknown) =>
      call(
        "patch",
        `/v1/tasks/${taskId}`,
        TaskSchema,
        UpdateTaskBodySchema.parse(body),
      ),
    move: (taskId: string, body: unknown) =>
      call(
        "post",
        `/v1/tasks/${taskId}/move`,
        TaskSchema,
        MoveTaskBodySchema.parse(body),
      ),
    remove: (taskId: string) =>
      call("delete", `/v1/tasks/${taskId}`, z.object({ ok: z.boolean() })),
  },
  docs: {
    list: (query?: { type?: "common" | "goal"; folderId?: string }) => {
      const searchParams = new URLSearchParams();
      if (query?.type) searchParams.set("type", query.type);
      if (query?.folderId) searchParams.set("folderId", query.folderId);
      const suffix = searchParams.size > 0 ? `?${searchParams}` : "";
      return call("get", `/v1/docs${suffix}`, z.array(DocSummarySchema));
    },
    get: (docId: string) => call("get", `/v1/docs/${docId}`, DocSchema),
    create: (body: unknown) =>
      call("post", "/v1/docs", DocSchema, CreateDocBodySchema.parse(body)),
    update: (docId: string, body: unknown) =>
      call(
        "patch",
        `/v1/docs/${docId}`,
        DocSchema,
        UpdateDocBodySchema.parse(body),
      ),
    remove: (docId: string) =>
      call("delete", `/v1/docs/${docId}`, z.object({ ok: z.boolean() })),
  },
};
