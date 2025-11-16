import { taskBoardsService } from "@/services/api/taskBoards.service";
import { tasksService } from "@/services/api/tasks.service";
import {
  TaskStatus,
  Task,
  TaskSchedule,
  TaskGroup,
  toTaskStatus,
  toTaskPriority,
  createTaskGroups,
} from "../types";

export async function fetchTaskBoardNameMap(): Promise<Record<string, string>> {
  const taskBoards = await taskBoardsService.getAll();
  const taskBoardNamesMap: Record<string, string> = {};
  taskBoards.forEach((taskBoard) => {
    taskBoardNamesMap[taskBoard.id] = taskBoard.name;
  });
  return taskBoardNamesMap;
}

export async function loadTaskBoardContent({
  boardName,
  taskBoardNamesMap,
  setTasks,
}: {
  boardName: string;
  taskBoardNamesMap: Record<string, string>;
  setTasks: (tasks: Record<TaskStatus, Task[]>) => void;
}): Promise<void> {
  const targetEntry = Object.entries(taskBoardNamesMap).find(
    ([, name]) => name === boardName,
  );
  const taskBoardId = targetEntry ? targetEntry[0] : undefined;

  let boardTasks: Task[] = [];
  if (taskBoardId) {
    boardTasks = await taskBoardsService.getTasks(taskBoardId);
  }

  const grouped: Record<TaskStatus, Task[]> = {
    [TaskStatus.TODO]: [],
    [TaskStatus.IN_PROGRESS]: [],
    [TaskStatus.DONE]: [],
  };
  (boardTasks || []).forEach((task) => {
    if (task.dueDate) {
      task.dueDate = new Date(task.dueDate);
    }
    task.status = toTaskStatus(task.status);
    task.priority = toTaskPriority(task.priority);
    grouped[task.status].push(task);
  });
  setTasks(grouped);
}

export async function loadScheduledContent({
  schedule,
  taskBoardNamesMap,
  setTaskGroups,
}: {
  schedule: TaskSchedule;
  taskBoardNamesMap: Record<string, string>;
  setTaskGroups: (groups: TaskGroup[]) => void;
}): Promise<void> {
  const data = await tasksService.getBySchedule();
  const scheduledTasks = data[schedule];
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
  const taskBoards = await taskBoardsService.getAll();
  const folderTaskBoards = taskBoards.filter((tb) => tb.folderId === folderId);

  // Fetch tasks for each board
  const allTasks: Task[] = [];
  for (const taskBoard of folderTaskBoards) {
    const boardTasks = await taskBoardsService.getTasks(taskBoard.id);
    allTasks.push(...boardTasks);
  }

  setTaskGroups(createTaskGroups(allTasks, taskBoardNamesMap));
}
