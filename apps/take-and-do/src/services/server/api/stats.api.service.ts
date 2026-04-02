import type { DataAccess } from "@/db/repositories/base.repository";
import type { TasksRepository } from "@/db/repositories/tasks.repository";
import { BaseApiService } from "@/services/server/api/base.api.service";

export class StatsApiService extends BaseApiService {
  constructor(private readonly repository: TasksRepository) {
    super();
  }

  async getCounts(
    timeframe: "all" | "week" | "month" | "quarter",
    access: DataAccess,
  ) {
    return this.handleOperation(() =>
      this.repository.getTaskCounts(timeframe, access),
    );
  }

  protected override mapError(error: unknown): never {
    throw error;
  }
}
