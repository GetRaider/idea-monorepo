import {
  Task,
  TaskUpdate,
  toTaskPriority,
  toTaskStatus,
} from "@/components/Boards/KanbanBoard/types";
import { tasksHelper } from "@/helpers/task.helper";
import { generateId } from "@/lib/id";
import type { Folder, TaskBoard } from "@/types/workspace";

import { recomposeGuestTaskTreeForBoard } from "@/lib/task-key.helpers";

import { GUEST_STORE_UPDATED_EVENT } from "./constants";
import type { GuestStore } from "./types";

const STORAGE_KEY = "guest_store";

/** JSON dates are strings; revive to `Task` for app code. */
function normalizeStoredTask(raw: unknown): Task {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid stored task");
  }
  const record = raw as Record<string, unknown>;
  return {
    id: String(record.id ?? ""),
    taskBoardId: String(record.taskBoardId ?? ""),
    taskKey:
      record.taskKey !== undefined && record.taskKey !== null
        ? String(record.taskKey)
        : undefined,
    summary: String(record.summary ?? ""),
    description: String(record.description ?? ""),
    status: toTaskStatus(record.status),
    priority: toTaskPriority(record.priority),
    labels: Array.isArray(record.labels)
      ? (record.labels as unknown[]).map(String)
      : undefined,
    dueDate: tasksHelper.date.parse(record.dueDate),
    estimation:
      typeof record.estimation === "number" ? record.estimation : undefined,
    scheduleDate: tasksHelper.date.parse(record.scheduleDate),
    subtasks: Array.isArray(record.subtasks)
      ? record.subtasks.map((subtask) => normalizeStoredTask(subtask))
      : undefined,
  };
}

function normalizeStoredFolder(raw: unknown): Folder {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid stored folder");
  }
  const record = raw as Record<string, unknown>;
  return {
    id: String(record.id ?? ""),
    name: String(record.name ?? ""),
    emoji:
      record.emoji === undefined || record.emoji === null
        ? null
        : String(record.emoji),
    isPublic: Boolean(record.isPublic),
    createdAt: tasksHelper.date.parse(record.createdAt) ?? new Date(),
    updatedAt: tasksHelper.date.parse(record.updatedAt) ?? new Date(),
  };
}

function normalizeStoredTaskBoard(raw: unknown): TaskBoard {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid stored task board");
  }
  const record = raw as Record<string, unknown>;
  const folderRaw = record.folderId;
  return {
    id: String(record.id ?? ""),
    name: String(record.name ?? ""),
    emoji:
      record.emoji === undefined || record.emoji === null
        ? null
        : String(record.emoji),
    isPublic: Boolean(record.isPublic),
    folderId:
      folderRaw === undefined || folderRaw === null || folderRaw === ""
        ? null
        : String(folderRaw),
    createdAt: tasksHelper.date.parse(record.createdAt) ?? new Date(),
    updatedAt: tasksHelper.date.parse(record.updatedAt) ?? new Date(),
  };
}

function notifyGuestStoreChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(GUEST_STORE_UPDATED_EVENT));
}
function parseStore(raw: string): GuestStore | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const record = parsed as Record<string, unknown>;
    const expiresAt =
      typeof record.expiresAt === "string"
        ? record.expiresAt
        : new Date("2099-12-31T23:59:59.000Z").toISOString();
    const tasks = Array.isArray(record.tasks)
      ? record.tasks.map((item) => normalizeStoredTask(item))
      : [];
    const folders = Array.isArray(record.folders)
      ? record.folders.map((item) => normalizeStoredFolder(item))
      : [];
    const taskBoards = Array.isArray(record.taskBoards)
      ? record.taskBoards.map((item) => normalizeStoredTaskBoard(item))
      : [];
    return { tasks, folders, taskBoards, expiresAt };
  } catch {
    return null;
  }
}

