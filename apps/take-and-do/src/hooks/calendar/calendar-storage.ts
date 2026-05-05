import type {
  CalendarBacklogItem,
  CalendarBacklogKind,
  CalendarEventKind,
  CalendarPersistedState,
  CalendarRsvpStatus,
  CalendarScheduledEvent,
} from "@/types/calendar.types";

export const CALENDAR_STORAGE_KEY = "take-and-do:calendar:v1";

const DEFAULT_BACKLOG: CalendarBacklogItem[] = [
  {
    id: "seed-block-gym",
    kind: "time_block",
    title: "Gym Training",
    defaultDurationMinutes: 90,
    taskScope: ["Warm-up", "Main lifts", "Cooldown"],
  },
  {
    id: "seed-block-engineering",
    kind: "time_block",
    title: "Engineering Session",
    defaultDurationMinutes: 120,
    taskScope: ["Review PRs", "Implement feature"],
  },
  {
    id: "seed-block-focus",
    kind: "time_block",
    title: "Work Focus",
    defaultDurationMinutes: 60,
  },
  {
    id: "seed-general-sync",
    kind: "general",
    title: "Team sync",
    defaultDurationMinutes: 30,
    attendeesNote: "Core team",
  },
];

function defaultState(): CalendarPersistedState {
  return { version: 1, events: [], backlog: DEFAULT_BACKLOG };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function migrateEventKind(value: unknown): CalendarEventKind | null {
  if (value === "time_block" || value === "general" || value === "task_event") {
    return value;
  }
  if (value === "mutual") return "general";
  return null;
}

function migrateBacklogKind(value: unknown): CalendarBacklogKind | null {
  const k = migrateEventKind(value);
  if (k === "time_block" || k === "general") return k;
  return null;
}

function isRsvp(value: unknown): value is CalendarRsvpStatus {
  return value === "yes" || value === "no" || value === "maybe";
}

function normalizeBacklogItem(raw: unknown): CalendarBacklogItem | null {
  if (!isRecord(raw)) return null;
  const id = raw.id;
  const title = raw.title;
  const kindRaw = raw.kind;
  const defaultDurationMinutes = raw.defaultDurationMinutes;
  if (typeof id !== "string" || !id) return null;
  if (typeof title !== "string" || !title) return null;
  const kind = migrateBacklogKind(kindRaw);
  if (!kind) return null;
  if (
    typeof defaultDurationMinutes !== "number" ||
    defaultDurationMinutes <= 0
  ) {
    return null;
  }
  const taskScope = raw.taskScope;
  const attendeesNote = raw.attendeesNote;
  return {
    id,
    kind,
    title,
    defaultDurationMinutes,
    ...(Array.isArray(taskScope) &&
    taskScope.every((l) => typeof l === "string")
      ? { taskScope: taskScope as string[] }
      : {}),
    ...(typeof attendeesNote === "string" ? { attendeesNote } : {}),
  };
}

function normalizeScheduledEvent(raw: unknown): CalendarScheduledEvent | null {
  if (!isRecord(raw)) return null;
  const id = raw.id;
  const title = raw.title;
  const kind = migrateEventKind(raw.kind);
  const start = raw.start;
  const end = raw.end;
  const allDay = raw.allDay;
  if (typeof id !== "string" || !id) return null;
  if (typeof title !== "string" || !title) return null;
  if (!kind) return null;
  if (typeof start !== "string" || typeof end !== "string") return null;
  if (typeof allDay !== "boolean") return null;
  const taskScope = raw.taskScope;
  const attendeesNote = raw.attendeesNote;
  const linkedTaskSummary = raw.linkedTaskSummary;
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
  const notesAndDocs = raw.notesAndDocs;
  return {
    id,
    kind,
    title,
    start,
    end,
    allDay,
    ...(typeof timeZone === "string" && timeZone ? { timeZone } : {}),
    ...(typeof repeat === "string" && repeat ? { repeat } : {}),
    ...(typeof meetingUrl === "string" && meetingUrl ? { meetingUrl } : {}),
    ...(Array.isArray(participants) &&
    participants.every((p) => typeof p === "string")
      ? { participants: participants as string[] }
      : {}),
    ...(typeof notesAndDocs === "string" ? { notesAndDocs } : {}),
    ...(Array.isArray(taskScope) &&
    taskScope.every((l) => typeof l === "string")
      ? { taskScope: taskScope as string[] }
      : {}),
    ...(typeof attendeesNote === "string" ? { attendeesNote } : {}),
    ...(typeof linkedTaskSummary === "string" ? { linkedTaskSummary } : {}),
    ...(typeof taskBoardId === "string" && taskBoardId ? { taskBoardId } : {}),
    ...(typeof taskId === "string" && taskId ? { taskId } : {}),
    ...(typeof taskSummarySnapshot === "string" ? { taskSummarySnapshot } : {}),
    ...(isRsvp(rsvpStatus) ? { rsvpStatus } : {}),
    ...(typeof rsvpDeclineReason === "string" ? { rsvpDeclineReason } : {}),
    ...(typeof description === "string" ? { description } : {}),
  };
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
      .filter((e): e is CalendarScheduledEvent => e !== null);
    const backlogParsed = backlogRaw
      .map(normalizeBacklogItem)
      .filter((b): b is CalendarBacklogItem => b !== null);
    const backlog = backlogParsed.length > 0 ? backlogParsed : DEFAULT_BACKLOG;
    return { version: 1, events, backlog };
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
