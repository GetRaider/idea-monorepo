import type { Task, TaskBoard } from "@repo/api/todex";

import { tasksUrlHelper } from "../../helpers/tasks-url.helper";

import type { TasksView } from "./tasks-provider";

export function hrefForTask(
  task: Task,
  boards: TaskBoard[],
  view: TasksView,
  loadedViewTaskIds: Set<string>,
): string {
  if (view.kind === "schedule" && loadedViewTaskIds.has(task.id)) {
    return tasksUrlHelper.routing.buildScheduleUrl(view.schedule, task.taskKey);
  }
  const board = boards.find((item) => item.id === task.taskBoardId);
  if (!board) return tasksUrlHelper.routing.buildRootUrl();
  return tasksUrlHelper.routing.buildBoardUrl(board.name, task.taskKey);
}
