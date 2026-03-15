import {
  Task,
  TaskPriority,
  TaskStatus,
} from "@/components/Boards/KanbanBoard/types";

const PRIORITY_NAMES: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: "Low",
  [TaskPriority.MEDIUM]: "Medium",
  [TaskPriority.HIGH]: "High",
  [TaskPriority.CRITICAL]: "Critical",
};

const STATUS_NAMES: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: "To Do",
  [TaskStatus.IN_PROGRESS]: "In Progress",
  [TaskStatus.DONE]: "Done",
};

export const tasksHelper = {
  sortScheduledTasksByStatus(
    schedule: ScheduleType,
    recentTasks: Task[],
    todayTasks: Task[],
    tomorrowTasks: Task[],
    customDateTasks: Task[],
  ): Task[] {
    const scheduledTasks = {
      new: recentTasks,
      today: todayTasks,
      tomorrow: tomorrowTasks,
      custom: customDateTasks,
    };
    const tasks = scheduledTasks[schedule];
    return tasksHelper.status.sort(tasks);
  },
  getScheduleLabel(schedule: ScheduleType, customDate: string) {
    if (schedule === "new") return "last 7 days";
    if (schedule === "today") return "today";
    if (schedule === "tomorrow") return "tomorrow";
    if (schedule === "custom" && customDate) {
      return tasksHelper.date.formatForDisplay(new Date(customDate));
    }
    return "selected date";
  },
  estimation: {
    parse(totalHours: number): ParsedEstimation {
      const totalMinutes = Math.round(totalHours * 60);
      const days = Math.floor(totalMinutes / (24 * 60));
      const remainingAfterDays = totalMinutes % (24 * 60);
      const hours = Math.floor(remainingAfterDays / 60);
      const minutes = remainingAfterDays % 60;
      return { days, hours, minutes };
    },
    toTotalHours(days: number, hours: number, minutes: number): number {
      return days * 24 + hours + minutes / 60;
    },
    format(totalHours: number): string {
      const { days, hours, minutes } = this.parse(totalHours);
      const parts: string[] = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0) parts.push(`${minutes}m`);
      return parts.length > 0 ? parts.join(" ") : "0h";
    },
    hours(hours: number): string {
      if (!hours) return "—";
      return `${hours}h`;
    },
  },
  date: {
    formatCustomDate(customDate: string): Date {
      const dateParts = customDate.split("-");
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1;
      const day = parseInt(dateParts[2], 10);
      const date = new Date(year, month, day);
      return date;
    },
    formatForInput(rawDate: Date | string): string {
      const date = rawDate instanceof Date ? rawDate : new Date(rawDate);
      if (isNaN(date.getTime())) return "";
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      return `${year}-${month}-${day}`;
    },
    formatForAPI(date: Date): string {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      return `${year}-${month}-${day}`;
    },
    formatForDisplay(rawDate: Date | string): string {
      const date = rawDate instanceof Date ? rawDate : new Date(rawDate);
      if (isNaN(date.getTime())) return "";
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    },
    formatForSchedule(rawDate: Date | string): string {
      const date = rawDate instanceof Date ? rawDate : new Date(rawDate);
      if (isNaN(date.getTime())) return "";
      const schedule = this.getScheduleFromDate(date);
      if (schedule === "today") return "Today";
      if (schedule === "tomorrow") return "Tomorrow";
      return this.formatForDisplay(date);
    },
    getScheduleFromDate(rawDate: Date | string): "today" | "tomorrow" | null {
      const date = rawDate instanceof Date ? rawDate : new Date(rawDate);
      if (isNaN(date.getTime())) return null;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);

      if (checkDate.getTime() === today.getTime()) {
        return "today";
      }
      if (checkDate.getTime() === tomorrow.getTime()) {
        return "tomorrow";
      }
      return null;
    },
  },
  priority: {
    format(priority: unknown): TaskPriority {
      if (!priority) return TaskPriority.MEDIUM;

      const priorityString = String(priority).toLowerCase();
      const validPriorities = Object.values(TaskPriority) as string[];

      if (validPriorities.includes(priorityString)) {
        return priorityString as TaskPriority;
      }

      return TaskPriority.MEDIUM;
    },
    getName(priority: TaskPriority): string {
      return PRIORITY_NAMES[priority] ?? "Medium";
    },
    getIconLabel(priority: TaskPriority): string {
      switch (priority) {
        case TaskPriority.LOW:
          return "🔵";
        case TaskPriority.MEDIUM:
          return "🟡";
        case TaskPriority.HIGH:
          return "🔴";
        case TaskPriority.CRITICAL:
          return "🟣";
        default:
          return "🚫";
      }
    },
  },
  status: {
    getName(status: TaskStatus): string {
      return STATUS_NAMES[status] ?? status;
    },
    sort(tasks: Task[]): Task[] {
      const statusOrder: Record<TaskStatus, number> = {
        [TaskStatus.TODO]: 0,
        [TaskStatus.IN_PROGRESS]: 1,
        [TaskStatus.DONE]: 2,
      };
      return [...tasks].sort(
        (a, b) => (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99),
      );
    },
    getIcon(status: TaskStatus): string {
      switch (status) {
        case TaskStatus.TODO:
          return "◯";
        case TaskStatus.IN_PROGRESS:
          return "◐";
        case TaskStatus.DONE:
          return "✓";
        default:
          return "◯";
      }
    },
  },
};

export function plainTextToHtml(text: string): string {
  const lines = text.split("\n");
  const result: string[] = [];
  let listItems: string[] = [];
  let listType: "ol" | "ul" | null = null;

  const flushList = () => {
    if (!listItems.length || !listType) return;
    result.push(
      `<${listType}>${listItems.map((item) => `<li>${item}</li>`).join("")}</${listType}>`,
    );
    listItems = [];
    listType = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      continue;
    }

    const numberedMatch = trimmed.match(/^\d+\.\s+(.+)/);
    const bulletMatch = trimmed.match(/^[•\-*]\s+(.+)/);

    if (numberedMatch) {
      if (listType === "ul") flushList();
      listType = "ol";
      listItems.push(numberedMatch[1]);
    } else if (bulletMatch) {
      if (listType === "ol") flushList();
      listType = "ul";
      listItems.push(bulletMatch[1]);
    } else {
      flushList();
      result.push(`<p>${trimmed}</p>`);
    }
  }

  flushList();
  return result.join("");
}

export interface ParsedEstimation {
  days: number;
  hours: number;
  minutes: number;
}

export type ScheduleType = "new" | "today" | "tomorrow" | "custom";
