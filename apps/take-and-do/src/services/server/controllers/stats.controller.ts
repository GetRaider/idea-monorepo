import { getAccessByAuth, requireAuth } from "@/auth/guards";
import { GetTaskCountsQueryDto, TaskCountsResponseDto } from "@/db/dtos";
import { apiServices } from "@/services/server/api";
import { BaseController } from "./base.controller";

export class StatsController extends BaseController {
  getCounts = this.initRoute({
    queryDto: GetTaskCountsQueryDto,
    responseDto: TaskCountsResponseDto,
    handler: async ({ query: { timeframe } }) => {
      const auth = await requireAuth();
      const access = getAccessByAuth(auth);
      return apiServices.stats.getCounts(timeframe, access);
    },
  });
}
