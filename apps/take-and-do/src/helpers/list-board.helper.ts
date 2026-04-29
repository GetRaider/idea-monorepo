import { TaskStatus, type Task } from "@/types/task";

/**
 * List board **layout rules** (not an application “mode”): column order, how the
 * optional “single list” view groups tasks into sections, default expanded
 * sections, and mapping merged-list drop indices to real Kanban columns.
 *
 * View **submode** (`grouped` vs `single`) is persisted in `useBoardListSubmode`;
 * these helpers only encode how each shape is built and how drops resolve.
 */
export const LIST_BOARD_STATUS_ORDER: TaskStatus[] = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.DONE,
];

/** Sections when list submode is `single`: one stack for active work, one for done. */
export const SINGLE_LIST_SECTIONS = [
  {
    key: "tasks",
    label: "Tasks",
    dropStatus: TaskStatus.TODO,
    getTasks: (tasksByStatus: Record<TaskStatus, Task[]>) => [
      ...(tasksByStatus[TaskStatus.TODO] ?? []),
      ...(tasksByStatus[TaskStatus.IN_PROGRESS] ?? []),
    ],
  },
  {
    key: "done",
    label: "Done",
    dropStatus: TaskStatus.DONE,
    getTasks: (tasksByStatus: Record<TaskStatus, Task[]>) =>
      tasksByStatus[TaskStatus.DONE] ?? [],
  },
] as const;

export function getListSectionDefaultExpanded(
  status: TaskStatus,
  taskCount: number,
): boolean {
  if (taskCount === 0) return false;
  if (status === TaskStatus.DONE) return false;
  return true;
}

export function getSingleListSectionDefaultExpanded(
  label: string,
  taskCount: number,
): boolean {
  if (taskCount === 0) return false;
  if (label === "Done") return false;
  return true;
}

/**
 * Single-list view merges TODO + IN_PROGRESS in one stack while droppables still
 * use {@link TaskStatus.TODO}. Maps a merged insertion index to a real column + index.
 */
export function resolveSingleListTasksSectionDrop(
  rawIndex: number,
  todoCount: number,
  inProgressCount: number,
): { targetStatus: TaskStatus; targetIndex: number } {
  const todoLen = todoCount;
  const inProgLen = inProgressCount;

  if (rawIndex <= todoLen) {
    if (inProgLen > 0 && rawIndex === todoLen) {
      return { targetStatus: TaskStatus.IN_PROGRESS, targetIndex: 0 };
    }
    return {
      targetStatus: TaskStatus.TODO,
      targetIndex: Math.max(0, Math.min(rawIndex, todoLen)),
    };
  }

  return {
    targetStatus: TaskStatus.IN_PROGRESS,
    targetIndex: Math.max(0, Math.min(rawIndex - todoLen, inProgLen)),
  };
}
