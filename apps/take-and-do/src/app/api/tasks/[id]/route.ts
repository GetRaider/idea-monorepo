import { NextRequest, NextResponse } from "next/server";

import {
  getAccessByAuth,
  requireAuth,
  requireNonAnonymous,
} from "@/auth/guards";
import { tasksApiService } from "@/services/api";
import { tasksHelper } from "@/helpers/task.helper";
import { defineRoute } from "@/lib/api/defineRoute";
import { NotFoundError } from "@/lib/api/errors";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = defineRoute(async (_request: NextRequest, context) => {
  const auth = await requireAuth();
  const access = getAccessByAuth(auth);
  const { id: taskId } = await (context as RouteContext).params;
  const task = await tasksApiService.getById(taskId, access);
  if (!task) throw new NotFoundError("Task");
  return NextResponse.json(task);
});

export const PATCH = defineRoute(async (request: NextRequest, context) => {
  const auth = await requireNonAnonymous();
  const access = getAccessByAuth(auth);
  const { id: taskId } = await (context as RouteContext).params;
  const updateData = tasksHelper.fromJson.patch(await request.json());
  const updatedTask = await tasksApiService.update(taskId, updateData, access);
  if (!updatedTask) throw new NotFoundError("Task");
  return NextResponse.json(updatedTask);
});

export const DELETE = defineRoute(async (_request: NextRequest, context) => {
  const auth = await requireNonAnonymous();
  const access = getAccessByAuth(auth);
  const { id: taskId } = await (context as RouteContext).params;
  await tasksApiService.delete(taskId, access);
  return NextResponse.json({ success: true });
});
