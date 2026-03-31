import { Task } from "@/components/Boards/KanbanBoard/types";
import { tasksHelper } from "@/helpers/task.helper";

export function guestTasksForBoard(tasks: Task[], boardId: string): Task[] {
  return tasks.filter((task) => task.taskBoardId === boardId);
}

export function guestTasksForScheduleDate(
  tasks: Task[],
  scheduleDate: Date,
): Task[] {
  const target = tasksHelper.date.formatForAPI(scheduleDate);
  return tasks.filter((task) => {
    if (!task.scheduleDate) return false;
    return tasksHelper.date.formatForAPI(task.scheduleDate) === target;
  });
}

export function guestTasksBySchedule(tasks: Task[]): {
  today: Task[];
  tomorrow: Task[];
} {
  const today = tasksHelper.schedule.getDate("today");
  const tomorrow = tasksHelper.schedule.getDate("tomorrow");
  return {
    today: guestTasksForScheduleDate(tasks, today),
    tomorrow: guestTasksForScheduleDate(tasks, tomorrow),
  };
}

export function guestTasksRecent(tasks: Task[], days: number): Task[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const pastDate = new Date(now);
  pastDate.setDate(pastDate.getDate() - days);

  return tasks.filter((task) => {
    if (task.scheduleDate) {
      const scheduleTime = tasksHelper.date.getTime(task.scheduleDate);
      return scheduleTime !== undefined && scheduleTime >= pastDate.getTime();
    }
    if (task.dueDate) {
      const dueTime = tasksHelper.date.getTime(task.dueDate);
      return dueTime !== undefined && dueTime >= pastDate.getTime();
    }
    return true;
  });
}
