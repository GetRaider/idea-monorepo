import { NextRequest, NextResponse } from "next/server";

import {
  getAccessByAuth,
  requireAiAccess,
  requireAuth,
  requireNonAnonymous,
} from "@/auth/guards";
import { apiServices } from "@/services/api";
import { tasksHelper } from "@/helpers/task.helper";
import { handleRoute } from "@/lib/api";
import { BadRequestError } from "@/lib/api/errors";

export const GET = handleRoute(async (request: NextRequest) => {
  const auth = await requireAuth();
  const access = getAccessByAuth(auth);
  const { searchParams } = new URL(request.url);
  const taskBoardId = searchParams.get("taskBoardId");
  const date = searchParams.get("date");

  if (taskBoardId)
    return NextResponse.json(
      await apiServices.tasks.getByBoardId(taskBoardId, access),
    );

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
    return NextResponse.json(await apiServices.tasks.getByDate(parsed, access));
  }

  return NextResponse.json(await apiServices.tasks.getAll(access));
});

export const POST = handleRoute(async (request: NextRequest) => {
  const auth = await requireAuth();
  const access = getAccessByAuth(auth);
  const payload = tasksHelper.fromJson.postPayload(await request.json());

  if (payload.shouldUseAI) await requireAiAccess();

  const result = await apiServices.tasks.create(payload, access);

  if (result.composed) return NextResponse.json(result.composed);

  return NextResponse.json(
    access.isAnonymous ? { ...result.task, guest: true } : result.task,
    { status: 201 },
  );
});

export const DELETE = handleRoute(async (request: NextRequest) => {
  const auth = await requireNonAnonymous();
  const access = getAccessByAuth(auth);
  const taskBoardId = new URL(request.url).searchParams.get("taskBoardId");
  if (!taskBoardId?.trim())
    throw new BadRequestError("taskBoardId query parameter is required");
  const deleted = await apiServices.tasks.deleteAllForBoard(
    taskBoardId.trim(),
    access,
  );
  return NextResponse.json({ deleted });
});
