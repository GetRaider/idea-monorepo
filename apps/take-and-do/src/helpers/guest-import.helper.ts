import type { Task } from "@/types/task";

import type { WorkspaceRepository } from "@/repositories/workspace";
import type { GuestStore } from "@/stores/guest/types";

export type GuestImportSummary = {
  foldersCreated: number;
  boardsCreated: number;
  tasksCreated: number;
};

export type GuestImportTarget = Pick<
  WorkspaceRepository,
  "createFolder" | "createTaskBoard" | "createTask" | "createSubtask"
>;

export function guestStoreHasImportableData(store: GuestStore | null): boolean {
  if (!store) return false;
  return (
    store.folders.length > 0 ||
    store.taskBoards.length > 0 ||
    store.tasks.length > 0
  );
}

export async function importGuestStore(
  store: GuestStore,
  target: GuestImportTarget,
): Promise<GuestImportSummary> {
  const folderIdMap = new Map<string, string>();
  const boardIdMap = new Map<string, string>();
  let foldersCreated = 0;
  let boardsCreated = 0;
  let tasksCreated = 0;

  for (const folder of store.folders) {
    const created = await target.createFolder({
      name: folder.name,
      emoji: folder.emoji,
    });
    if (!created) throw new Error("Failed to import folder");
    folderIdMap.set(folder.id, created.id);
    foldersCreated += 1;
  }

  for (const board of store.taskBoards) {
    const created = await target.createTaskBoard({
      name: board.name,
      emoji: board.emoji,
      folderId: board.folderId
        ? (folderIdMap.get(board.folderId) ?? null)
        : null,
      isPublic: board.isPublic ?? false,
    });
    if (!created) throw new Error("Failed to import board");
    boardIdMap.set(board.id, created.id);
    boardsCreated += 1;
  }

  for (const task of store.tasks) {
    tasksCreated += await importGuestTaskTree(task, boardIdMap, target);
  }

  return { foldersCreated, boardsCreated, tasksCreated };
}

async function importGuestTaskTree(
  task: Task,
  boardIdMap: Map<string, string>,
  target: GuestImportTarget,
  parentTaskId?: string,
): Promise<number> {
  let tasksCreated = 0;

  if (parentTaskId) {
    const created = await target.createSubtask(parentTaskId, {
      summary: task.summary,
      description: task.description,
      status: task.status,
      priority: task.priority,
    });
    if (!created) throw new Error("Failed to import subtask");
    tasksCreated += 1;

    for (const subtask of task.subtasks ?? []) {
      tasksCreated += await importGuestTaskTree(
        subtask,
        boardIdMap,
        target,
        created.id,
      );
    }

    return tasksCreated;
  }

  const boardId = boardIdMap.get(task.taskBoardId);
  if (!boardId) return 0;

  const created = await target.createTask({
    taskBoardId: boardId,
    summary: task.summary,
    description: task.description,
    status: task.status,
    priority: task.priority,
    ...(task.labels ? { labels: task.labels } : {}),
    ...(task.dueDate ? { dueDate: task.dueDate } : {}),
    ...(task.estimation != null ? { estimation: task.estimation } : {}),
    ...(task.scheduleDate ? { scheduleDate: task.scheduleDate } : {}),
  });
  if (!created) throw new Error("Failed to import task");
  tasksCreated += 1;

  for (const subtask of task.subtasks ?? []) {
    tasksCreated += await importGuestTaskTree(
      subtask,
      boardIdMap,
      target,
      created.id,
    );
  }

  return tasksCreated;
}
