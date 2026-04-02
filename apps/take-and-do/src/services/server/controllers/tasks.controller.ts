import { z } from "zod";

import {
  getAccessByAuth,
  requireAiAccess,
  requireAuth,
  requireNonAnonymous,
} from "@/auth/guards";
import {
  OptimizeTasksResponseDto,
  TaskByKeyResponseDto,
  TaskCreateResponseDto,
  TaskDeleteSuccessResponseDto,
  TaskListResponseDto,
  TaskPatchBodySchema,
  TaskPostBodySchema,
  TaskResponseDto,
  TasksDeletedCountResponseDto,
  OptimizeTasksDto,
} from "@/db/dtos";
import { BadRequestError, NotFoundError } from "@/lib/api/errors";
import { apiServices } from "@/services/server/api";

import { BaseController, InputType } from "./base.controller";

const taskIdParamsSchema = z.object({ id: z.string() });

const taskKeyParamsSchema = z.object({ taskKey: z.string() });

const taskPatchMergedSchema = z
  .object({ id: z.string(), json: z.unknown() })
  .transform(({ id, json }) => ({
    id,
    ...TaskPatchBodySchema.parse(json),
  }));

const deleteTasksForBoardQuerySchema = z.object({
  taskBoardId: z.string().min(1),
});

export class TasksController extends BaseController {
  list = this.createRoute({
    responseDto: TaskListResponseDto,
    handler: async ({ request }) => {
      const auth = await requireAuth();
      const access = getAccessByAuth(auth);
      const { searchParams } = new URL(request.url);
      const taskBoardId = searchParams.get("taskBoardId");
      const date = searchParams.get("date");

      if (taskBoardId)
        return apiServices.tasks.getByBoardId(taskBoardId, access);

      if (date) {
        const parts = date.split("-");
        if (parts.length !== 3)
          throw new BadRequestError("Invalid date format. Expected YYYY-MM-DD");
        const parsed = new Date(
          parseInt(parts[0], 10),
          parseInt(parts[1], 10) - 1,
          parseInt(parts[2], 10),
        );
        if (isNaN(parsed.getTime()))
          throw new BadRequestError("Invalid date format");
        return apiServices.tasks.getByDate(parsed, access);
      }

      return apiServices.tasks.getAll(access);
    },
  });

  create = this.createRoute({
    requestDto: TaskPostBodySchema,
    inputType: InputType.Body,
    responseDto: TaskCreateResponseDto,
    status: 201,
    handler: async ({ input }) => {
      const auth = await requireAuth();
      const access = getAccessByAuth(auth);

      if (input.shouldUseAI) await requireAiAccess();

      const result = await apiServices.tasks.create(input, access);

      if (result.composed) return result.composed;

      if (!result.task) {
        throw new Error("Unexpected create result: missing task");
      }

      return access.isAnonymous
        ? { ...result.task, guest: true as const }
        : result.task;
    },
  });

  deleteAllForBoard = this.createRoute({
    requestDto: deleteTasksForBoardQuerySchema,
    inputType: InputType.Query,
    responseDto: TasksDeletedCountResponseDto,
    handler: async ({ input }) => {
      const auth = await requireNonAnonymous();
      const access = getAccessByAuth(auth);
      const deleted = await apiServices.tasks.deleteAllForBoard(
        input.taskBoardId,
        access,
      );
      return { deleted };
    },
  });

  getById = this.createRoute({
    requestDto: taskIdParamsSchema,
    inputType: InputType.Params,
    responseDto: TaskResponseDto,
    handler: async ({ input }) => {
      const auth = await requireAuth();
      const access = getAccessByAuth(auth);
      const task = await apiServices.tasks.getById(input.id, access);
      if (!task) throw new NotFoundError("Task");
      return task;
    },
  });

  update = this.createRoute({
    responseDto: TaskResponseDto,
    handler: async ({ request, context }) => {
      const auth = await requireNonAnonymous();
      const access = getAccessByAuth(auth);
      const params = await Promise.resolve(context.params);
      const { id } = taskIdParamsSchema.parse(params);
      const json = await request.json();
      const body = taskPatchMergedSchema.parse({ id, json });
      const { id: taskId, ...updateData } = body;
      const updatedTask = await apiServices.tasks.update(
        taskId,
        updateData,
        access,
      );
      if (!updatedTask) throw new NotFoundError("Task");
      return updatedTask;
    },
  });

  delete = this.createRoute({
    requestDto: taskIdParamsSchema,
    inputType: InputType.Params,
    responseDto: TaskDeleteSuccessResponseDto,
    handler: async ({ input }) => {
      const auth = await requireNonAnonymous();
      const access = getAccessByAuth(auth);
      await apiServices.tasks.delete(input.id, access);
      return { success: true };
    },
  });

  getByKey = this.createRoute({
    requestDto: taskKeyParamsSchema,
    inputType: InputType.Params,
    responseDto: TaskByKeyResponseDto,
    handler: async ({ input }) => {
      const auth = await requireAuth();
      const access = getAccessByAuth(auth);
      const result = await apiServices.tasks.getByKey(input.taskKey, access);
      if (!result) throw new NotFoundError("Task");
      return result;
    },
  });

  optimize = this.createRoute({
    requestDto: OptimizeTasksDto,
    inputType: InputType.Body,
    responseDto: OptimizeTasksResponseDto,
    handler: async ({ input }) => {
      const auth = await requireAiAccess();
      const access = getAccessByAuth(auth);
      return apiServices.tasks.optimize(input.taskIds, access);
    },
  });
}
