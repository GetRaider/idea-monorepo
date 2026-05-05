export type CalendarEventKind = "time_block" | "general" | "task_event";

/** Sidebar toggles for which event kinds appear on the grid. */
export interface CalendarKindVisibility {
  time_block: boolean;
  general: boolean;
  task_event: boolean;
}

/** Backlog templates: only time blocks and general events (not tasks). */
export type CalendarBacklogKind = "time_block" | "general";

export type CalendarRsvpStatus = "yes" | "no" | "maybe";

export interface CalendarBacklogItem {
  id: string;
  kind: CalendarBacklogKind;
  title: string;
  defaultDurationMinutes: number;
  taskScope?: string[];
  attendeesNote?: string;
}

export interface CalendarScheduledEvent {
  id: string;
  kind: CalendarEventKind;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  /** IANA time zone, e.g. "Europe/Warsaw". */
  timeZone?: string;
  /** Simple repeat label for now (e.g. "daily", "weekly"). */
  repeat?: string;
  /** Meeting URL / conference link. */
  meetingUrl?: string;
  /** Selected participants (emails / names). */
  participants?: string[];
  /** Freeform notes or link placeholder. */
  notesAndDocs?: string;
  taskScope?: string[];
  /** Formerly "mutual"; general events (meetings, shared time). */
  attendeesNote?: string;
  /** @deprecated Prefer taskBoardId + taskId for task_event */
  linkedTaskSummary?: string;
  taskBoardId?: string;
  taskId?: string;
  /** Cached task title when linked to a board task */
  taskSummarySnapshot?: string;
  /** Longer notes shown in quick actions / full editor */
  description?: string;
  rsvpStatus?: CalendarRsvpStatus;
  rsvpDeclineReason?: string;
}

export interface CalendarCreatePrefill {
  title?: string;
  description?: string;
  kind?: CalendarEventKind;
}

export interface CalendarPersistedState {
  version: 1;
  events: CalendarScheduledEvent[];
  backlog: CalendarBacklogItem[];
}
