import { AnalyticsApiService } from "./analytics.api.service";
import { FoldersApiService } from "./folders.api.service";
import { LabelsApiService } from "./labels.api.service";
import { StatsApiService } from "./stats.api.service";
import { TaskBoardsApiService } from "./task-boards.api.service";
import { TasksApiService } from "./tasks.api.service";

export const apiServices = {
  tasks: new TasksApiService(),
  folders: new FoldersApiService(),
  labels: new LabelsApiService(),
  taskBoards: new TaskBoardsApiService(),
  analytics: new AnalyticsApiService(),
  stats: new StatsApiService(),
};
