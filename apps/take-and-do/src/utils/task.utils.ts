import { TaskPriority, TaskStatus } from "@/components/KanbanBoard/types";

// ============ Estimation Helpers ============

export function parseEstimation(totalHours: number): ParsedEstimation {
  const totalMinutes = Math.round(totalHours * 60);
  const days = Math.floor(totalMinutes / (24 * 60));
  const remainingAfterDays = totalMinutes % (24 * 60);
  const hours = Math.floor(remainingAfterDays / 60);
  const minutes = remainingAfterDays % 60;
  return { days, hours, minutes };
}

export function toTotalHours(
  days: number,
  hours: number,
  minutes: number,
): number {
  return days * 24 + hours + minutes / 60;
}

export function formatEstimation(totalHours?: number): string {
  if (!totalHours) return "";
  const { days, hours, minutes } = parseEstimation(totalHours);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  return parts.length > 0 ? parts.join(" ") : "0h";
}

// ============ Date Helpers ============

export function formatDateForInput(date: Date | string): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return "";
  const year = dateObj.getFullYear();
  const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
  const day = dateObj.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Format date as YYYY-MM-DD in local timezone (not UTC)
export function formatDateForAPI(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(date?: Date | string): string {
  if (!date) return "";
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return "";
  const day = dateObj.getDate().toString().padStart(2, "0");
  const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
  const year = dateObj.getFullYear();
  return `${day}.${month}.${year}`;
}

export function getScheduleFromDate(
  date?: Date | string,
): "today" | "tomorrow" | null {
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
}

export function formatScheduleDate(date?: Date | string): string {
  if (!date) return "";

  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return "";

  const schedule = getScheduleFromDate(dateObj);
  if (schedule === "today") return "Today";
  if (schedule === "tomorrow") return "Tomorrow";

  return formatDisplayDate(dateObj);
}

// ============ Priority Helpers ============

const PRIORITY_NAMES: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: "Low",
  [TaskPriority.MEDIUM]: "Medium",
  [TaskPriority.HIGH]: "High",
  [TaskPriority.CRITICAL]: "Critical",
};

export function getPriorityName(priority: TaskPriority): string {
  return PRIORITY_NAMES[priority] ?? "Medium";
}

// ============ Status Helpers ============

const STATUS_NAMES: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: "To Do",
  [TaskStatus.IN_PROGRESS]: "In Progress",
  [TaskStatus.DONE]: "Done",
};

export function getStatusName(status: TaskStatus): string {
  return STATUS_NAMES[status] ?? status;
}

export interface ParsedEstimation {
  days: number;
  hours: number;
  minutes: number;
}
