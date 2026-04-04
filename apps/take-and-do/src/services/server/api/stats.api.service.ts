import { DB } from "@/db/client";
import type { DataAccess } from "@/db/repositories/base.repository";
import { BaseApiService } from "@/services/server/api/base.api.service";
import { TasksApiService } from "./tasks.api.service";

export class StatsApiService extends BaseApiService {
  constructor(
    protected readonly db: DB,
    private readonly tasksService: TasksApiService,
  ) {
    super(db);
  }

  async getCounts(
    timeframe: "all" | "week" | "month" | "quarter",
    access: DataAccess,
  ) {
    return this.handleOperation(async () =>
      this.tasksService.getTaskCounts(timeframe, access),
    );
  }

  protected override mapError(error: unknown): never {
    throw error;
  }
}
