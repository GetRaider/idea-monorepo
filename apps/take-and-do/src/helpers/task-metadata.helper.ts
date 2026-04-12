import type { Task } from "@/components/Boards/KanbanBoard/types";

import { tasksHelper } from "@/helpers/task.helper";

function getTimestampForCompare(
  date: Date | string | undefined | null,
): number | undefined {
  if (!date) return undefined;
  if (date instanceof Date) return date.getTime();
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? undefined : parsed.getTime();
}

export function diffTaskMetadataForPending(
  initial: Task,
  updated: Task,
): Partial<Task> {
  const updates: Partial<Task> = {};

  const initialDueDate = getTimestampForCompare(initial.dueDate);
  const updatedDueDate = getTimestampForCompare(updated.dueDate);
  if (initialDueDate !== updatedDueDate) {
    updates.dueDate = updated.dueDate;
  }

  const initialScheduleDate = tasksHelper.date.getTime(initial.scheduleDate);
  const updatedScheduleDate = tasksHelper.date.getTime(updated.scheduleDate);
  if (initialScheduleDate !== updatedScheduleDate) {
    updates.scheduleDate = updated.scheduleDate;
  }

  if (updated.estimation !== initial.estimation) {
    updates.estimation = updated.estimation;
  }

  const initialLabels = JSON.stringify(initial.labels || []);
  const updatedLabels = JSON.stringify(updated.labels || []);
  if (updatedLabels !== initialLabels) {
    updates.labels = updated.labels;
  }

  if (updated.priority !== initial.priority) {
    updates.priority = updated.priority;
  }

  if (updated.status !== initial.status) {
    updates.status = updated.status;
  }

  return updates;
}
