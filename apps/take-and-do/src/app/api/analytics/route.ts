import { NextRequest, NextResponse } from "next/server";

import { getAccessByAuth, requireAuth } from "@/auth/guards";
import { handleRoute } from "@/lib/api/handleRoute";
import { GenerateAnalyticsDto, timeframeEnum } from "@/db/dtos";
import { apiServices } from "@/services/api";

export const GET = handleRoute(async (request: NextRequest) => {
  const auth = await requireAuth();
  const access = getAccessByAuth(auth);
  const { searchParams } = new URL(request.url);
  const timeframe = timeframeEnum.parse(
    searchParams.get("timeframe") || "month",
  );
  const stats = await apiServices.analytics.getStatistics(timeframe, access);
  return NextResponse.json({ timeframe, stats });
});

export const POST = handleRoute(async (request: NextRequest) => {
  const auth = await requireAuth();
  const { stats, timeframe, shouldUseAI } = GenerateAnalyticsDto.parse(
    await request.json(),
  );
  const analytics = await apiServices.analytics.generate(
    stats,
    timeframe,
    shouldUseAI ?? false,
    auth.isAnonymous,
  );
  return NextResponse.json({
    timeframe,
    stats,
    analytics,
    aiGenerated: shouldUseAI === true,
  });
});
