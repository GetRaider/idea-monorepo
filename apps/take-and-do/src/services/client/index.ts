import { AnalyticsClientService } from "./analytics.client.service";
import { FoldersClientService } from "./folders.client.service";
import { LabelsClientService } from "./labels.client.service";
import { StatsClientService } from "./stats.client.service";
import { TaskBoardsClientService } from "./task-boards.client.service";
import { TasksClientService } from "./tasks.client.service";

export type { AnalyticsData, Timeframe } from "./analytics.client.service";
export type { ApiError, ApiOk, ApiResult } from "./api-result.types";

const tasksClientService = new TasksClientService();
const foldersClientService = new FoldersClientService();

export const clientServices = {
  tasks: tasksClientService,
  folders: foldersClientService,
  labels: new LabelsClientService(),
  taskBoards: new TaskBoardsClientService(
    tasksClientService,
    foldersClientService,
  ),
  analytics: new AnalyticsClientService(),
  stats: new StatsClientService(),
};
