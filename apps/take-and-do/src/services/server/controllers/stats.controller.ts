import { getAccessByAuth, requireAuth } from "@/auth/guards";
import { GetTaskCountsQueryDto, TaskCountsResponseDto } from "@/db/dtos";
import { apiServices } from "@/services/server/api";
import { BaseController, InputType } from "./base.controller";

export class StatsController extends BaseController {
  getCounts = this.createRoute({
    inputType: InputType.Query,
    requestDto: GetTaskCountsQueryDto,
    responseDto: TaskCountsResponseDto,
    handler: async ({ input: query }) => {
      const auth = await requireAuth();
      const access = getAccessByAuth(auth);
      return apiServices.stats.getCounts(query.timeframe, access);
    },
  });
}
