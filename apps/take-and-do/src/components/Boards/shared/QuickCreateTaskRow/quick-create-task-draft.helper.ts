import { localStorageHelper } from "@/helpers/local-storage.helper";

import type { TaskPriority, TaskStatus } from "../../KanbanBoard/types";

import type { QuickCreateTaskRowBoardOption } from "./QuickCreateTaskRow.types";

export const QUICK_CREATE_DRAFT_VERSION = 1 as const;

export type QuickCreateDraftFields = {
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  scheduleDate?: Date;
  dueDate?: Date;
  estimation?: number;
  selectedBoardId?: string;
};

type QuickCreateStoredDraft = {
  v: typeof QUICK_CREATE_DRAFT_VERSION;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  scheduleDateISO?: string;
  dueDateISO?: string;
  estimation?: number;
  selectedBoardId?: string;
};

export function buildQuickCreateDraftStorageKey(
  isMultiBoard: boolean,
  taskBoardId?: string,
): string {
  return `take-and-do:quick-create-draft:${isMultiBoard ? "multi" : (taskBoardId ?? "unknown")}`;
}

export function buildQuickCreateStoredDraft(
  fields: QuickCreateDraftFields,
): QuickCreateStoredDraft {
  return {
    v: QUICK_CREATE_DRAFT_VERSION,
    title: fields.title,
    status: fields.status,
    priority: fields.priority,
    scheduleDateISO: fields.scheduleDate?.toISOString(),
    dueDateISO: fields.dueDate?.toISOString(),
    estimation: fields.estimation,
    selectedBoardId: fields.selectedBoardId,
  };
}

export function hasQuickCreateDraftContent(
  fields: QuickCreateDraftFields,
  context: QuickCreateDraftComparisonContext,
): boolean {
  return (
    fields.title.trim() !== "" ||
    fields.status !== context.defaultStatus ||
    fields.priority !== context.defaultPriority ||
    fields.dueDate != null ||
    fields.estimation != null ||
    !sameCalendarDay(fields.scheduleDate, context.defaultScheduleDate) ||
    (context.isMultiBoard && fields.selectedBoardId !== context.defaultBoardId)
  );
}

export function hydrateQuickCreateDraftFromStorage(
  storageKey: string,
  context: QuickCreateDraftHydrationContext,
  handlers: QuickCreateDraftHydrationHandlers,
): void {
  const draft = readQuickCreateStoredDraft(storageKey);
  if (!draft) return;

  handlers.setTitle(draft.title ?? "");
  if (draft.status) handlers.setStatus(draft.status);
  if (draft.priority) handlers.setPriority(draft.priority);
  handlers.setScheduleDate(
    draft.scheduleDateISO
      ? new Date(draft.scheduleDateISO)
      : context.defaultScheduleDate,
  );
  handlers.setDueDate(
    draft.dueDateISO ? new Date(draft.dueDateISO) : undefined,
  );
  handlers.setEstimation(draft.estimation);

  const boardId = resolveStoredDraftBoardId(
    draft,
    context.isMultiBoard,
    context.boardOptions,
  );
  if (boardId) handlers.setSelectedBoardId(boardId);
}

function readQuickCreateStoredDraft(
  storageKey: string,
): QuickCreateStoredDraft | null {
  const parsed = localStorageHelper.readItem(storageKey);
  return isQuickCreateStoredDraft(parsed) ? parsed : null;
}

function isQuickCreateStoredDraft(
  value: unknown,
): value is QuickCreateStoredDraft {
  if (!value || typeof value !== "object") return false;
  return (value as QuickCreateStoredDraft).v === QUICK_CREATE_DRAFT_VERSION;
}

function resolveStoredDraftBoardId(
  draft: QuickCreateStoredDraft,
  isMultiBoard: boolean,
  boardOptions?: QuickCreateTaskRowBoardOption[],
): string | null {
  if (!isMultiBoard || !draft.selectedBoardId || !boardOptions) return null;
  const isAllowed = boardOptions.some(
    (board) => board.id === draft.selectedBoardId,
  );
  return isAllowed ? draft.selectedBoardId : null;
}

function sameCalendarDay(a: Date | undefined, b: Date | undefined): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export interface QuickCreateDraftComparisonContext {
  defaultStatus: TaskStatus;
  defaultPriority: TaskPriority;
  defaultScheduleDate: Date | undefined;
  defaultBoardId: string | undefined;
  isMultiBoard: boolean;
}

export interface QuickCreateDraftHydrationContext {
  defaultScheduleDate: Date | undefined;
  isMultiBoard: boolean;
  boardOptions?: QuickCreateTaskRowBoardOption[];
}

export interface QuickCreateDraftHydrationHandlers {
  setTitle: (title: string) => void;
  setStatus: (status: TaskStatus) => void;
  setPriority: (priority: TaskPriority) => void;
  setScheduleDate: (date: Date | undefined) => void;
  setDueDate: (date: Date | undefined) => void;
  setEstimation: (estimation: number | undefined) => void;
  setSelectedBoardId: (boardId: string) => void;
}
