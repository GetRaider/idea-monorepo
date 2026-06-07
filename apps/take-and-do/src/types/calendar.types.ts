export type CalendarEventType = "common" | "timeBlock" | "task";

/** IANA time zone, e.g. "Europe/Warsaw". */
export type CalendarTimeZone = string;

/** Repeat rules supported by the UI (mapped to Google RRULE on sync). */
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

/** Edit scope for imported Google Calendar recurring events (API push only). */
export type GoogleCalendarRecurrenceScope = "instance" | "series" | "following";

/** Metadata from Google Calendar for recurring instances (`singleEvents=true`). */
export interface GoogleCalendarRecurrenceMeta {
  recurringEventId: string;
  /**
   * `originalStartTime` from Google when present. When omitted (some API rows),
   * push/delete “following” uses this instance’s `start` / `allDay` as the anchor.
   */
  originalStart?: string;
  originalAllDay?: boolean;
  /** Links split head/tail masters after “this and following” (shared extended property). */
  splitGroupId?: string;
}

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
  /** Custom fill `#rrggbb`; parent calendar / type color appears as a left stripe when it differs. */
  color?: string;
  reminderMinutes?: number;
  timeZone?: CalendarTimeZone;
  repeat?: CalendarRepeatRule;
}

export interface CommonCalendarEvent extends BaseCalendarEvent {
  type: "common";
  googleRecurrence?: GoogleCalendarRecurrenceMeta;
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
  rsvpStatus?: CalendarRsvpStatus;
  rsvpDeclineReason?: string;
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
  /** `#rrggbb` custom event fill */
  color?: string;
  /** When creating a common event, save to Google Calendar instead of local-only. */
  saveToGoogle?: boolean;
  /** Time blocks only; carried from quick create into the full editor. */
  taskScope?: string[];
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
  /** Panel + stripe “parent” color for local events (time blocks, tasks, internal common). */
  internalCalendarColor?: string;
  /** Panel + stripe “parent” color for the linked Google Calendar. */
  googleCalendarColor?: string;
}

export const DEFAULT_CALENDAR_KIND_VISIBILITY: CalendarKindVisibility = {
  timeBlock: true,
  common: true,
  task: true,
};
