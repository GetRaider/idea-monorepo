import { NextRequest, NextResponse } from "next/server";

import { getAccessByAuth, requireAuth } from "@/auth/guards";
import { handleRoute } from "@/lib/api/handleRoute";
import { apiServices } from "@/services/api";

export const GET = handleRoute(async (request: NextRequest) => {
  const auth = await requireAuth();
  const access = getAccessByAuth(auth);
  const { searchParams } = new URL(request.url);
  const timeframe = (searchParams.get("timeframe") || "all") as
    | "all"
    | "week"
    | "month"
    | "quarter";
  return NextResponse.json(
    await apiServices.stats.getCounts(timeframe, access),
  );
});
