import {
  DocType,
  readGoalDocBody,
  readTaskRecurrence,
  type BoardArea,
  type CalendarEvent,
  type CalendarEventTemplate,
  type BoardProgressStage,
  type CommonDocBody,
  type Doc,
  type DocSummary,
  type Folder,
  type Task,
  type TaskBoard,
  type Workspace,
  type WorkspaceMember,
} from "@repo/api/todex";

import type {
  BoardAreaRow,
  BoardProgressStageRow,
  CalendarEventRow,
  CalendarEventTemplateRow,
  DocRow,
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

export function mapBoardArea(row: BoardAreaRow): BoardArea {
  return {
    id: row.id,
    boardId: row.boardId,
    name: row.name,
    position: row.position,
    isDefault: row.isDefault,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapBoardProgressStage(
  row: BoardProgressStageRow,
): BoardProgressStage {
  return {
    id: row.id,
    boardId: row.boardId,
    name: row.name,
    position: row.position,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapDocSummary(row: DocSummaryRow): DocSummary {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    folderId: row.folderId,
    type: row.type,
    docKey: row.docKey,
    title: row.title,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapDoc(row: DocRow, linkedTaskIds: string[]): Doc {
  const summary = mapDocSummary(row);
  if (row.type === DocType.COMMON) {
    return {
      ...summary,
      type: DocType.COMMON,
      body: row.body as CommonDocBody,
    };
  }
  return {
    ...summary,
    type: DocType.GOAL,
    body: readGoalDocBody(row.body),
    linkedTaskIds: [...linkedTaskIds].sort(),
  };
}

export function mapTask(row: TaskRow, goalId: string | null = null): Task {
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
    color: row.color,
    acceptanceCriteria: row.acceptanceCriteria ?? [],
    recurrence: readTaskRecurrence(row.recurrence),
    areaId: row.areaId,
    progressStageId: row.progressStageId,
    parentTaskId: row.parentTaskId,
    goalId,
    position: row.position,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapCalendarEvent(row: CalendarEventRow): CalendarEvent {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    seriesEventId: row.seriesEventId,
    title: row.title,
    start: row.start.toISOString(),
    end: row.end.toISOString(),
    allDay: row.allDay,
    color: row.color,
    timeZone: row.timeZone,
    recurrence: readTaskRecurrence(row.recurrence),
    rawRrule: row.rawRrule,
    description: row.description,
    taskScope: row.taskScope ?? [],
    participants: row.participants ?? [],
    rsvpStatus: row.rsvpStatus,
    googleEventId: row.googleEventId,
    googleEtag: row.googleEtag,
    organizerSelf: row.organizerSelf,
    originalStart: toIso(row.originalStart),
    cancelled: row.cancelled,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapCalendarEventTemplate(
  row: CalendarEventTemplateRow,
): CalendarEventTemplate {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    title: row.title,
    durationMinutes: row.durationMinutes,
    color: row.color,
    description: row.description,
    taskScope: row.taskScope ?? [],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

interface DocSummaryRow {
  id: string;
  workspaceId: string;
  folderId: string | null;
  type: DocRow["type"];
  docKey: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}
