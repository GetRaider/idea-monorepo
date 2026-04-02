import { getAccessByAuth, requireAuth } from "@/auth/guards";
import { TaskCountsResponseDto } from "@/db/dtos";
import { apiServices } from "@/services/server/api";

import { BaseController } from "./base.controller";

export class StatsController extends BaseController {
  getCounts = this.createRoute({
    responseDto: TaskCountsResponseDto,
    handler: async (req, _body, _ctx) => {
      const auth = await requireAuth();
      const access = getAccessByAuth(auth);
      const { searchParams } = new URL(req.url);
      const timeframe = (searchParams.get("timeframe") || "all") as
        | "all"
        | "week"
        | "month"
        | "quarter";
      return apiServices.stats.getCounts(timeframe, access);
    },
  });
}
