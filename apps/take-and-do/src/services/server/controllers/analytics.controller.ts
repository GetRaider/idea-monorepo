import { getAccessByAuth, requireAuth } from "@/auth/guards";
import {
  AnalyticsGetResponseDto,
  AnalyticsPostResponseDto,
  GenerateAnalyticsDto,
  GetAnalyticsQueryDto,
} from "@/db/dtos";
import { apiServices } from "@/services/server/api";

import { BaseController, InputType } from "./base.controller";

export class AnalyticsController extends BaseController {
  getStatistics = this.createRoute({
    inputType: InputType.Query,
    requestDto: GetAnalyticsQueryDto,
    responseDto: AnalyticsGetResponseDto,
    handler: async ({ input: query }) => {
      const auth = await requireAuth();
      const access = getAccessByAuth(auth);
      const stats = await apiServices.analytics.getStatistics(
        query.timeframe,
        access,
      );
      return { timeframe: query.timeframe, stats };
    },
  });

  generate = this.createRoute({
    inputType: InputType.Body,
    requestDto: GenerateAnalyticsDto,
    responseDto: AnalyticsPostResponseDto,
    handler: async ({ input: body }) => {
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
