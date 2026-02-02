import { FoldersService } from "./folders.service";
import { LabelsService } from "./labels.service";
import { TaskBoardsService } from "./taskBoards.service";
import { TasksService } from "./tasks.service";

export const apiServices = {
  tasks: new TasksService(),
  folders: new FoldersService(),
  labels: new LabelsService(),
  taskBoards: new TaskBoardsService(),
};
