import type { ScheduleDate } from "@/helpers/tasks-url.helper";
import type { Task } from "@/types/task";
import type { TaskBoardWithTasks } from "@/types/workspace";

export function getTaskWorkspaceTitle(
  task: Task | null,
  boardsWithTasks: TaskBoardWithTasks[],
  workspaceName: string,
): string {
  if (!task) return workspaceName;
  const board = boardsWithTasks.find((b) => b.id === task.taskBoardId);
  return board?.name || workspaceName;
}

export function getScheduleEmptyStateCopy(
  schedule: ScheduleDate | undefined,
  workspaceName: string,
  scheduleDate: Date | undefined,
): { title: string; message: string } {
  if (schedule === "today" || schedule === "tomorrow") {
    return {
      title: `No tasks scheduled for ${schedule}`,
      message: `When you schedule tasks, they will appear here grouped by board.`,
    };
  }
  if (scheduleDate) {
    return {
      title: "You have no tasks",
      message: `No tasks scheduled for ${scheduleDate.toLocaleDateString()}`,
    };
  }
  return {
    title: "You have no tasks",
    message: `No tasks available for ${workspaceName}`,
  };
}
