import { TaskPriority, TaskStatus } from "@/components/KanbanBoard/types";

// ============ Estimation Helpers ============

export interface ParsedEstimation {
  days: number;
  hours: number;
  minutes: number;
}

export function parseEstimation(totalHours: number): ParsedEstimation {
  const totalMinutes = Math.round(totalHours * 60);
  const days = Math.floor(totalMinutes / (24 * 60));
  const remainingAfterDays = totalMinutes % (24 * 60);
  const hours = Math.floor(remainingAfterDays / 60);
  const minutes = remainingAfterDays % 60;
  return { days, hours, minutes };
}

export function toTotalHours(days: number, hours: number, minutes: number): number {
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

export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(date?: Date): string {
  if (!date) return "";
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
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

