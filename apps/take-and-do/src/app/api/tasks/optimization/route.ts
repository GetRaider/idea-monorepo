import { NextRequest, NextResponse } from "next/server";

import { getAccessByAuth, requireAiAccess } from "@/auth/guards";
import { apiServices } from "@/services/api";
import { defineRoute } from "@/lib/api";
import { OptimizeTasksDto } from "@/db/dtos";

export const POST = defineRoute(async (request: NextRequest) => {
  const auth = await requireAiAccess();
  const access = getAccessByAuth(auth);
  const { taskIds } = OptimizeTasksDto.parse(await request.json());
  const result = await apiServices.tasks.optimize(taskIds, access);
  return NextResponse.json(result);
});
