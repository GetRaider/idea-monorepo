import { Task, TaskPriority, TaskStatus } from "@/components/KanbanBoard/types";

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
  estimation: {
    parseEstimation(totalHours: number): ParsedEstimation {
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
    formatEstimation(totalHours?: number): string {
      if (!totalHours) return "";
      const { days, hours, minutes } = this.parseEstimation(totalHours);
      const parts: string[] = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0) parts.push(`${minutes}m`);
      return parts.length > 0 ? parts.join(" ") : "0h";
    },
  },
  date: {
    formatDateForInput(date: Date | string): string {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return "";
      const year = dateObj.getFullYear();
      const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
      const day = dateObj.getDate().toString().padStart(2, "0");
      return `${year}-${month}-${day}`;
    },
    formatDateForAPI(date: Date): string {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      return `${year}-${month}-${day}`;
    },
    formatDisplayDate(date?: Date | string): string {
      if (!date) return "";
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return "";
      const day = dateObj.getDate().toString().padStart(2, "0");
      const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
      const year = dateObj.getFullYear();
      return `${day}.${month}.${year}`;
    },
    formatScheduleDate(date?: Date | string): string {
      if (!date) return "";

      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return "";

      const schedule = this.getScheduleFromDate(dateObj);
      if (schedule === "today") return "Today";
      if (schedule === "tomorrow") return "Tomorrow";

      return this.formatDisplayDate(dateObj);
    },
    getScheduleFromDate(date?: Date | string): "today" | "tomorrow" | null {
      if (!date) return null;

      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return null;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const checkDate = new Date(dateObj);
      checkDate.setHours(0, 0, 0, 0);

      if (checkDate.getTime() === today.getTime()) {
        return "today";
      } else if (checkDate.getTime() === tomorrow.getTime()) {
        return "tomorrow";
      }
      return null;
    },
  },
  priority: {
    getPriorityName(priority: TaskPriority): string {
      return PRIORITY_NAMES[priority] ?? "Medium";
    },
  },
  status: {
    getStatusName(status: TaskStatus): string {
      return STATUS_NAMES[status] ?? status;
    },
    sortByStatus(tasks: Task[]): Task[] {
      const statusOrder: Record<TaskStatus, number> = {
        [TaskStatus.TODO]: 0,
        [TaskStatus.IN_PROGRESS]: 1,
        [TaskStatus.DONE]: 2,
      };
      return [...tasks].sort(
        (a, b) => (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99),
      );
    },
  },
};

export interface ParsedEstimation {
  days: number;
  hours: number;
  minutes: number;
}
