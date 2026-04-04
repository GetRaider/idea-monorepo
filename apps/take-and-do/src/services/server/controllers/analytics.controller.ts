import { getAccessByAuth, requireAuth } from "@/auth/guards";
import {
  AnalyticsGetResponseDto,
  AnalyticsPostResponseDto,
  GenerateAnalyticsDto,
  GetAnalyticsQueryDto,
} from "@/db/dtos";
import { apiServices } from "@/services/server/api";
import { BaseController } from "./base.controller";

export class AnalyticsController extends BaseController {
  getStatistics = this.initRoute({
    queryDto: GetAnalyticsQueryDto,
    responseDto: AnalyticsGetResponseDto,
    handler: async ({ query }) => {
      const auth = await requireAuth();
      const access = getAccessByAuth(auth);
      const stats = await apiServices.analytics.getStatistics(
        query.timeframe,
        access,
      );
      return { timeframe: query.timeframe, stats };
    },
  });

  generate = this.initRoute({
    bodyDto: GenerateAnalyticsDto,
    responseDto: AnalyticsPostResponseDto,
    handler: async ({ body }) => {
      const auth = await requireAuth();
      const { stats, timeframe, shouldUseAI = false } = body;
      const analytics = await apiServices.analytics.generate(
        stats,
        timeframe,
        shouldUseAI,
        auth.isAnonymous,
      );
      return {
        timeframe,
        stats,
        analytics,
        aiGenerated: shouldUseAI,
      };
    },
  });
}
