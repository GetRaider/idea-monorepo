import {
  BadRequestException,
  ForbiddenException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import {
  CreateTaskBodySchema,
  DocType,
  ListTasksQuerySchema,
  UpdateTaskBodySchema,
} from "@repo/api/todex";
import type { ZodError, ZodType } from "zod";
import { z } from "zod";

import { rejectWorkspaceArgument } from "../agent/guardrails/reject-workspace-argument";
import { proseFromText } from "../docs/prose-from-text";
import type { DocsService } from "../docs/docs.service";
import type { SpacesService } from "../spaces/spaces.service";
import type { TasksService } from "../tasks/tasks.service";
import type { ExecutionResultsService } from "./execution-results.service";
import { hasScope, type McpCaller } from "./mcp-auth";
import { KnowledgeSearchError, type KnowledgeSearch } from "./knowledge-search";
import { omitActualTime } from "./omit-actual-time";
import type { TaskContextService } from "./task-context.service";

const httpUrl = z
  .string()
  .max(2_000)
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }, "Must be an http(s) URL");

export const searchKnowledgeSchema = z
  .object({ query: z.string().trim().min(1).max(500) })
  .strict();

export const getDocumentSchema = z.object({ docId: z.string().min(1) }).strict();

export const createDocumentSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    content: z.string().max(20_000).optional(),
    folderId: z.string().min(1).nullable().optional(),
  })
  .strict();

export const updateDocumentSchema = z
  .object({
    docId: z.string().min(1),
    title: z.string().trim().min(1).max(200).optional(),
    content: z.string().max(20_000).optional(),
    folderId: z.string().min(1).nullable().optional(),
  })
  .strict();

export const listTasksSchema = ListTasksQuerySchema.strict();

export const getTaskSchema = z.object({ taskId: z.string().min(1) }).strict();

export const createTaskSchema = CreateTaskBodySchema.strict();

export const updateTaskSchema = UpdateTaskBodySchema.extend({
  taskId: z.string().min(1),
}).strict();

export const getTaskContextSchema = z
  .object({ taskId: z.string().min(1) })
  .strict();

export const submitExecutionResultSchema = z
  .object({
    taskId: z.string().min(1),
    summary: z.string().trim().min(1).max(8_000),
    outcome: z.enum(["implemented", "blocked", "partial"]),
    artifactUrls: z.array(httpUrl).max(20).optional(),
    decisions: z.string().max(8_000).optional(),
  })
  .strict();

export async function callMcpTool(
  deps: McpToolDeps,
  caller: McpCaller,
  name: string,
  args: unknown,
  logger?: Logger,
): Promise<McpToolPayload> {
  const tool = TOOLS.find((entry) => entry.name === name);
  if (!tool) return toolError(`Unknown tool: ${name}`);
  if (tool.access === "write" && !hasScope(caller, "todex:write")) {
    return toolError("Missing scope todex:write");
  }
  if (tool.access === "read" && !hasScope(caller, "todex:read")) {
    return toolError("Missing scope todex:read");
  }
  const rejected = rejectWorkspaceArgument(args);
  if (rejected) return toolError(rejected);
  const parsed = tool.schema.safeParse(args);
  if (!parsed.success) return toolError(formatZod(parsed.error));
  if (name === "update_document" || name === "update_task") {
    if (!hasChange(parsed.data, name === "update_task" ? "taskId" : "docId")) {
      return toolError("No changes");
    }
  }
  try {
    const data = await tool.handle(deps, caller, parsed.data);
    return { isError: false, data: omitActualTime(data) };
  } catch (error) {
    if (error instanceof KnowledgeSearchError) return toolError(error.message);
    if (error instanceof BadRequestException) {
      return toolError(error.message);
    }
    if (
      error instanceof ForbiddenException ||
      error instanceof NotFoundException
    ) {
      return toolError("Not found");
    }
    logger?.error(
      `${name} ${caller.userId} ${caller.workspaceId} ${error instanceof Error ? error.name : "Error"}`,
    );
    return toolError("Tool failed");
  }
}

function hasChange(value: unknown, idKey: string): boolean {
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(
    ([key, field]) => key !== idKey && field !== undefined,
  );
}

function formatZod(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join(".") || "input";
      return `${path}: ${issue.message}`;
    })
    .join("; ");
}

function toolError(text: string): McpToolPayload {
  return { isError: true, data: text };
}

function documentView(doc: {
  id: string;
  type: string;
  docKey: string;
  title: string;
  folderId?: string | null;
  updatedAt: string;
  body: unknown;
}): Record<string, unknown> {
  const plain = plainFromBody(doc.body);
  const text = plain.slice(0, 24_000);
  return {
    id: doc.id,
    type: doc.type,
    docKey: doc.docKey,
    title: doc.title,
    folderId: doc.folderId ?? null,
    plainText: text,
    truncated: plain.length > 24_000,
    updatedAt: doc.updatedAt,
  };
}

function plainFromBody(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const record = body as Record<string, unknown>;
  const prose = record.content ?? record.why;
  return proseText(prose);
}

function proseText(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const parts: string[] = [];
  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    const record = node as { text?: unknown; content?: unknown };
    if (typeof record.text === "string") parts.push(record.text);
    if (Array.isArray(record.content)) {
      for (const child of record.content) walk(child);
    }
  };
  walk(value);
  return parts.join("");
}

