import { Task, TaskStatus, TaskPriority } from "../types";

type ComposedData = Omit<Task, "id">;

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
  composedData: ComposedData,
  overrideScheduleDate?: Date,
): Task {
  const scheduleDate =
    overrideScheduleDate ??
    (composedData.scheduleDate
      ? composedData.scheduleDate instanceof Date
        ? composedData.scheduleDate
        : new Date(composedData.scheduleDate)
      : undefined);

  return {
    id: "",
    taskBoardId: composedData.taskBoardId,
    taskKey: composedData.taskKey,
    summary: composedData.summary,
    description: composedData.description,
    status: (composedData.status as TaskStatus) || TaskStatus.TODO,
    priority: (composedData.priority as TaskPriority) || TaskPriority.MEDIUM,
    labels: composedData.labels,
    dueDate: composedData.dueDate,
    estimation: composedData.estimation,
    scheduleDate,
    subtasks: composedData.subtasks,
  };
}
