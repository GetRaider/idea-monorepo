import { Injectable } from "@nestjs/common";
import { TaskPriority, TaskStatus } from "@repo/api/todex";
import { z } from "zod";

import { TasksService } from "../../tasks/tasks.service";
import type { ToolHandler } from "./tool-handler";

const DEFAULT_TASK_ESTIMATION_MINUTES = 30;

const taskStatusSchema = z.enum([
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.DONE,
  TaskStatus.CANCELLED,
]);

const taskPrioritySchema = z.enum([
  TaskPriority.LOW,
  TaskPriority.MEDIUM,
  TaskPriority.HIGH,
  TaskPriority.CRITICAL,
]);

@Injectable()
export class TaskToolHandler {
  constructor(private readonly tasks: TasksService) {}

  handlers(): ToolHandler[] {
    return [
      {
        name: "list_tasks",
        access: "read",
        description: "List tasks on a board in the current workspace.",
        parameters: z.object({ boardId: z.string().min(1) }).strict(),
        handle: async ({ workspaceId, args }) => {
          const { boardId } = args as { boardId: string };
          return this.tasks.list(workspaceId, { boardId });
        },
      },
      {
        name: "get_task",
        access: "read",
        description: "Get one task in the current workspace by id.",
        parameters: z.object({ taskId: z.string().min(1) }).strict(),
        handle: async ({ workspaceId, args }) => {
          const { taskId } = args as { taskId: string };
          return this.tasks.get(workspaceId, taskId);
        },
      },
      {
        name: "create_task",
        access: "write",
        description: "Create a task on a board in the current workspace.",
        parameters: z
          .object({
            taskBoardId: z.string().min(1),
            summary: z.string().min(1),
            description: z.string().optional(),
            status: taskStatusSchema.optional(),
            priority: taskPrioritySchema.optional(),
          })
          .strict(),
        handle: async ({ workspaceId, args }) => {
          const body = args as {
            taskBoardId: string;
            summary: string;
            description?: string;
            status?: (typeof TaskStatus)[keyof typeof TaskStatus];
            priority?: (typeof TaskPriority)[keyof typeof TaskPriority];
          };
          return this.tasks.create(workspaceId, {
            taskBoardId: body.taskBoardId,
            summary: body.summary,
            description: body.description ?? "",
            status: body.status,
            priority: body.priority,
            estimation: DEFAULT_TASK_ESTIMATION_MINUTES,
          });
        },
      },
      {
        name: "update_task",
        access: "write",
        description: "Update a task in the current workspace.",
        parameters: z
          .object({
            taskId: z.string().min(1),
            summary: z.string().min(1).optional(),
            description: z.string().optional(),
            status: taskStatusSchema.optional(),
            priority: taskPrioritySchema.optional(),
          })
          .strict(),
        handle: async ({ workspaceId, args }) => {
          const body = args as {
            taskId: string;
            summary?: string;
            description?: string;
            status?: (typeof TaskStatus)[keyof typeof TaskStatus];
            priority?: (typeof TaskPriority)[keyof typeof TaskPriority];
          };
          return this.tasks.update(workspaceId, body.taskId, {
            summary: body.summary,
            description: body.description,
            status: body.status,
            priority: body.priority,
          });
        },
      },
      {
        name: "delete_task",
        access: "write",
        description: "Delete a task in the current workspace.",
        parameters: z.object({ taskId: z.string().min(1) }).strict(),
        handle: async ({ workspaceId, args }) => {
          const { taskId } = args as { taskId: string };
          await this.tasks.remove(workspaceId, taskId);
          return { ok: true };
        },
      },
    ];
  }
}
