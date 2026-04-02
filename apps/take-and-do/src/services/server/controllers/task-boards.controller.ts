import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "@/env";
import { getAccessByAuth, requireAuth } from "@/auth/guards";
import {
  CreateTaskBoardDto,
  GuestResourceDeleteResponseDto,
  TaskBoardCreateErrorResponseDto,
  TaskBoardListResponseDto,
  TaskBoardResponseDto,
  TaskBoardSingleQueryResponseDto,
  UpdateTaskBoardDto,
} from "@/db/dtos";
import { BadRequestError, NotFoundError } from "@/lib/api/errors";
import { apiServices } from "@/services/server/api";

import type { TaskBoard } from "@/types/workspace";

import { BaseController, InputType } from "./base.controller";

const taskBoardIdQuerySchema = z.object({ id: z.string().min(1) });

const patchTaskBoardRequestSchema = z
  .object({ id: z.string().min(1) })
  .merge(UpdateTaskBoardDto);

const listOrGetResponseSchema = TaskBoardListResponseDto.or(
  TaskBoardSingleQueryResponseDto,
);

export class TaskBoardsController extends BaseController {
  listOrGetOne = this.createRoute({
    responseDto: listOrGetResponseSchema,
    handler: async ({ request }) => {
      const auth = await requireAuth();
      const access = getAccessByAuth(auth);
      const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");

      if (id) {
        const board = await apiServices.taskBoards.getById(id, access);
        if (!board) throw new NotFoundError("Task board");
        return [board];
      }

      return apiServices.taskBoards.getAll(access);
    },
  });

  create = this.createRoute({
    requestDto: CreateTaskBoardDto,
    inputType: InputType.Body,
    responseDto: TaskBoardResponseDto,
    status: 201,
    handler: async ({ input }) => {
      const auth = await requireAuth();
      const access = getAccessByAuth(auth);

      const taskBoardData: Omit<TaskBoard, "id" | "createdAt" | "updatedAt"> = {
        name: input.name.trim(),
        folderId: input.folderId ?? undefined,
        isPublic: false,
        ...(input.emoji !== undefined && { emoji: input.emoji }),
      };

      try {
        const newTaskBoard = await apiServices.taskBoards.create(
          taskBoardData,
          access,
        );
        return access.isAnonymous
          ? { ...newTaskBoard, guest: true as const }
          : newTaskBoard;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to create task board";
        if (message.includes("ENOTFOUND") || message.includes("getaddrinfo")) {
          const payload = TaskBoardCreateErrorResponseDto.parse({
            error:
              "Database connection failed. Please check your DB_CONNECTION_STRING environment variable.",
            details: env.nodeEnv === "development" ? message : undefined,
          });
          return NextResponse.json(payload, { status: 500 });
        }
        throw error;
      }
    },
  });

  update = this.createRoute({
    responseDto: TaskBoardResponseDto,
    handler: async ({ request }) => {
      const auth = await requireAuth();
      const access = getAccessByAuth(auth);
      const id = new URL(request.url).searchParams.get("id");
      if (!id) throw new BadRequestError("id is required");
      const json = await request.json();
      const data = patchTaskBoardRequestSchema.parse({ id, ...json });
      const { id: taskBoardId, ...body } = data;

      if (Object.keys(body).length === 0)
        throw new BadRequestError("No updates provided");

      if (!access.isAnonymous) {
        const existing = await apiServices.taskBoards.getById(
          taskBoardId,
          access,
        );
        if (!existing) throw new NotFoundError("Task board");
      }

      const updated = await apiServices.taskBoards.update(
        taskBoardId,
        body,
        access,
      );
      return access.isAnonymous
        ? { ...updated, guest: true as const }
        : updated;
    },
  });

  delete = this.createRoute({
    requestDto: taskBoardIdQuerySchema,
    inputType: InputType.Query,
    responseDto: GuestResourceDeleteResponseDto,
    handler: async ({ input }) => {
      const auth = await requireAuth();
      const access = getAccessByAuth(auth);
      const { id } = input;

      if (!access.isAnonymous) {
        const existing = await apiServices.taskBoards.getById(id, access);
        if (!existing) throw new NotFoundError("Task board");
      }

      await apiServices.taskBoards.delete(id, access);

      if (access.isAnonymous) {
        return { id, deleted: true, guest: true };
      }
      return new NextResponse(null, { status: 204 });
    },
  });
}
