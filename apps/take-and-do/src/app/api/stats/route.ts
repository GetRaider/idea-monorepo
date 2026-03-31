import { NextRequest, NextResponse } from "next/server";

import { getAccessByAuth, requireAuth } from "@/auth/guards";
import { statsApiService } from "@/services/api";
import { defineRoute } from "@/lib/api/defineRoute";

export const GET = defineRoute(async (request: NextRequest) => {
  const auth = await requireAuth();
  const access = getAccessByAuth(auth);
  const { searchParams } = new URL(request.url);
  const timeframe = (searchParams.get("timeframe") || "all") as
    | "all"
    | "week"
    | "month"
    | "quarter";
  return NextResponse.json(await statsApiService.getCounts(timeframe, access));
});
