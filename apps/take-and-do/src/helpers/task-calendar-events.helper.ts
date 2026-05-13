import type { Task } from "@/types/task";
import type { TaskCalendarEvent } from "@/types/calendar.types";

import { tasksHelper } from "@/helpers/task.helper";

const TASK_SLOT_MS = 60 * 60 * 1000;

export function buildVirtualTaskCalendarEvents(
  tasks: Task[],
): TaskCalendarEvent[] {
  const out: TaskCalendarEvent[] = [];
  for (const t of tasks) {
    const start = tasksHelper.date.parse(t.scheduleDate);
    if (!start || Number.isNaN(start.getTime())) continue;
    out.push({
      id: `task:${t.id}`,
      type: "task",
      taskBoardId: t.taskBoardId,
      taskId: t.id,
      title: t.summary,
      taskSummarySnapshot: t.summary,
      start: start.toISOString(),
      end: new Date(start.getTime() + TASK_SLOT_MS).toISOString(),
      allDay: false,
    });
  }
  return out;
}
