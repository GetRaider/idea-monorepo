import {
  completeRecurringTask,
  TaskPriority,
  TaskStatus,
} from "@repo/api/todex";
import type { Task } from "@repo/api/todex";

export const STATUS_ORDER = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.DONE,
] as const;

export const STATUS_LABEL: Record<Task["status"], string> = {
  [TaskStatus.TODO]: "To Do",
  [TaskStatus.IN_PROGRESS]: "In Progress",
  [TaskStatus.DONE]: "Done",
};

export function acceptanceCriteriaAreMet(
  criteria: Task["acceptanceCriteria"],
): boolean {
  return criteria.length > 0 && criteria.every((criterion) => criterion.done);
}

export function taskChecklistProgress(input: {
  acceptanceCriteria: Task["acceptanceCriteria"];
  subtasks: Array<{ status: Task["status"] }>;
}): { done: number; total: number } {
  const criteriaDone = input.acceptanceCriteria.filter(
    (criterion) => criterion.done,
  ).length;
  const subtasksDone = input.subtasks.filter(
    (subtask) => subtask.status === TaskStatus.DONE,
  ).length;
  return {
    done: criteriaDone + subtasksDone,
    total: input.acceptanceCriteria.length + input.subtasks.length,
  };
}

export function nestTasks(tasks: Task[]): NestedTask[] {
  const byId = new Map<string, NestedTask>(
    tasks.map((task) => [task.id, { ...task, children: [] }]),
  );
  const roots: NestedTask[] = [];
  for (const task of byId.values()) {
    if (task.parentTaskId && byId.has(task.parentTaskId)) {
      byId.get(task.parentTaskId)!.children.push(task);
    } else {
      roots.push(task);
    }
  }
  for (const task of byId.values()) {
    task.children.sort(compareTaskOrder);
  }
  return roots;
}

export function scheduleBoards<TBoard extends { id: string }>(
  boards: TBoard[],
  roots: NestedTask[],
): ScheduleBoardSection<TBoard>[] {
  const rootsByBoardId = new Map<string, NestedTask[]>();
  for (const root of roots) {
    const boardRoots = rootsByBoardId.get(root.taskBoardId) ?? [];
    boardRoots.push(root);
    rootsByBoardId.set(root.taskBoardId, boardRoots);
  }
  return boards.flatMap((board) => {
    const boardRoots = rootsByBoardId.get(board.id);
    if (!boardRoots?.length) return [];
    return [{ board, groups: groupRootsByStatus(boardRoots) }];
  });
}

export function filterStatusGroups(
  groups: Record<Task["status"], NestedTask[]>,
  areaId: string | null,
): Record<Task["status"], NestedTask[]> {
  if (!areaId) return groups;
  const filtered = {} as Record<Task["status"], NestedTask[]>;
  for (const status of STATUS_ORDER) {
    filtered[status] = (groups[status] ?? []).filter(
      (task) => task.areaId === areaId,
    );
  }
  return filtered;
}

export function groupRootsByStatus(
  roots: NestedTask[],
): Record<Task["status"], NestedTask[]> {
  const groups: Record<Task["status"], NestedTask[]> = {
    [TaskStatus.TODO]: [],
    [TaskStatus.IN_PROGRESS]: [],
    [TaskStatus.DONE]: [],
  };
  for (const root of roots) {
    groups[root.status].push(root);
  }
  for (const status of STATUS_ORDER) {
    groups[status].sort(compareTaskOrder);
  }
  return groups;
}

export function compareTaskOrder(left: Task, right: Task): number {
  const positionDelta = left.position - right.position;
  if (positionDelta !== 0) return positionDelta;
  const createdDelta = left.createdAt.localeCompare(right.createdAt);
  if (createdDelta !== 0) return createdDelta;
  return left.id.localeCompare(right.id);
}

export function sameBoardDropIndex(
  nodes: BoardDropNode[],
  taskId: string,
  taskBoardId: string,
  dropIndex: number,
): number {
  let index = 0;
  const limit = Math.max(0, Math.min(dropIndex, nodes.length));
  for (let cursor = 0; cursor < limit; cursor += 1) {
    const node = nodes[cursor];
    if (!node || node.id === taskId) continue;
    if (node.taskBoardId === taskBoardId) index += 1;
  }
  return index;
}

