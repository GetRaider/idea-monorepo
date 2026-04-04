import type { ComposeTaskOutput } from "@/server/services/ai/schemas";
import { tasksHelper } from "@/helpers/task.helper";

import {
  Task,
  TaskPriority,
  TaskStatus,
  toTaskPriority,
  toTaskStatus,
} from "../types";

export function createNewTaskTemplate(options: {
  taskBoardId: string;
  scheduleDate?: Date;
}): Task {
  return {
    id: "",
    taskBoardId: options.taskBoardId,
    summary: "",
    description: "",
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    ...(options.scheduleDate && { scheduleDate: options.scheduleDate }),
  };
}

export function composedDataToTask(
  composedData: ComposeTaskOutput,
  overrideScheduleDate?: Date,
): Task {
  const scheduleDate =
    overrideScheduleDate ?? tasksHelper.date.parse(composedData.scheduleDate);

  return {
    id: "",
    taskBoardId: composedData.taskBoardId ?? "",
    taskKey: composedData.taskKey ?? undefined,
    summary: composedData.summary,
    description: composedData.description,
    status: toTaskStatus(composedData.status),
    priority: toTaskPriority(composedData.priority),
    labels: composedData.labels ?? undefined,
    dueDate: tasksHelper.date.parse(composedData.dueDate),
    estimation: composedData.estimation ?? undefined,
    scheduleDate,
    subtasks: composedData.subtasks ?? undefined,
  };
}
