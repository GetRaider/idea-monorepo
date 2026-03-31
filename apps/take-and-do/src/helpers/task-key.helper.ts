import type { Task } from "@/components/Boards/KanbanBoard/types";
import type { TaskBoard } from "@/types/workspace";
import { genericHelper } from "@/helpers/generic.helper";

export function deriveTaskKeyPrefix(taskKey?: string | null): string {
  if (!taskKey) return "TASK";
  const segments = taskKey.split("-").filter(Boolean);
  if (!segments.length) return "TASK";

  const numericIndex = segments.findIndex((segment) => /^\d+$/.test(segment));
  if (numericIndex > 0) {
    return segments.slice(0, numericIndex).join("-");
  }

  return segments[0] || "TASK";
}

export function extractNumericPortion(taskKey?: string | null): number | null {
  if (!taskKey) return null;
  const matches = taskKey.match(/\d+/g);
  if (!matches?.length) return null;
  const numericValue = parseInt(matches[matches.length - 1], 10);
  return Number.isNaN(numericValue) ? null : numericValue;
}

export function boardNameToTaskKeyPrefix(
  board: { name: string } | null | undefined,
): string {
  if (!board) return "TASK";
  const raw = board.name
    .substring(0, 3)
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
  return raw || "TASK";
}

export function assignSubtaskIdsAndKeys(
  subtasks: Task[],
  prefix: string,
  initialNextNum: number,
  resolveExistingKey: (subtaskId: string) => string | null | undefined,
): Array<{ id: string; taskKey: string }> {
  let nextNum = initialNextNum;
  const processed: Array<{ id: string; taskKey: string }> = [];

  subtasks.forEach((subtask) => {
    const hasValidId =
      subtask.id && typeof subtask.id === "string" && subtask.id.length > 0;

    if (hasValidId) {
      const resolvedKey =
        subtask.taskKey || resolveExistingKey(subtask.id) || null;
      if (resolvedKey) {
        processed.push({ id: subtask.id, taskKey: resolvedKey });
        const n = extractNumericPortion(resolvedKey);
        if (n !== null) nextNum = Math.max(nextNum, n);
      } else {
        nextNum += 1;
        processed.push({ id: subtask.id, taskKey: `${prefix}-${nextNum}` });
      }
    } else {
      nextNum += 1;
      processed.push({
        id: genericHelper.generateId(),
        taskKey: `${prefix}-${nextNum}`,
      });
    }
  });

  return processed;
}

function walkTaskKeysForBoard(
  tasks: Task[],
  boardId: string,
  visit: (taskKey: string) => void,
): void {
  for (const task of tasks) {
    if (task.taskBoardId === boardId && task.taskKey) {
      visit(task.taskKey);
    }
    if (task.subtasks?.length) {
      walkTaskKeysForBoard(task.subtasks, boardId, visit);
    }
  }
}

export function maxNumericSuffixForBoardPrefix(
  topLevelTasks: Task[],
  boardId: string,
  prefix: string,
): number {
  let max = 0;
  walkTaskKeysForBoard(topLevelTasks, boardId, (taskKey) => {
    if (deriveTaskKeyPrefix(taskKey) !== prefix) return;
    const n = extractNumericPortion(taskKey);
    if (n !== null) max = Math.max(max, n);
  });
  return max;
}

export function recomposeGuestTaskTreeForBoard(
  task: Task,
  board: Pick<TaskBoard, "id" | "name">,
  existingTopLevelTasks: Task[],
): Task {
  const keyPrefix = boardNameToTaskKeyPrefix(board);
  const maxExisting = maxNumericSuffixForBoardPrefix(
    existingTopLevelTasks,
    board.id,
    keyPrefix,
  );
  const parentKey = `${keyPrefix}-${maxExisting + 1}`;
  const parentNumeric = extractNumericPortion(parentKey) ?? 0;

  if (!task.subtasks?.length) {
    return { ...task, taskKey: parentKey };
  }

  const subtasksStripped = task.subtasks.map((subtask) => ({
    ...subtask,
    taskKey: undefined,
  }));

  const processed = assignSubtaskIdsAndKeys(
    subtasksStripped,
    deriveTaskKeyPrefix(parentKey),
    parentNumeric,
    () => undefined,
  );

  const newSubtasks = task.subtasks.map((subtask, index) => {
    const row = processed[index];
    return {
      ...subtask,
      id: row!.id,
      taskKey: row!.taskKey,
    };
  });

  return { ...task, taskKey: parentKey, subtasks: newSubtasks };
}