function applyTaskUpdate(task: Task, patch: TaskUpdate): Task {
  const next: Task = { ...task };
  if (patch.summary !== undefined) next.summary = patch.summary;
  if (patch.description !== undefined) next.description = patch.description;
  if (patch.status !== undefined) next.status = patch.status;
  if (patch.priority !== undefined) next.priority = patch.priority;
  if (patch.taskBoardId !== undefined) next.taskBoardId = patch.taskBoardId;
  if (patch.taskKey !== undefined) next.taskKey = patch.taskKey;
  if (patch.labels !== undefined) next.labels = patch.labels;
  if (patch.subtasks !== undefined) next.subtasks = patch.subtasks;

  if (patch.dueDate === null) delete next.dueDate;
  else if (patch.dueDate !== undefined) next.dueDate = patch.dueDate;

  if (patch.estimation === null) delete next.estimation;
  else if (patch.estimation !== undefined) next.estimation = patch.estimation;

  if (patch.scheduleDate === null) delete next.scheduleDate;
  else if (patch.scheduleDate !== undefined)
    next.scheduleDate = patch.scheduleDate;

  return next;
}

function updateTaskInTree(
  tasks: Task[],
  id: string,
  patch: TaskUpdate,
): { tasks: Task[]; updated: Task | null } {
  let updated: Task | null = null;
  const next = tasks.map((task) => {
    if (task.id === id) {
      updated = applyTaskUpdate(task, patch);
      return updated;
    }
    if (task.subtasks?.length) {
      const nested = updateTaskInTree(task.subtasks, id, patch);
      if (nested.updated) {
        updated = nested.updated;
        return { ...task, subtasks: nested.tasks };
      }
    }
    return task;
  });
  return { tasks: next, updated };
}

function deleteTaskFromTree(tasks: Task[], id: string): Task[] {
  return tasks
    .filter((task) => task.id !== id)
    .map((task) =>
      task.subtasks?.length
        ? { ...task, subtasks: deleteTaskFromTree(task.subtasks, id) }
        : task,
    );
}

function removeTasksForBoard(tasks: Task[], boardId: string): Task[] {
  return tasks
    .filter((task) => task.taskBoardId !== boardId)
    .map((task) =>
      task.subtasks?.length
        ? {
            ...task,
            subtasks: removeTasksForBoard(task.subtasks, boardId),
          }
        : task,
    );
}

