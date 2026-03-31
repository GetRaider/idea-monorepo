import type { DataAccess } from "@/db/data-access";
import type { TasksRepository } from "@/db/repositories/tasks.repository";

export class StatsApiService {
  constructor(private readonly repository: TasksRepository) {}

  async getCounts(
    timeframe: "all" | "week" | "month" | "quarter",
    access: DataAccess,
  ) {
    return this.repository.getTaskCounts(timeframe, access);
  }
}
