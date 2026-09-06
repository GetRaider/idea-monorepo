import type {
  Folder,
  Task,
  TaskBoard,
  Workspace,
  WorkspaceMember,
} from "@repo/api/todex";

import type {
  FolderRow,
  TaskBoardRow,
  TaskRow,
  WorkspaceMemberRow,
  WorkspaceRow,
} from "./schema";

export function toIso(value: Date | null): string | null {
  if (!value) return null;
  return value.toISOString();
}

export function parseIsoDate(value: string | null | undefined): Date | null {
  if (value == null) return null;
  return new Date(value);
}

export function mapWorkspace(row: WorkspaceRow): Workspace {
  return {
    id: row.id,
    name: row.name,
    taskSeq: row.taskSeq,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapWorkspaceMember(row: WorkspaceMemberRow): WorkspaceMember {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    userId: row.userId,
    role: row.role,
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapFolder(row: FolderRow): Folder {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    parentId: row.parentId,
    kind: row.kind,
    name: row.name,
    emoji: row.emoji,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapTaskBoard(row: TaskBoardRow): TaskBoard {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    folderId: row.folderId,
    name: row.name,
    emoji: row.emoji,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    taskBoardId: row.taskBoardId,
    taskKey: row.taskKey,
    summary: row.summary,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueDate: toIso(row.dueDate),
    scheduleDate: toIso(row.scheduleDate),
    estimation: row.estimation ?? null,
    parentTaskId: row.parentTaskId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