const TOOLS: McpTool[] = [
  {
    name: "search_knowledge",
    access: "read",
    description: "Search Knowledge documents in the caller's workspace.",
    schema: searchKnowledgeSchema,
    handle: async (deps, caller, args) => {
      const { query } = args as z.infer<typeof searchKnowledgeSchema>;
      return deps.knowledge.search(caller.workspaceId, query);
    },
  },
  {
    name: "get_document",
    access: "read",
    description: "Get one Knowledge or goal document by id.",
    schema: getDocumentSchema,
    handle: async (deps, caller, args) => {
      const { docId } = args as z.infer<typeof getDocumentSchema>;
      const doc = await deps.docs.get(caller.workspaceId, docId);
      return documentView(doc);
    },
  },
  {
    name: "create_document",
    access: "write",
    description: "Create a Knowledge document (common). content is plain text.",
    schema: createDocumentSchema,
    handle: async (deps, caller, args) => {
      const body = args as z.infer<typeof createDocumentSchema>;
      const doc = await deps.docs.create(caller.workspaceId, {
        type: DocType.COMMON,
        title: body.title,
        ...(body.folderId !== undefined ? { folderId: body.folderId } : {}),
        ...(body.content !== undefined
          ? { body: { content: proseFromText(body.content) } }
          : {}),
      });
      return documentView(doc);
    },
  },
  {
    name: "update_document",
    access: "write",
    description: "Update a document title, plain-text content, or folder.",
    schema: updateDocumentSchema,
    handle: async (deps, caller, args) => {
      const body = args as z.infer<typeof updateDocumentSchema>;
      const existing =
        body.content !== undefined
          ? await deps.docs.get(caller.workspaceId, body.docId)
          : null;
      const doc = await deps.docs.update(caller.workspaceId, body.docId, {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.folderId !== undefined ? { folderId: body.folderId } : {}),
        ...(body.content !== undefined && existing
          ? {
              body:
                existing.type === DocType.GOAL
                  ? { why: proseFromText(body.content) }
                  : { content: proseFromText(body.content) },
            }
          : {}),
      });
      return documentView(doc);
    },
  },
  {
    name: "list_spaces",
    access: "read",
    description: "List spaces in the caller's workspace.",
    schema: z.object({}).strict(),
    handle: async (deps, caller) => deps.spaces.list(caller.workspaceId),
  },
  {
    name: "list_tasks",
    access: "read",
    description:
      "List tasks by spaceId, epicId, or a scheduleFrom and scheduleTo range.",
    schema: listTasksSchema,
    handle: async (deps, caller, args) =>
      deps.tasks.list(
        caller.workspaceId,
        args as z.infer<typeof listTasksSchema>,
      ),
  },
  {
    name: "get_task",
    access: "read",
    description: "Get one task by id, including planning fields.",
    schema: getTaskSchema,
    handle: async (deps, caller, args) => {
      const { taskId } = args as z.infer<typeof getTaskSchema>;
      return deps.tasks.get(caller.workspaceId, taskId);
    },
  },
  {
    name: "create_task",
    access: "write",
    description:
      "Create a task. estimation is required and is a positive number of minutes.",
    schema: createTaskSchema,
    handle: async (deps, caller, args) =>
      deps.tasks.create(
        caller.workspaceId,
        args as z.infer<typeof createTaskSchema>,
      ),
  },
  {
    name: "update_task",
    access: "write",
    description:
      "Update task fields. Status changes only when status is included.",
    schema: updateTaskSchema,
    handle: async (deps, caller, args) => {
      const { taskId, ...body } = args as z.infer<typeof updateTaskSchema> & {
        taskId: string;
      };
      return deps.tasks.update(caller.workspaceId, taskId, body);
    },
  },
  {
    name: "get_task_context",
    access: "read",
    description:
      "Get one task plus its goal, mentioning docs, epic, parent, recent execution results, and retrieved knowledge.",
    schema: getTaskContextSchema,
    handle: async (deps, caller, args) => {
      const { taskId } = args as z.infer<typeof getTaskContextSchema>;
      return deps.context.get(caller.workspaceId, taskId);
    },
  },
  {
    name: "submit_execution_result",
    access: "write",
    description:
      "Attach an implementation summary to a task. Does not change task status.",
    schema: submitExecutionResultSchema,
    handle: async (deps, caller, args) => {
      const body = args as z.infer<typeof submitExecutionResultSchema>;
      await deps.tasks.get(caller.workspaceId, body.taskId);
      return deps.results.insert({
        workspaceId: caller.workspaceId,
        taskId: body.taskId,
        userId: caller.userId,
        summary: body.summary,
        outcome: body.outcome,
        artifactUrls: body.artifactUrls ?? [],
        decisions: body.decisions ?? "",
      });
    },
  },
];

export const MCP_TOOL_DEFINITIONS = TOOLS.map((tool) => ({
  name: tool.name,
  description: tool.description,
  schema: tool.schema,
  access: tool.access,
}));

interface McpTool {
  name: string;
  description: string;
  access: "read" | "write";
  schema: ZodType;
  handle: (
    deps: McpToolDeps,
    caller: McpCaller,
    args: unknown,
  ) => Promise<unknown>;
}

export interface McpToolDeps {
  docs: DocsService;
  tasks: TasksService;
  spaces: SpacesService;
  knowledge: KnowledgeSearch;
  context: TaskContextService;
  results: ExecutionResultsService;
}

export interface McpToolPayload {
  isError: boolean;
  data: unknown;
}
