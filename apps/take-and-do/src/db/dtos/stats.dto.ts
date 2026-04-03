import z from "zod";

import { timeframeEnum } from "./analytics.dto";

export const GetTaskCountsQueryDto = z.object({
  timeframe: timeframeEnum,
});
