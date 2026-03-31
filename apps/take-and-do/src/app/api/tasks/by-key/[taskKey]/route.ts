import { NextRequest, NextResponse } from "next/server";

import { getAccessByAuth, requireAuth } from "@/auth/guards";
import { tasksApiService } from "@/services/api";
import { defineRoute } from "@/lib/api/defineRoute";
import { NotFoundError } from "@/lib/api/errors";

type RouteContext = { params: Promise<{ taskKey: string }> };

export const GET = defineRoute(async (_request: NextRequest, context) => {
  const auth = await requireAuth();
  const access = getAccessByAuth(auth);
  const { taskKey } = await (context as RouteContext).params;
  const result = await tasksApiService.getByKey(taskKey, access);
  if (!result) throw new NotFoundError("Task");
  return NextResponse.json(result);
});
