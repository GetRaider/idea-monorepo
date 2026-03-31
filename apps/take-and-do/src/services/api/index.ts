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
const foldersRepository = new FoldersRepository(db);
const labelsRepository = new LabelsRepository(db);

export const tasksApiService = new TasksApiService(tasksRepository);
export const foldersApiService = new FoldersApiService(foldersRepository);
export const labelsApiService = new LabelsApiService(labelsRepository);
export const taskBoardsApiService = new TaskBoardsApiService(
  taskBoardsRepository,
);
export const analyticsApiService = new AnalyticsApiService(tasksRepository);
export const statsApiService = new StatsApiService(tasksRepository);

export const apiServices = {
  tasks: tasksApiService,
  folders: foldersApiService,
  labels: labelsApiService,
  taskBoards: taskBoardsApiService,
  analytics: analyticsApiService,
  stats: statsApiService,
};
