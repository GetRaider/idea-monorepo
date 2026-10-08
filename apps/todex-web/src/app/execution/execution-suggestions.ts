import type { ExecutionSuggestion } from "@repo/api/todex";

const PRIORITY_RANK = { critical: 0, high: 1, medium: 2, low: 3 } as const;

export function applySuggestionFilters(
  tasks: ExecutionSuggestion[],
  filters: SuggestionFilters,
  now: Date,
) {
  const today = dayKey(now);
  const weekEnd = shiftDay(today, 6 - weekdayIndex(today));
  return tasks
    .filter((task) => matches(task, filters, today, weekEnd))
    .sort((left, right) => compareSuggestions(left, right, filters.sort) || left.summary.localeCompare(right.summary));
}

export function suggestionBoards(tasks: ExecutionSuggestion[]) {
  const boards = new Map<string, string>();
  for (const task of tasks) boards.set(task.boardId, task.boardName);
  return [...boards.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function suggestionAreas(tasks: ExecutionSuggestion[], boardId: string) {
  const areas = new Set<string>();
  for (const task of tasks) {
    if (task.isDefaultArea) continue;
    if (boardId !== "all" && task.boardId !== boardId) continue;
    areas.add(task.areaName);
  }
  return [...areas].sort((left, right) => left.localeCompare(right));
}

export function suggestionStages(tasks: ExecutionSuggestion[]) {
  const stages = new Set<string>();
  for (const task of tasks) {
    if (task.stageName) stages.add(task.stageName);
  }
  return [...stages].sort((left, right) => left.localeCompare(right));
}

function matches(
  task: ExecutionSuggestion,
  filters: SuggestionFilters,
  today: string,
  weekEnd: string,
) {
  if (filters.priority !== "all" && task.priority !== filters.priority) return false;
  if (filters.boardId !== "all" && task.boardId !== filters.boardId) return false;
  if (filters.areaName !== "all" && task.areaName !== filters.areaName) return false;
  if (filters.estimation === "short" && task.estimation > 30) return false;
  if (filters.estimation === "medium" && (task.estimation <= 30 || task.estimation > 120)) {
    return false;
  }
  if (filters.estimation === "long" && task.estimation <= 120) return false;
  const scheduleDay = task.scheduleDate ? dayKey(new Date(task.scheduleDate)) : null;
  if (filters.schedule === "unscheduled" && scheduleDay) return false;
  if (filters.schedule === "today" && scheduleDay !== today) return false;
  if (filters.schedule === "week" && (!scheduleDay || scheduleDay < today || scheduleDay > weekEnd)) {
    return false;
  }
  if (filters.schedule === "later" && (!scheduleDay || scheduleDay <= weekEnd)) return false;
  const dueDay = task.dueDate ? dayKey(new Date(task.dueDate)) : null;
  if (filters.due === "none" && dueDay) return false;
  if (filters.due === "overdue" && (!dueDay || dueDay >= today)) return false;
  if (filters.due === "today" && dueDay !== today) return false;
  if (filters.due === "week" && (!dueDay || dueDay < today || dueDay > weekEnd)) return false;
  if (filters.stage === "none" && task.stageName) return false;
  if (filters.stage !== "all" && filters.stage !== "none" && task.stageName !== filters.stage) {
    return false;
  }
  return true;
}

function compareSuggestions(
  left: ExecutionSuggestion,
  right: ExecutionSuggestion,
  sort: SuggestionSort,
) {
  if (sort === "priority") return PRIORITY_RANK[left.priority] - PRIORITY_RANK[right.priority];
  if (sort === "board") {
    return left.boardName.localeCompare(right.boardName) || left.areaName.localeCompare(right.areaName);
  }
  if (sort === "estimation") return left.estimation - right.estimation;
  if (sort === "schedule") return compareTime(left.scheduleDate, right.scheduleDate);
  if (sort === "due") return compareTime(left.dueDate, right.dueDate);
  return (left.stageName ?? "\uffff").localeCompare(right.stageName ?? "\uffff");
}

function compareTime(left: string | null, right: string | null) {
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  return Date.parse(left) - Date.parse(right);
}

function dayKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function shiftDay(day: string, delta: number) {
  const [year, month, date] = day.split("-").map(Number);
  const utc = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, date ?? 1));
  utc.setUTCDate(utc.getUTCDate() + delta);
  return utc.toISOString().slice(0, 10);
}

function weekdayIndex(day: string) {
  const [year, month, date] = day.split("-").map(Number);
  const utc = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, date ?? 1));
  return (utc.getUTCDay() + 6) % 7;
}

export const EMPTY_SUGGESTION_FILTERS: SuggestionFilters = {
  priority: "all",
  boardId: "all",
  areaName: "all",
  estimation: "all",
  schedule: "all",
  due: "all",
  stage: "all",
  sort: "priority",
};

export interface SuggestionFilters {
  priority: "all" | ExecutionSuggestion["priority"];
  boardId: string;
  areaName: string;
  estimation: "all" | "short" | "medium" | "long";
  schedule: "all" | "today" | "week" | "later" | "unscheduled";
  due: "all" | "overdue" | "today" | "week" | "none";
  stage: string;
  sort: SuggestionSort;
}

type SuggestionSort = "priority" | "board" | "estimation" | "schedule" | "due" | "stage";
