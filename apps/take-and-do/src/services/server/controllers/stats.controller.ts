import { getAccessByAuth, requireAuth } from "@/auth/guards";
import { GetTaskCountsQueryDto, TaskCountsResponseDto } from "@/db/dtos";
import { apiServices } from "@/services/server/api";
import { BaseController } from "./base.controller";

export class StatsController extends BaseController {
  getCounts = this.createRoute({
    queryDto: GetTaskCountsQueryDto,
    responseDto: TaskCountsResponseDto,
    handler: async ({ query }) => {
      const auth = await requireAuth();
      const access = getAccessByAuth(auth);
      return apiServices.stats.getCounts(query.timeframe, access);
    },
  });
}
