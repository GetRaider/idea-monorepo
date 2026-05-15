import { normalizeHexColor } from "@/helpers/calendar/calendar-colors";
import {
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
  toLocalDateInputValue,
} from "@/helpers/calendar/datetime-local";
import type {
  CalendarEvent,
  CalendarEventType,
  CalendarRepeatValue,
  CalendarTimeZone,
} from "@/types/calendar.types";

export type CommonCreateDestination = "internal" | "google";

export interface CalendarEventEditorDraft {
  title: string;
  type: CalendarEventType;
  start: string;
  end: string;
  allDay: boolean;
  reminderMinutes: string;
  taskScope: string[];
  descriptionText: string;
  notesText: string;
  participantsText: string;
  timeZone: CalendarTimeZone;
  repeat: CalendarRepeatValue;
  meetingUrlText: string;
  taskBoardId: string;
  taskId: string;
  taskSummarySnapshot: string;
  colorHex: string;
}

export function emptyCalendarEventEditorDraft(
  now: Date,
): CalendarEventEditorDraft {
  const end = new Date(now.getTime() + 60 * 60 * 1000);
  return {
    title: "",
    type: "timeBlock",
    start: toDatetimeLocalValue(now),
    end: toDatetimeLocalValue(end),
    allDay: false,
    reminderMinutes: "",
    taskScope: [],
    descriptionText: "",
    notesText: "",
    participantsText: "",
    timeZone: "",
    repeat: "",
    meetingUrlText: "",
    taskBoardId: "",
    taskId: "",
    taskSummarySnapshot: "",
    colorHex: "",
  };
}

export function calendarEventToEditorDraft(
  e: CalendarEvent,
): CalendarEventEditorDraft {
  const start = new Date(e.start);
  const end = new Date(e.end);
  return {
    title: e.title,
    type: e.type,
    start: e.allDay
      ? `${toLocalDateInputValue(start)}T00:00`
      : toDatetimeLocalValue(start),
    end: e.allDay
      ? `${toLocalDateInputValue(end)}T00:00`
      : toDatetimeLocalValue(end),
    allDay: e.allDay,
    reminderMinutes:
      typeof e.reminderMinutes === "number" ? String(e.reminderMinutes) : "",
    taskScope: e.type === "timeBlock" ? (e.taskScope ?? []) : [],
    descriptionText: e.description ?? "",
    notesText: e.type !== "task" ? (e.notes ?? "") : "",
    participantsText:
      e.type !== "task" ? (e.participants ?? []).join(", ") : "",
    timeZone: e.timeZone ?? "",
    repeat: e.repeat ?? "",
    meetingUrlText: e.type !== "task" ? (e.meetingUrl ?? "") : "",
    taskBoardId: e.type === "task" ? e.taskBoardId : "",
    taskId: e.type === "task" ? e.taskId : "",
    taskSummarySnapshot: e.type === "task" ? (e.taskSummarySnapshot ?? "") : "",
    colorHex: normalizeHexColor(e.color) ?? "",
  };
}

export function editorDraftToScheduledEvent(
  draft: CalendarEventEditorDraft,
  id: string | undefined,
  preserve: CalendarEvent | null,
): CalendarEvent | null {
  if (!draft.title.trim()) return null;
  if (draft.type === "task") {
    if (!draft.taskBoardId.trim() || !draft.taskId.trim()) {
      return null;
    }
  }
  const taskScopeLines = draft.taskScope.map((t) => t.trim()).filter(Boolean);
  const participants = draft.participantsText
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  let startIso: string;
  let endIso: string;

  if (draft.allDay) {
    const startDay = draft.start.slice(0, 10);
    const endDay = draft.end.slice(0, 10);
    const [sy, sm, sd] = startDay.split("-").map((x) => parseInt(x, 10));
    const [ey, em, ed] = endDay.split("-").map((x) => parseInt(x, 10));
    if (
      [sy, sm, sd, ey, em, ed].some((n) => Number.isNaN(n)) ||
      endDay < startDay
    ) {
      return null;
    }
    const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
    const end = new Date(ey, em - 1, ed, 23, 59, 59, 999);
    startIso = start.toISOString();
    endIso = end.toISOString();
  } else {
    const start = fromDatetimeLocalValue(draft.start);
    const end = fromDatetimeLocalValue(draft.end);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return null;
    }
    if (end.getTime() <= start.getTime()) return null;
    startIso = start.toISOString();
    endIso = end.toISOString();
  }

  const base = {
    id: id ?? crypto.randomUUID(),
    title: draft.title.trim().slice(0, 200),
    start: startIso,
    end: endIso,
    allDay: draft.allDay,
    ...(draft.reminderMinutes.trim() &&
    !Number.isNaN(Number(draft.reminderMinutes)) &&
    Number(draft.reminderMinutes) >= 0
      ? { reminderMinutes: Number(draft.reminderMinutes) }
      : {}),
    ...(draft.timeZone.trim() ? { timeZone: draft.timeZone.trim() } : {}),
    ...(draft.repeat ? { repeat: draft.repeat } : {}),
    ...(draft.meetingUrlText.trim()
      ? { meetingUrl: draft.meetingUrlText.trim() }
      : {}),
    ...(participants.length ? { participants } : {}),
    ...(draft.notesText.trim() ? { notes: draft.notesText.trim() } : {}),
    description: draft.descriptionText.trim() || undefined,
  } as const;

  const event: CalendarEvent =
    draft.type === "task"
      ? {
          ...base,
          type: "task",
          taskBoardId: draft.taskBoardId.trim(),
          taskId: draft.taskId.trim(),
          ...(draft.taskSummarySnapshot.trim()
            ? { taskSummarySnapshot: draft.taskSummarySnapshot.trim() }
            : {}),
        }
      : draft.type === "timeBlock"
        ? {
            ...base,
            type: "timeBlock",
            ...(taskScopeLines.length ? { taskScope: taskScopeLines } : {}),
            ...(draft.notesText.trim()
              ? { notes: draft.notesText.trim() }
              : {}),
          }
        : {
            ...base,
            type: "common",
            ...(draft.notesText.trim()
              ? { notes: draft.notesText.trim() }
              : {}),
          };

  const pickedColor = normalizeHexColor(draft.colorHex);
  const normalized: CalendarEvent = pickedColor
    ? { ...event, color: pickedColor }
    : (() => {
        const copy = { ...event };
        delete (copy as { color?: string }).color;
        return copy as CalendarEvent;
      })();

  if (preserve) {
    return {
      ...normalized,
      ...(preserve.type === "common"
        ? {
            rsvpStatus: preserve.rsvpStatus,
            rsvpDeclineReason: preserve.rsvpDeclineReason,
            ...(preserve.googleRecurrence
              ? { googleRecurrence: preserve.googleRecurrence }
              : {}),
          }
        : {}),
    };
  }

  return normalized;
}
