import { httpClient } from "@repo/api/helpers";
import {
  ApplyProgressStageTemplateBodySchema,
  BoardAreaSchema,
  BoardProgressStageSchema,
  CalendarEventSchema,
  CalendarEventTemplateSchema,
  CreateBoardAreaBodySchema,
  CreateCalendarEventBodySchema,
  CreateCalendarEventTemplateBodySchema,
  CreateDocBodySchema,
  CreateFolderBodySchema,
  CreateTaskBoardBodySchema,
  CreateTaskBodySchema,
  DocSchema,
  DocSummarySchema,
  EnqueueExecutionBodySchema,
  ExecuteTaskBodySchema,
  ExecutionActivitySchema,
  ExecutionCurrentSchema,
  ExecutionSessionSchema,
  ExecutionStateSchema,
  ExecutionSuggestionSchema,
  FocusExecutionTaskBodySchema,
  ReorderExecutionQueueBodySchema,
  UpdateExecutionSessionBodySchema,
  FolderKind,
  GoogleCalendarIntegrationSchema,
  FolderSchema,
  MoveTaskBodySchema,
  ReplaceBoardProgressStagesBodySchema,
  TaskBoardDetailSchema,
  TaskBoardSchema,
  TaskSchema,
  UpdateBoardAreaBodySchema,
  UpdateFolderBodySchema,
  UpdateTaskBoardBodySchema,
  UpdateCalendarEventBodySchema,
  UpdateCalendarEventTemplateBodySchema,
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
    throw new Error(readError(response.data) ?? `Request failed (${response.status})`);
  }
  return schema.parse(response.data);
}

function readError(data: unknown): string | null {
  if (!data || typeof data !== "object" || !("message" in data)) return null;
  const message = data.message;
  if (typeof message === "string" && message.trim()) return message;
  if (Array.isArray(message)) {
    const text = message.filter((item) => typeof item === "string").join(", ");
    return text || null;
  }
  return null;
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
  execution: {
    state: () => call("get", "/v1/execution", ExecutionStateSchema),
    sessions: () =>
      call("get", "/v1/execution/sessions", z.array(ExecutionSessionSchema)),
    activity: (query: {
      from: string;
      to: string;
      timeZone: string;
      boardId?: string;
    }) => {
      const params = new URLSearchParams({
        from: query.from,
        to: query.to,
        timeZone: query.timeZone,
      });
      if (query.boardId) params.set("boardId", query.boardId);
      return call(
        "get",
        `/v1/execution/activity?${params}`,
        ExecutionActivitySchema,
      );
    },
    updateSession: (sessionId: string, body: unknown) =>
      call(
        "patch",
        `/v1/execution/sessions/${sessionId}`,
        z.array(ExecutionSessionSchema),
        UpdateExecutionSessionBodySchema.parse(body),
      ),
    deleteSession: (sessionId: string) =>
      call("delete", `/v1/execution/sessions/${sessionId}`, z.object({ ok: z.literal(true) })),
    suggestions: () =>
      call(
        "get",
        "/v1/execution/suggestions",
        z.array(ExecutionSuggestionSchema),
      ),
    preview: (body: unknown) =>
      call(
        "post",
        "/v1/execution/preview",
        z.array(ExecutionCurrentSchema),
        ExecuteTaskBodySchema.parse(body),
      ),
    execute: (body: unknown) =>
      call(
        "post",
        "/v1/execution/execute",
        ExecutionStateSchema,
        ExecuteTaskBodySchema.parse(body),
      ),
    enqueue: (body: unknown) =>
      call(
        "post",
        "/v1/execution/queue",
        ExecutionStateSchema,
        EnqueueExecutionBodySchema.parse(body),
      ),
    removeQueued: (taskId: string) =>
      call(
        "delete",
        `/v1/execution/queue/${taskId}`,
        ExecutionStateSchema,
      ),
    reorder: (body: unknown) =>
      call(
        "post",
        "/v1/execution/queue/reorder",
        ExecutionStateSchema,
        ReorderExecutionQueueBodySchema.parse(body),
      ),
    focus: (body: unknown) =>
      call(
        "post",
        "/v1/execution/focus",
        ExecutionStateSchema,
        FocusExecutionTaskBodySchema.parse(body),
      ),
    pause: () => call("post", "/v1/execution/pause", ExecutionStateSchema),
    resume: () => call("post", "/v1/execution/resume", ExecutionStateSchema),
    complete: () => call("post", "/v1/execution/complete", ExecutionStateSchema),
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
  calendar: {
    events: {
      list: (query: { from: string; to: string }) =>
        call(
          "get",
          `/v1/calendar/events?from=${encodeURIComponent(query.from)}&to=${encodeURIComponent(query.to)}`,
          z.array(CalendarEventSchema),
        ),
      get: (eventId: string) =>
        call("get", `/v1/calendar/events/${eventId}`, CalendarEventSchema),
      create: (body: unknown) =>
        call(
          "post",
          "/v1/calendar/events",
          CalendarEventSchema,
          CreateCalendarEventBodySchema.parse(body),
        ),
      update: (eventId: string, body: unknown) =>
        call(
          "patch",
          `/v1/calendar/events/${eventId}`,
          CalendarEventSchema,
          UpdateCalendarEventBodySchema.parse(body),
        ),
      remove: (
        eventId: string,
        query?: { scope?: "instance" | "series"; originalStart?: string },
      ) => {
        const search = new URLSearchParams();
        if (query?.scope) search.set("scope", query.scope);
        if (query?.originalStart) search.set("originalStart", query.originalStart);
        const suffix = search.size > 0 ? `?${search}` : "";
        return call(
          "delete",
          `/v1/calendar/events/${eventId}${suffix}`,
          z.object({ ok: z.boolean() }),
        );
      },
    },
    templates: {
      list: () =>
        call(
          "get",
          "/v1/calendar/templates",
          z.array(CalendarEventTemplateSchema),
        ),
      create: (body: unknown) =>
        call(
          "post",
          "/v1/calendar/templates",
          CalendarEventTemplateSchema,
          CreateCalendarEventTemplateBodySchema.parse(body),
        ),
      update: (templateId: string, body: unknown) =>
        call(
          "patch",
          `/v1/calendar/templates/${templateId}`,
          CalendarEventTemplateSchema,
          UpdateCalendarEventTemplateBodySchema.parse(body),
        ),
      remove: (templateId: string) =>
        call(
          "delete",
          `/v1/calendar/templates/${templateId}`,
          z.object({ ok: z.boolean() }),
        ),
    },
    google: {
      status: () =>
        call("get", "/v1/calendar/google", GoogleCalendarIntegrationSchema),
      sync: () =>
        call("post", "/v1/calendar/google/sync", GoogleCalendarIntegrationSchema),
      disconnect: () =>
        call("delete", "/v1/calendar/google", GoogleCalendarIntegrationSchema),
    },
  },
};
