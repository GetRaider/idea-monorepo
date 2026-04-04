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
import { BadRequestError, HttpError, NotFoundError } from "@/lib/api/errors";
import { apiServices } from "@/server/services/api";

import { BaseController } from "./base.controller";
import { tasksHelper } from "@/helpers/task.helper";

const taskIdParamsSchema = z.object({ id: z.string() });

const taskKeyParamsSchema = z.object({ taskKey: z.string() });

const TaskListQueryDto = z.object({
  taskBoardId: z.string().min(1).optional(),
  date: z.string().min(1).optional(),
});

const deleteTasksForBoardQuerySchema = z.object({
  taskBoardId: z.string().min(1),
});

export class TasksController extends BaseController {
  getAll = this.initRoute({
    queryDto: TaskListQueryDto,
    responseDto: TaskListResponseDto,
    handler: async ({ query }) => {
      const auth = await requireAuth();
      const access = getAccessByAuth(auth);
      const { taskBoardId, date } = query;
      if (taskBoardId) {
        return apiServices.tasks.getByBoardId(taskBoardId, access);
      }

      if (date) {
        const parsed = tasksHelper.date.parseCalendarDay(date);

        if (!parsed) throw new BadRequestError("Invalid date format");

        return apiServices.tasks.getByDate(parsed!, access);
      }

      return apiServices.tasks.getAll(access);
    },
  });

  getById = this.initRoute({
    paramsDto: taskIdParamsSchema,
    responseDto: TaskResponseDto,
    handler: async ({ params: { id } }) => {
      const auth = await requireAuth();
      const access = getAccessByAuth(auth);
      const task = await apiServices.tasks.getById(id, access);
      if (!task) throw new NotFoundError("Task");
      return task;
    },
  });

  getByKey = this.initRoute({
    paramsDto: taskKeyParamsSchema,
    responseDto: TaskByKeyResponseDto,
    handler: async ({ params }) => {
      const auth = await requireAuth();
      const access = getAccessByAuth(auth);
      const result = await apiServices.tasks.getByKey(params.taskKey, access);
      if (!result) throw new NotFoundError("Task");
      return result;
    },
  });

  create = this.initRoute({
    bodyDto: TaskPostBodySchema,
    responseDto: TaskCreateResponseDto,
    status: 201,
    handler: async ({ body }) => {
      const auth = await requireAuth();
      const access = getAccessByAuth(auth);

      if (body.shouldUseAI) await requireAiAccess();

      const result = await apiServices.tasks.create(body, access);

      if (result.composed) return result.composed;

      if (!result.task) {
        throw new HttpError(500, "Unexpected create result: missing task");
      }

      return access.isAnonymous
        ? { ...result.task, guest: true as const }
        : result.task;
    },
  });

  update = this.initRoute({
    paramsDto: taskIdParamsSchema,
    bodyDto: TaskPatchBodySchema,
    responseDto: TaskResponseDto,
    handler: async ({ params: { id }, body }) => {
      const auth = await requireNonAnonymous();
      const access = getAccessByAuth(auth);
      const updatedTask = await apiServices.tasks.update(id, body, access);
      if (!updatedTask) throw new NotFoundError("Task");
      return updatedTask;
    },
  });

  optimize = this.initRoute({
    bodyDto: OptimizeTasksDto,
    responseDto: OptimizeTasksResponseDto,
    handler: async ({ body: { taskIds } }) => {
      const auth = await requireAiAccess();
      const access = getAccessByAuth(auth);
      return apiServices.tasks.optimize(taskIds, access);
    },
  });

  delete = this.initRoute({
    paramsDto: taskIdParamsSchema,
    responseDto: TaskDeleteSuccessResponseDto,
    handler: async ({ params }) => {
      const auth = await requireNonAnonymous();
      const access = getAccessByAuth(auth);
      await apiServices.tasks.delete(params.id, access);
      return { success: true };
    },
  });

  deleteAllForBoard = this.initRoute({
    queryDto: deleteTasksForBoardQuerySchema,
    responseDto: TasksDeletedCountResponseDto,
    handler: async ({ query: { taskBoardId } }) => {
      const auth = await requireNonAnonymous();
      const access = getAccessByAuth(auth);
      const deleted = await apiServices.tasks.deleteAllForBoard(
        taskBoardId,
        access,
      );
      return { deleted };
    },
  });
}
