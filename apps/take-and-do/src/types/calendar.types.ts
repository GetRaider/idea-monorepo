export type CalendarEventType = "common" | "timeBlock" | "task";

/** IANA time zone, e.g. "Europe/Warsaw". */
export type CalendarTimeZone = string;

/** Repeat rules supported by the UI (no RRULE yet). */
export type CalendarRepeatRule = "daily" | "weekly" | "monthly";

/** UI value type for dropdowns that include “does not repeat”. */
export type CalendarRepeatValue = "" | CalendarRepeatRule;

export interface CalendarKindVisibility {
  common: boolean;
  timeBlock: boolean;
  task: boolean;
}

export type CalendarBacklogType = "timeBlock" | "common";

export type CalendarRsvpStatus = "yes" | "no" | "maybe";

export interface CalendarBacklogEvent {
  id: string;
  type: CalendarBacklogType;
  title: string;
  durationMinutes: number;
  description?: string;
  taskScope?: string[];
}

export interface BaseCalendarEvent {
  id: string;
  type: CalendarEventType;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  reminderMinutes?: number;
  timeZone?: CalendarTimeZone;
  repeat?: CalendarRepeatRule;
}

export interface CommonCalendarEvent extends BaseCalendarEvent {
  type: "common";
  meetingUrl?: string;
  /** Selected participants (emails / names). */
  participants?: string[];
  /** Freeform notes or link placeholder. */
  notes?: string;
  /** Longer notes shown in quick actions / full editor */
  description?: string;
  rsvpStatus?: CalendarRsvpStatus;
  rsvpDeclineReason?: string;
}

export interface TimeBlockCalendarEvent extends BaseCalendarEvent {
  type: "timeBlock";
  taskScope?: string[];
  meetingUrl?: string;
  participants?: string[];
  notes?: string;
  description?: string;
}

export interface TaskCalendarEvent extends BaseCalendarEvent {
  type: "task";
  taskBoardId: string;
  taskId: string;
  taskSummarySnapshot?: string;
  description?: string;
}

export type CalendarEvent =
  | CommonCalendarEvent
  | TimeBlockCalendarEvent
  | TaskCalendarEvent;

export interface CalendarCreatePrefill {
  title?: string;
  description?: string;
  type?: CalendarEventType;
}

/** One column in the planning calendar time axis (slot labels + header). */
export interface CalendarAxisTimeZone {
  id: string;
  /** Use `__local__` for the device timezone (updates if the user moves). */
  iana: string;
  /** Optional short header label (e.g. "EU"); when empty, an abbreviation is derived. */
  label?: string | null;
}

export interface CalendarPersistedState {
  version: 1;
  events: CalendarEvent[];
  backlog: CalendarBacklogEvent[];
  axisTimeZones?: CalendarAxisTimeZone[];
}
