export type CalendarEventKind = "time_block" | "mutual" | "task_event";

export interface CalendarBacklogItem {
  id: string;
  kind: CalendarEventKind;
  title: string;
  defaultDurationMinutes: number;
  taskScope?: string[];
  attendeesNote?: string;
  linkedTaskSummary?: string;
}

export interface CalendarScheduledEvent {
  id: string;
  kind: CalendarEventKind;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  taskScope?: string[];
  attendeesNote?: string;
  linkedTaskSummary?: string;
}

export interface CalendarPersistedState {
  version: 1;
  events: CalendarScheduledEvent[];
  backlog: CalendarBacklogItem[];
}