export const guestStoreHelper = {
  _now(): string {
    return new Date().toISOString();
  },

  _expiresAt(): string {
    return new Date("2099-12-31T23:59:59.000Z").toISOString();
  },

  _empty(): GuestStore {
    return {
      tasks: [],
      folders: [],
      taskBoards: [],
      expiresAt: this._expiresAt(),
    };
  },

  _write(updater: (current: GuestStore) => GuestStore): GuestStore {
    const current = this.read() ?? this._empty();
    const updated = updater(current);
    const persisted: GuestStore = {
      ...updated,
      expiresAt: this._expiresAt(),
    };
    if (typeof window === "undefined") return persisted;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    notifyGuestStoreChanged();
    return persisted;
  },

  read(): GuestStore | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const store = parseStore(raw);
      if (!store) {
        this.clear();
        return null;
      }
      return store;
    } catch {
      this.clear();
      return null;
    }
  },

  clear(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
    notifyGuestStoreChanged();
  },

  getTasks(): Task[] {
    return this.read()?.tasks ?? [];
  },

  getFolders(): Folder[] {
    return this.read()?.folders ?? [];
  },

  getTaskBoards(): TaskBoard[] {
    return this.read()?.taskBoards ?? [];
  },

  getTaskBoardById(id: string): TaskBoard | undefined {
    return this.getTaskBoards().find((board) => board.id === id);
  },

  addFolder(name: string, emoji?: string | null): Folder {
    const now = new Date();
    const folder: Folder = {
      id: generateId(),
      name,
      emoji: emoji ?? null,
      isPublic: false,
      createdAt: now,
      updatedAt: now,
    };
    this._write((store) => ({ ...store, folders: [...store.folders, folder] }));
    return folder;
  },

  upsertFolder(folder: Folder): Folder {
    this._write((store) => {
      const index = store.folders.findIndex((item) => item.id === folder.id);
      if (index === -1) {
        return { ...store, folders: [...store.folders, folder] };
      }
      const next = [...store.folders];
      next[index] = folder;
      return { ...store, folders: next };
    });
    return folder;
  },

  addTaskBoard(
    payload: Omit<TaskBoard, "id" | "createdAt" | "updatedAt">,
  ): TaskBoard {
    const now = new Date();
    const board: TaskBoard = {
      ...payload,
      id: generateId(),
      folderId: payload.folderId ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this._write((store) => ({
      ...store,
      taskBoards: [...store.taskBoards, board],
    }));
    return board;
  },

  upsertTaskBoard(board: TaskBoard): TaskBoard {
    this._write((store) => {
      const index = store.taskBoards.findIndex((item) => item.id === board.id);
      if (index === -1) {
        return { ...store, taskBoards: [...store.taskBoards, board] };
      }
      const next = [...store.taskBoards];
      next[index] = board;
      return { ...store, taskBoards: next };
    });
    return board;
  },

  updateFolder(
    id: string,
    patch: Partial<Pick<Folder, "name" | "emoji">>,
  ): Folder | null {
    let updated: Folder | null = null;
    this._write((store) => ({
      ...store,
      folders: store.folders.map((folder) => {
        if (folder.id !== id) return folder;
        updated = {
          ...folder,
          ...patch,
          updatedAt: new Date(),
        };
        return updated;
      }),
    }));
    return updated;
  },

  updateTaskBoard(
    id: string,
    patch: Partial<Pick<TaskBoard, "name" | "emoji" | "folderId" | "isPublic">>,
  ): TaskBoard | null {
    let updated: TaskBoard | null = null;
    this._write((store) => ({
      ...store,
      taskBoards: store.taskBoards.map((board) => {
        if (board.id !== id) return board;
        const nextFolderId =
          patch.folderId === undefined
            ? board.folderId
            : patch.folderId === null || patch.folderId === ""
              ? null
              : patch.folderId;
        updated = {
          ...board,
          ...patch,
          folderId: nextFolderId,
          updatedAt: new Date(),
        };
        return updated;
      }),
    }));
    return updated;
  },

  deleteFolder(id: string): void {
    this._write((store) => ({
      ...store,
      folders: store.folders.filter((folder) => folder.id !== id),
      taskBoards: store.taskBoards.map((board) =>
        board.folderId === id
          ? { ...board, folderId: null, updatedAt: new Date() }
          : board,
      ),
    }));
  },

  deleteTaskBoard(id: string): void {
    this._write((store) => ({
      ...store,
      taskBoards: store.taskBoards.filter((board) => board.id !== id),
      tasks: removeTasksForBoard(store.tasks, id),
    }));
  },

  addTask(task: Omit<Task, "id"> | Task): Task {
    const hasId =
      "id" in task &&
      typeof (task as Task).id === "string" &&
      (task as Task).id.length > 0;

    const existingTopLevel = this.getTasks();

    if (hasId) {
      const newTask = task as Task;
      const board = this.getTaskBoardById(newTask.taskBoardId);
      const toStore = board
        ? recomposeGuestTaskTreeForBoard(newTask, board, existingTopLevel)
        : newTask;
      this._write((store) => ({ ...store, tasks: [...store.tasks, toStore] }));
      return toStore;
    }

    const payload = task as Omit<Task, "id">;
    const id = generateId();
    const draft: Task = {
      ...payload,
      id,
      taskKey: payload.taskKey,
    };
    const board = this.getTaskBoardById(payload.taskBoardId);
    const toStore = board
      ? recomposeGuestTaskTreeForBoard(draft, board, existingTopLevel)
      : {
          ...draft,
          taskKey: draft.taskKey ?? `guest-${id.slice(0, 10)}`,
        };
    this._write((store) => ({ ...store, tasks: [...store.tasks, toStore] }));
    return toStore;
  },

  updateTask(id: string, patch: TaskUpdate): Task | null {
    let updated: Task | null = null;
    this._write((store) => {
      const { tasks: nextTasks, updated: found } = updateTaskInTree(
        store.tasks,
        id,
        patch,
      );
      updated = found;
      return { ...store, tasks: nextTasks };
    });
    return updated;
  },

  deleteTask(id: string): void {
    this._write((store) => ({
      ...store,
      tasks: deleteTaskFromTree(store.tasks, id),
    }));
  },
};
