import { NextRequest, NextResponse } from "next/server";

import { env } from "@/env";
import { getAccessByAuth, requireAuth } from "@/auth/guards";
import { taskBoardsApiService } from "@/services/api";
import { defineRoute } from "@/lib/api/defineRoute";
import { BadRequestError, NotFoundError } from "@/lib/api/errors";
import { CreateTaskBoardDto, UpdateTaskBoardDto } from "@/db/dtos";

import type { TaskBoard } from "@/types/workspace";

export const GET = defineRoute(async (request: NextRequest) => {
  const auth = await requireAuth();
  const access = getAccessByAuth(auth);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    const board = await taskBoardsApiService.getById(id, access);
    if (!board) throw new NotFoundError("Task board");
    return NextResponse.json([board]);
  }

  const taskBoards = await taskBoardsApiService.getAll(access);
  return NextResponse.json(taskBoards);
});

export const POST = defineRoute(async (request: NextRequest) => {
  const auth = await requireAuth();
  const access = getAccessByAuth(auth);
  const { name, folderId, emoji } = CreateTaskBoardDto.parse(
    await request.json(),
  );

  const taskBoardData: Omit<TaskBoard, "id" | "createdAt" | "updatedAt"> = {
    name: name.trim(),
    folderId: folderId ?? undefined,
    isPublic: false,
    ...(emoji !== undefined && { emoji }),
  };

  try {
    const newTaskBoard = await taskBoardsApiService.create(
      taskBoardData,
      access,
    );
    return NextResponse.json(
      access.isAnonymous ? { ...newTaskBoard, guest: true } : newTaskBoard,
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create task board";
    if (message.includes("ENOTFOUND") || message.includes("getaddrinfo")) {
      return NextResponse.json(
        {
          error:
            "Database connection failed. Please check your DB_CONNECTION_STRING environment variable.",
          details: env.nodeEnv === "development" ? message : undefined,
        },
        { status: 500 },
      );
    }
    throw error;
  }
});

export const PATCH = defineRoute(async (request: NextRequest) => {
  const auth = await requireAuth();
  const access = getAccessByAuth(auth);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) throw new BadRequestError("id is required");

  const body = UpdateTaskBoardDto.parse(await request.json());

  if (Object.keys(body).length === 0)
    throw new BadRequestError("No updates provided");

  if (!access.isAnonymous) {
    const existing = await taskBoardsApiService.getById(id, access);
    if (!existing) throw new NotFoundError("Task board");
  }

  const updated = await taskBoardsApiService.update(id, body, access);
  return NextResponse.json(
    access.isAnonymous ? { ...updated, guest: true } : updated,
  );
});

export const DELETE = defineRoute(async (request: NextRequest) => {
  const auth = await requireAuth();
  const access = getAccessByAuth(auth);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) throw new BadRequestError("id is required");

  if (!access.isAnonymous) {
    const existing = await taskBoardsApiService.getById(id, access);
    if (!existing) throw new NotFoundError("Task board");
  }

  await taskBoardsApiService.delete(id, access);

  if (access.isAnonymous) {
    return NextResponse.json({ id, deleted: true, guest: true });
  }
  return new NextResponse(null, { status: 204 });
});