export function resolveCombinedOpenDrop(
  todoNodes: BoardDropNode[],
  inProgressNodes: BoardDropNode[],
  taskId: string,
  taskBoardId: string,
  dropIndex: number,
): { status: Task["status"]; index: number } {
  const todoCount = todoNodes.length;
  if (inProgressNodes.length > 0 && dropIndex === todoCount) {
    return {
      status: TaskStatus.IN_PROGRESS,
      index: sameBoardDropIndex(inProgressNodes, taskId, taskBoardId, 0),
    };
  }
  if (dropIndex <= todoCount) {
    return {
      status: TaskStatus.TODO,
      index: sameBoardDropIndex(todoNodes, taskId, taskBoardId, dropIndex),
    };
  }
  return {
    status: TaskStatus.IN_PROGRESS,
    index: sameBoardDropIndex(
      inProgressNodes,
      taskId,
      taskBoardId,
      dropIndex - todoCount,
    ),
  };
}

export function projectCompletedTask(tasks: Task[], taskId: string): Task[] {
  const task = tasks.find((item) => item.id === taskId);
  if (!task || task.status === TaskStatus.DONE) return tasks;
  const effect = completeRecurringTask(task);
  const completed: Task = {
    ...task,
    status: TaskStatus.DONE,
    recurrence: effect.type === "complete" ? task.recurrence : null,
  };
  const doneTasks = placeCompletedTask(tasks, task, completed);
  if (effect.type !== "advance") return doneTasks;
  const position = task.parentTaskId
    ? 0
    : doneTasks.filter(
        (item) =>
          item.parentTaskId == null &&
          item.taskBoardId === task.taskBoardId &&
          item.status === TaskStatus.TODO,
      ).length;
  const now = new Date().toISOString();
  return [
    ...doneTasks,
    {
      ...task,
      id: `next:${task.id}`,
      taskKey: "",
      status: TaskStatus.TODO,
      scheduleDate: effect.scheduleDate,
      dueDate: effect.dueDate,
      recurrence: effect.recurrence,
      acceptanceCriteria: effect.acceptanceCriteria,
      position,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function placeCompletedTask(
  tasks: Task[],
  task: Task,
  completed: Task,
): Task[] {
  if (task.parentTaskId) {
    return tasks.map((item) => (item.id === task.id ? completed : item));
  }
  const staged = tasks.map((item) =>
    item.id === task.id ? { ...completed, status: task.status } : item,
  );
  const index = staged.filter(
    (item) =>
      item.parentTaskId == null &&
      item.taskBoardId === task.taskBoardId &&
      item.status === TaskStatus.DONE &&
      item.id !== task.id,
  ).length;
  return applyRootMove(staged, task.id, TaskStatus.DONE, index);
}

export function applyRootMove(
  tasks: Task[],
  taskId: string,
  status: Task["status"],
  index: number,
): Task[] {
  const task = tasks.find((item) => item.id === taskId);
  if (!task || task.parentTaskId) return tasks;

  const columnIds = (columnStatus: Task["status"]) =>
    tasks
      .filter(
        (item) =>
          item.parentTaskId == null &&
          item.taskBoardId === task.taskBoardId &&
          item.status === columnStatus,
      )
      .sort(compareTaskOrder)
      .map((item) => item.id);

  const destinationIds = columnIds(status).filter((id) => id !== taskId);
  const clamped = Math.max(0, Math.min(index, destinationIds.length));
  destinationIds.splice(clamped, 0, taskId);
  const positionById = new Map(
    destinationIds.map((id, position) => [id, position]),
  );
  if (task.status !== status) {
    columnIds(task.status)
      .filter((id) => id !== taskId)
      .forEach((id, position) => positionById.set(id, position));
  }

  return tasks.map((item) => {
    const position = positionById.get(item.id);
    if (item.id === taskId) {
      return { ...item, status, position: position ?? 0 };
    }
    if (position == null) return item;
    return { ...item, position };
  });
}

export function startOfLocalDay(offsetDays = 0): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return date;
}

export function localDayScheduleQuery(offsetDays = 0): {
  scheduleFrom: string;
  scheduleTo: string;
} {
  return {
    scheduleFrom: startOfLocalDay(offsetDays).toISOString(),
    scheduleTo: startOfLocalDay(offsetDays + 1).toISOString(),
  };
}

export function dateInputToLocalDayStartIso(
  yearMonthDay: string,
): string | null {
  if (!yearMonthDay) return null;
  const [yearText, monthText, dayText] = yearMonthDay.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

export function formatTaskDay(iso: string | null): string | null {
  const value = isoToDateInput(iso);
  if (!value) return null;
  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (!year || !month || !day) return null;
  const monthLabel = TASK_DAY_MONTHS[month - 1];
  if (!monthLabel) return null;
  return `${monthLabel} ${day}`;
}

export function isoToDateInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const DEFAULT_LIST_SORT: ListSortState = {
  enabled: false,
  field: "title",
  direction: "asc",
};

export function compareTasksForListSort(
  left: Task,
  right: Task,
  field: ListSortField,
): number {
  if (field === "title") {
    return left.summary.localeCompare(right.summary, undefined, {
      sensitivity: "base",
    });
  }
  if (field === "schedule") {
    const leftTime = left.scheduleDate ? Date.parse(left.scheduleDate) : null;
    const rightTime = right.scheduleDate
      ? Date.parse(right.scheduleDate)
      : null;
    if (leftTime == null && rightTime == null) return 0;
    if (leftTime == null) return 1;
    if (rightTime == null) return -1;
    return leftTime - rightTime;
  }
  return PRIORITY_RANK[left.priority] - PRIORITY_RANK[right.priority];
}

export function sortNestedTasks(
  nodes: NestedTask[],
  sort: ListSortState,
): NestedTask[] {
  if (!sort.enabled) return nodes;
  const direction = sort.direction === "asc" ? 1 : -1;
  return [...nodes].sort(
    (left, right) =>
      direction * compareTasksForListSort(left, right, sort.field),
  );
}

export function isInboxTask(task: Task): boolean {
  return (
    task.parentTaskId == null &&
    task.status === TaskStatus.TODO &&
    task.scheduleDate == null &&
    task.dueDate == null
  );
}

export function normalizeDescriptionHtml(html: string): string {
  if (!html.trim()) return "";
  const text = html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/\u200b/g, "")
    .trim();
  return text.length === 0 ? "" : html;
}

export function isUnscheduledTask(task: Task): boolean {
  return task.status !== TaskStatus.DONE && task.scheduleDate == null;
}

export function isOverdueTask(task: Task, now: Date): boolean {
  if (task.status === TaskStatus.DONE || task.dueDate == null) return false;
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  return Date.parse(task.dueDate) < startOfToday.getTime();
}

export function tasksByCreatedAtDescending(
  tasks: Task[],
  limit: number,
): Task[] {
  return [...tasks]
    .sort((left, right) => {
      const createdDelta = right.createdAt.localeCompare(left.createdAt);
      if (createdDelta !== 0) return createdDelta;
      return right.taskKey.localeCompare(left.taskKey);
    })
    .slice(0, limit);
}

export function tasksByCompletedDescending(
  tasks: Task[],
  limit: number,
): Task[] {
  return [...tasks]
    .filter((task) => task.status === TaskStatus.DONE)
    .sort((left, right) => {
      const updatedDelta = right.updatedAt.localeCompare(left.updatedAt);
      if (updatedDelta !== 0) return updatedDelta;
      return right.taskKey.localeCompare(left.taskKey);
    })
    .slice(0, limit);
}

export function sortGroupsByListSort(
  groups: Record<Task["status"], NestedTask[]>,
  sort: ListSortState,
): Record<Task["status"], NestedTask[]> {
  return {
    [TaskStatus.TODO]: sortNestedTasks(groups[TaskStatus.TODO], sort),
    [TaskStatus.IN_PROGRESS]: sortNestedTasks(
      groups[TaskStatus.IN_PROGRESS],
      sort,
    ),
    [TaskStatus.DONE]: sortNestedTasks(groups[TaskStatus.DONE], sort),
  };
}

const TASK_DAY_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const PRIORITY_RANK: Record<Task["priority"], number> = {
  [TaskPriority.LOW]: 0,
  [TaskPriority.MEDIUM]: 1,
  [TaskPriority.HIGH]: 2,
  [TaskPriority.CRITICAL]: 3,
};

export interface BoardDropNode {
  id: string;
  taskBoardId: string;
}

export interface NestedTask extends Task {
  children: NestedTask[];
}

export interface ScheduleBoardSection<TBoard extends { id: string }> {
  board: TBoard;
  groups: Record<Task["status"], NestedTask[]>;
}

export type ListSortField = "title" | "schedule" | "priority";
export type ListSortDirection = "asc" | "desc";
export interface ListSortState {
  enabled: boolean;
  field: ListSortField;
  direction: ListSortDirection;
}

export const INBOX_BOARD_NAME = "Inbox";

export interface TaskCreateDraft {
  status?: Task["status"];
  priority?: Task["priority"];
  estimation?: number | null;
  taskBoardId?: string;
  areaId?: string;
  progressStageId?: string | null;
  scheduleDate?: string | null;
  dueDate?: string | null;
}
