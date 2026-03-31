import { db } from "@/db/client";
import { TasksRepository } from "@/db/repositories/tasks.repository";
import { FoldersRepository } from "@/db/repositories/folders.repository";
import { LabelsRepository } from "@/db/repositories/labels.repository";
import { TaskBoardsRepository } from "@/db/repositories/task-boards.repository";

import { AnalyticsApiService } from "./analytics.api.service";
import { FoldersApiService } from "./folders.api.service";
import { LabelsApiService } from "./labels.api.service";
import { StatsApiService } from "./stats.api.service";
import { TaskBoardsApiService } from "./task-boards.api.service";
import { TasksApiService } from "./tasks.api.service";

const taskBoardsRepository = new TaskBoardsRepository(db);
const tasksRepository = new TasksRepository(db, taskBoardsRepository);

export const apiServices = {
  tasks: new TasksApiService(tasksRepository),
  folders: new FoldersApiService(new FoldersRepository(db)),
  labels: new LabelsApiService(new LabelsRepository(db)),
  taskBoards: new TaskBoardsApiService(taskBoardsRepository),
  analytics: new AnalyticsApiService(tasksRepository),
  stats: new StatsApiService(tasksRepository),
};
