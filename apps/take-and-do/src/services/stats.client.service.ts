import { BaseClientService } from "./base.client.service";
import { Route } from "@/constants/route.constant";

export class StatsClientService extends BaseClientService {
  constructor() {
    super(Route.STATS);
  }

  async getByTimeframe(timeframe: Timeframe): Promise<TaskStats | null> {
    const result = await this.get<TaskStats>({ queries: { timeframe } });
    return this.isResultOk(result) ? result.data : null;
  }
}

type Timeframe = "all" | "week" | "month" | "quarter";

interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  highPriority: number;
  overdue: number;
}
