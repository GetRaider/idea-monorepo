import { apiServices } from "@/services/api";
import { Task, TaskGroup, createTaskGroups } from "../types";

export async function fetchTaskBoardNameMap(): Promise<Record<string, string>> {
  const taskBoards = await apiServices.taskBoards.getAll();
  const taskBoardNamesMap: Record<string, string> = {};
  taskBoards.forEach((taskBoard) => {
    taskBoardNamesMap[taskBoard.id] = taskBoard.name;
  });
  return taskBoardNamesMap;
}

export async function loadScheduledContent({
  scheduleDate,
  taskBoardNamesMap,
  setTaskGroups,
}: {
  scheduleDate: Date;
  taskBoardNamesMap: Record<string, string>;
  setTaskGroups: (groups: TaskGroup[]) => void;
}): Promise<void> {
  const scheduledTasks = await apiServices.tasks.getByDate(scheduleDate);
  setTaskGroups(createTaskGroups(scheduledTasks, taskBoardNamesMap));
}

export async function loadFolderContent({
  folderId,
  taskBoardNamesMap,
  setTaskGroups,
}: {
  folderId: string;
  taskBoardNamesMap: Record<string, string>;
  setTaskGroups: (groups: TaskGroup[]) => void;
}): Promise<void> {
  // Fetch all task boards in this folder
  const taskBoards = await apiServices.taskBoards.getAll();
  const folderTaskBoards = taskBoards.filter((tb) => tb.folderId === folderId);

  const allTasks: Task[] = [];
  for (const taskBoard of folderTaskBoards) {
    const boardTasks = await apiServices.taskBoards.getTasks(taskBoard.id);
    allTasks.push(...boardTasks);
  }

  setTaskGroups(createTaskGroups(allTasks, taskBoardNamesMap));
}
