import { NextResponse } from "next/server";

import { getAccessByAuth, requireAuth } from "@/auth/guards";
import { apiServices } from "@/services/api";
import { defineRoute } from "@/lib/api/defineRoute";

export const GET = defineRoute(async () => {
  const auth = await requireAuth();
  const access = getAccessByAuth(auth);
  const [folders, taskBoards] = await Promise.all([
    apiServices.folders.getAll(access),
    apiServices.taskBoards.getAll(access),
  ]);
  return NextResponse.json({ folders, taskBoards });
});
