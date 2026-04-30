import type {
  CalendarBacklogItem,
  CalendarPersistedState,
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
    id: "seed-mutual-sync",
    kind: "mutual",
    title: "Team sync",
    defaultDurationMinutes: 30,
    attendeesNote: "Core team",
  },
  {
    id: "seed-task-deep",
    kind: "task_event",
    title: "Ship milestone task",
    defaultDurationMinutes: 90,
    linkedTaskSummary: "Finish calendar integration",
  },
];

function defaultState(): CalendarPersistedState {
  return { version: 1, events: [], backlog: DEFAULT_BACKLOG };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEventKind(
  value: unknown,
): value is CalendarPersistedState["events"][0]["kind"] {
  return value === "time_block" || value === "mutual" || value === "task_event";
}

function normalizeBacklogItem(raw: unknown): CalendarBacklogItem | null {
  if (!isRecord(raw)) return null;
  const id = raw.id;
  const title = raw.title;
  const kind = raw.kind;
  const defaultDurationMinutes = raw.defaultDurationMinutes;
  if (typeof id !== "string" || !id) return null;
  if (typeof title !== "string" || !title) return null;
  if (!isEventKind(kind)) return null;
  if (
    typeof defaultDurationMinutes !== "number" ||
    defaultDurationMinutes <= 0
  ) {
    return null;
  }
  const taskScope = raw.taskScope;
  const attendeesNote = raw.attendeesNote;
  const linkedTaskSummary = raw.linkedTaskSummary;
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
    ...(typeof linkedTaskSummary === "string" ? { linkedTaskSummary } : {}),
  };
}

function normalizeScheduledEvent(raw: unknown): CalendarScheduledEvent | null {
  if (!isRecord(raw)) return null;
  const id = raw.id;
  const title = raw.title;
  const kind = raw.kind;
  const start = raw.start;
  const end = raw.end;
  const allDay = raw.allDay;
  if (typeof id !== "string" || !id) return null;
  if (typeof title !== "string" || !title) return null;
  if (!isEventKind(kind)) return null;
  if (typeof start !== "string" || typeof end !== "string") return null;
  if (typeof allDay !== "boolean") return null;
  const taskScope = raw.taskScope;
  const attendeesNote = raw.attendeesNote;
  const linkedTaskSummary = raw.linkedTaskSummary;
  return {
    id,
    kind,
    title,
    start,
    end,
    allDay,
    ...(Array.isArray(taskScope) &&
    taskScope.every((l) => typeof l === "string")
      ? { taskScope: taskScope as string[] }
      : {}),
    ...(typeof attendeesNote === "string" ? { attendeesNote } : {}),
    ...(typeof linkedTaskSummary === "string" ? { linkedTaskSummary } : {}),
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
