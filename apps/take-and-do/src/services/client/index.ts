import { AnalyticsClientService } from "./analytics.client.service";
import { FoldersClientService } from "./folders.client.service";
import { LabelsClientService } from "./labels.client.service";
import { StatsClientService } from "./stats.client.service";
import { TaskBoardsClientService } from "./task-boards.client.service";
import { TasksClientService } from "./tasks.client.service";

export type { AnalyticsData, Timeframe } from "./analytics.client.service";

export const clientServices = {
  tasks: new TasksClientService(),
  folders: new FoldersClientService(),
  labels: new LabelsClientService(),
  taskBoards: new TaskBoardsClientService(),
  analytics: new AnalyticsClientService(),
  stats: new StatsClientService(),
};

export const apiServices = clientServices;
