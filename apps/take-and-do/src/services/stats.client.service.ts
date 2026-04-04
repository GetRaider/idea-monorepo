import { BaseClientService } from "./base.client.service";

export class StatsClientService extends BaseClientService {
  constructor() {
    super("/stats");
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
