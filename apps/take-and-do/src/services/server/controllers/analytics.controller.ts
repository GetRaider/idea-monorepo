import { getAccessByAuth, requireAuth } from "@/auth/guards";
import {
  AnalyticsGetResponseDto,
  AnalyticsPostResponseDto,
  GenerateAnalyticsDto,
  timeframeEnum,
} from "@/db/dtos";
import { apiServices } from "@/services/server/api";

import { BaseController } from "./base.controller";

export class AnalyticsController extends BaseController {
  getStatistics = this.createRoute({
    responseDto: AnalyticsGetResponseDto,
    handler: async (req, _body, _ctx) => {
      const auth = await requireAuth();
      const access = getAccessByAuth(auth);
      const { searchParams } = new URL(req.url);
      const timeframe = timeframeEnum.parse(
        searchParams.get("timeframe") || "month",
      );
      const stats = await apiServices.analytics.getStatistics(
        timeframe,
        access,
      );
      return { timeframe, stats };
    },
  });

  generate = this.createRoute({
    requestDto: GenerateAnalyticsDto,
    responseDto: AnalyticsPostResponseDto,
    handler: async (_req, body, _ctx) => {
      const auth = await requireAuth();
      const { stats, timeframe, shouldUseAI } = body;
      const analytics = await apiServices.analytics.generate(
        stats,
        timeframe,
        shouldUseAI ?? false,
        auth.isAnonymous,
      );
      return {
        timeframe,
        stats,
        analytics,
        aiGenerated: shouldUseAI === true,
      };
    },
  });
}
