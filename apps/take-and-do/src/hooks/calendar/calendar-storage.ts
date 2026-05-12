import { normalizeAxisTimeZones } from "@/components/Calendar/calendar-axis-time";

import { normalizeHexColor } from "@/components/Calendar/calendar-colors";

import type {
  CalendarBacklogEvent,
  CalendarBacklogType,
  CalendarEvent,
  CalendarEventType,
  CalendarKindColorMap,
  CalendarPersistedState,
  CalendarRepeatRule,
  CalendarRsvpStatus,
  GoogleCalendarRecurrenceMeta,
} from "@/types/calendar.types";

export const CALENDAR_STORAGE_KEY = "take-and-do:calendar:v1";

const DEFAULT_BACKLOG: CalendarBacklogEvent[] = [
  {
    id: "seed-block-gym",
    type: "timeBlock",
    title: "Gym Training",
    durationMinutes: 90,
    taskScope: ["Warm-up", "Main lifts", "Cooldown"],
  },
  {
    id: "seed-block-engineering",
    type: "timeBlock",
    title: "Engineering Session",
    durationMinutes: 120,
    taskScope: ["Review PRs", "Implement feature"],
  },
  {
    id: "seed-block-focus",
    type: "timeBlock",
    title: "Work Focus",
    durationMinutes: 60,
  },
  {
    id: "seed-general-sync",
    type: "common",
    title: "Team sync",
    durationMinutes: 30,
  },
];

