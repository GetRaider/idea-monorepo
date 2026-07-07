import type { Task, TaskUpdate } from "@/components/Boards/KanbanBoard/types";
import { guestStoreHelper } from "@/stores/guest";
import type { Folder, TaskBoard } from "@/types/workspace";

export function createGuestFolder(name: string, emoji?: string | null): Folder {
  return guestStoreHelper.addFolder(name, emoji);
}

export function updateGuestFolder(
  id: string,
  patch: Partial<Pick<Folder, "name" | "emoji" | "isPublic">>,
): Folder | null {
  return guestStoreHelper.updateFolder(id, patch);
}

export function deleteGuestFolder(id: string): void {
  guestStoreHelper.deleteFolder(id);
}

export function createGuestTaskBoard(
  payload: Omit<TaskBoard, "id" | "createdAt" | "updatedAt">,
): TaskBoard {
  return guestStoreHelper.addTaskBoard(payload);
}

export function updateGuestTaskBoard(
  id: string,
  patch: Partial<Pick<TaskBoard, "name" | "emoji" | "folderId" | "isPublic">>,
): TaskBoard | null {
  return guestStoreHelper.updateTaskBoard(id, patch);
}

export function deleteGuestTaskBoard(id: string): void {
  guestStoreHelper.deleteTaskBoard(id);
}

export function createGuestTask(
  task: Omit<Task, "id"> & { taskBoardName?: string },
): Task {
  const { taskBoardName: _taskBoardName, ...taskData } = task;
  return guestStoreHelper.addTask(taskData);
}

export function updateGuestTask(
  taskId: string,
  patch: TaskUpdate,
): Task | null {
  return guestStoreHelper.updateTask(taskId, patch);
}

export function deleteGuestTask(taskId: string): void {
  guestStoreHelper.deleteTask(taskId);
}

export function changeGuestBoardVisibility(
  board: TaskBoard,
  toPublic: boolean,
): TaskBoard | null {
  return guestStoreHelper.updateTaskBoard(board.id, {
    name: board.name,
    emoji: board.emoji,
    folderId: board.folderId ?? null,
    isPublic: toPublic,
  });
}
