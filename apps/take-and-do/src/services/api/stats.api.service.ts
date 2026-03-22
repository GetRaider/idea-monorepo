import { BaseApiService } from "./base-api.service";

export class StatsApiService extends BaseApiService {
  constructor() {
    super("/stats");
  }

  async getByTimeframe(timeframe: Timeframe): Promise<TaskStats> {
    const response = await this.get<TaskStats>({
      queries: { timeframe },
    });
    return response.data;
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
