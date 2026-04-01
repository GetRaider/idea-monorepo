import { NextRequest, NextResponse } from "next/server";

import {
  getAccessByAuth,
  requireAuth,
  requireNonAnonymous,
} from "@/auth/guards";
import { apiServices } from "@/services/api";
import { tasksHelper } from "@/helpers/task.helper";
import { handleRoute } from "@/lib/api/handleRoute";
import { NotFoundError } from "@/lib/api/errors";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = handleRoute(async (_request: NextRequest, context) => {
  const auth = await requireAuth();
  const access = getAccessByAuth(auth);
  const { id: taskId } = await (context as RouteContext).params;
  const task = await apiServices.tasks.getById(taskId, access);
  if (!task) throw new NotFoundError("Task");
  return NextResponse.json(task);
});

export const PATCH = handleRoute(async (request: NextRequest, context) => {
  const auth = await requireNonAnonymous();
  const access = getAccessByAuth(auth);
  const { id: taskId } = await (context as RouteContext).params;
  const updateData = tasksHelper.fromJson.patch(await request.json());
  const updatedTask = await apiServices.tasks.update(
    taskId,
    updateData,
    access,
  );
  if (!updatedTask) throw new NotFoundError("Task");
  return NextResponse.json(updatedTask);
});

export const DELETE = handleRoute(async (_request: NextRequest, context) => {
  const auth = await requireNonAnonymous();
  const access = getAccessByAuth(auth);
  const { id: taskId } = await (context as RouteContext).params;
  await apiServices.tasks.delete(taskId, access);
  return NextResponse.json({ success: true });
});