function defaultState(): CalendarPersistedState {
  return {
    version: 1,
    events: [],
    backlog: DEFAULT_BACKLOG,
    axisTimeZones: normalizeAxisTimeZones(undefined),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function migrateEventType(value: unknown): CalendarEventType | null {
  if (value === "timeBlock" || value === "common" || value === "task") {
    return value;
  }
  // Back-compat for old persisted values.
  if (value === "time_block") return "timeBlock";
  if (value === "general" || value === "mutual") return "common";
  if (value === "task_event") return "task";
  return null;
}

function migrateBacklogKind(value: unknown): CalendarBacklogType | null {
  const k = migrateEventType(value);
  if (k === "timeBlock" || k === "common") return k;
  return null;
}

function isRsvp(value: unknown): value is CalendarRsvpStatus {
  return value === "yes" || value === "no" || value === "maybe";
}

function isRepeatRule(value: unknown): value is CalendarRepeatRule {
  return value === "daily" || value === "weekly" || value === "monthly";
}

function normalizeGoogleRecurrence(
  raw: unknown,
): GoogleCalendarRecurrenceMeta | undefined {
  if (!isRecord(raw)) return undefined;
  const recurringEventId = raw.recurringEventId;
  if (typeof recurringEventId !== "string" || !recurringEventId) {
    return undefined;
  }
  const originalStart = raw.originalStart;
  const originalAllDay = raw.originalAllDay;
  if (typeof originalStart === "string" && originalStart.trim()) {
    if (typeof originalAllDay === "boolean") {
      return { recurringEventId, originalStart, originalAllDay };
    }
    return { recurringEventId, originalStart };
  }
  return { recurringEventId };
}

function normalizeBacklogItem(raw: unknown): CalendarBacklogEvent | null {
  if (!isRecord(raw)) return null;
  const id = raw.id;
  const title = raw.title;
  const kindRaw = raw.type ?? raw.kind;
  const durationMinutesRaw = raw.durationMinutes ?? raw.defaultDurationMinutes;
  if (typeof id !== "string" || !id) return null;
  if (typeof title !== "string" || !title) return null;
  const type = migrateBacklogKind(kindRaw);
  if (!type) return null;
  if (typeof durationMinutesRaw !== "number" || durationMinutesRaw <= 0) {
    return null;
  }
  const taskScope = raw.taskScope;
  const description = raw.description;
  return {
    id,
    type,
    title,
    durationMinutes: durationMinutesRaw,
    ...(typeof description === "string" ? { description } : {}),
    ...(Array.isArray(taskScope) &&
    taskScope.every((l) => typeof l === "string")
      ? { taskScope: taskScope as string[] }
      : {}),
  };
}

function normalizeScheduledEvent(raw: unknown): CalendarEvent | null {
  if (!isRecord(raw)) return null;
  const id = raw.id;
  const title = raw.title;
  const type = migrateEventType(raw.type ?? raw.kind);
  const start = raw.start;
  const end = raw.end;
  const allDay = raw.allDay;
  if (typeof id !== "string" || !id) return null;
  if (typeof title !== "string" || !title) return null;
  if (!type) return null;
  if (typeof start !== "string" || typeof end !== "string") return null;
  if (typeof allDay !== "boolean") return null;
  const taskScope = raw.taskScope;
  const taskBoardId = raw.taskBoardId;
  const taskId = raw.taskId;
  const taskSummarySnapshot = raw.taskSummarySnapshot;
  const rsvpStatus = raw.rsvpStatus;
  const rsvpDeclineReason = raw.rsvpDeclineReason;
  const description = raw.description;
  const timeZone = raw.timeZone;
  const repeat = raw.repeat;
  const meetingUrl = raw.meetingUrl;
  const participants = raw.participants;
  const notes = raw.notes ?? raw.notesAndDocs;
  const reminderMinutes = raw.reminderMinutes;
  const googleRecurrence = normalizeGoogleRecurrence(raw.googleRecurrence);
  const colorRaw = raw.color;
  const color =
    typeof colorRaw === "string" ? normalizeHexColor(colorRaw) : undefined;
  const base = {
    id,
    type,
    title,
    start,
    end,
    allDay,
    ...(typeof timeZone === "string" && timeZone ? { timeZone } : {}),
    ...(isRepeatRule(repeat) ? { repeat } : {}),
    ...(typeof meetingUrl === "string" && meetingUrl ? { meetingUrl } : {}),
    ...(typeof reminderMinutes === "number" && reminderMinutes >= 0
      ? { reminderMinutes }
      : {}),
    ...(Array.isArray(participants) &&
    participants.every((p) => typeof p === "string")
      ? { participants: participants as string[] }
      : {}),
    ...(typeof notes === "string" ? { notes } : {}),
    ...(typeof description === "string" ? { description } : {}),
    ...(color ? { color } : {}),
  } as const;

  if (type === "task") {
    if (typeof taskBoardId !== "string" || !taskBoardId) return null;
    if (typeof taskId !== "string" || !taskId) return null;
    return {
      ...base,
      type: "task",
      taskBoardId,
      taskId,
      ...(typeof taskSummarySnapshot === "string" && taskSummarySnapshot
        ? { taskSummarySnapshot }
        : {}),
    };
  }

  if (type === "timeBlock") {
    return {
      ...base,
      type: "timeBlock",
      ...(Array.isArray(taskScope) &&
      taskScope.every((l) => typeof l === "string")
        ? { taskScope: taskScope as string[] }
        : {}),
    };
  }

  // Common event
  return {
    ...base,
    type: "common",
    ...(isRsvp(rsvpStatus) ? { rsvpStatus } : {}),
    ...(typeof rsvpDeclineReason === "string" ? { rsvpDeclineReason } : {}),
    ...(googleRecurrence ? { googleRecurrence } : {}),
  };
}

function normalizeKindColors(raw: unknown): CalendarKindColorMap | undefined {
  if (!isRecord(raw)) return undefined;
  const out: CalendarKindColorMap = {};
  for (const kind of ["timeBlock", "common", "task"] as const) {
    const v = raw[kind];
    if (typeof v !== "string") continue;
    const hex = normalizeHexColor(v);
    if (hex) out[kind] = hex;
  }
  return Object.keys(out).length ? out : undefined;
}

export function readCalendarState(): CalendarPersistedState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = window.localStorage.getItem(CALENDAR_STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed) || parsed.version !== 1) return defaultState();
    const eventsRaw = parsed.events;
    const backlogRaw = parsed.backlog;
    if (!Array.isArray(eventsRaw) || !Array.isArray(backlogRaw)) {
      return defaultState();
    }
    const events = eventsRaw
      .map(normalizeScheduledEvent)
      .filter((e): e is CalendarEvent => e !== null);
    const backlogParsed = backlogRaw
      .map(normalizeBacklogItem)
      .filter((b): b is CalendarBacklogEvent => b !== null);
    const backlog = backlogParsed.length > 0 ? backlogParsed : DEFAULT_BACKLOG;
    const axisTimeZones = normalizeAxisTimeZones(parsed.axisTimeZones);
    const kindColors = normalizeKindColors(parsed.kindColors);
    const googleCalendarColor = normalizeHexColor(parsed.googleCalendarColor);
    return {
      version: 1,
      events,
      backlog,
      axisTimeZones,
      ...(kindColors ? { kindColors } : {}),
      ...(googleCalendarColor ? { googleCalendarColor } : {}),
    };
  } catch {
    return defaultState();
  }
}

export function writeCalendarState(next: CalendarPersistedState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage may be unavailable */
  }
}

const GCAL_PREFIX = "gcal:";

export const GOOGLE_CALENDAR_DISCONNECTED_EVENT =
  "take-and-do:google-calendar-disconnected";

export function removeImportedGoogleCalendarEvents(): void {
  if (typeof window === "undefined") return;
  const current = readCalendarState();
  const filtered = current.events.filter((e) => !e.id.startsWith(GCAL_PREFIX));
  if (filtered.length === current.events.length) return;
  writeCalendarState({ ...current, events: filtered });
}
