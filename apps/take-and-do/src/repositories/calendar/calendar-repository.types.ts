import type { CalendarEventPatchBody } from "@/db/dtos/calendar-events.dto";
import type {
  CalendarAxisTimeZone,
  CalendarBacklogEvent,
  CalendarEvent,
  CalendarPersistedState,
  GoogleCalendarRecurrenceScope,
} from "@/types/calendar.types";

export interface CalendarRepository {
  isLocalCalendar: boolean;
  state: CalendarPersistedState | null;
  bumpServerCalendar: () => void;

  addScheduled: (event: CalendarEvent) => void;
  patchScheduled: (id: string, patch: CalendarEventPatch) => void;
  patchScheduledForGoogleScope: (
    anchorId: string,
    patch: CalendarEventPatch,
    scope: GoogleCalendarRecurrenceScope,
  ) => void;
  replaceScheduled: (event: CalendarEvent) => void;
  replaceScheduledForGoogleScope: (
    event: CalendarEvent,
    scope: GoogleCalendarRecurrenceScope,
  ) => void;
  removeScheduled: (id: string) => void;
  addBacklogItem: (item: CalendarBacklogEvent) => void;
  removeBacklogItem: (id: string) => void;
  updateBacklogItem: (id: string, patch: Partial<CalendarBacklogEvent>) => void;
  mergeScheduledEvents: (events: CalendarEvent[]) => void;
  mergeGoogleCalendarSync: (
    imported: CalendarEvent[],
    opts: {
      incremental: boolean;
      syncRange?: { timeMin: string; timeMax: string };
      googleCalendarColor?: string;
    },
  ) => void;
  removeGoogleImportedEvents: () => void;
  removeGoogleSeriesByMasterId: (recurringMasterId: string) => void;
  removeGoogleInstancesForScope: (
    anchor: CalendarEvent,
    scope: GoogleCalendarRecurrenceScope,
  ) => void;
  setAxisTimeZones: (next: CalendarAxisTimeZone[]) => void;
  setInternalCalendarColor: (color: string | null) => void;
  setGoogleCalendarColor: (color: string | null) => void;
  syncExternalGridEvents: (blocks: CalendarEvent[]) => void;

  createCalendarEvent: (event: CalendarEvent) => Promise<CalendarEvent | null>;
  updateCalendarEvent: (
    id: string,
    patch: CalendarEventPatchBody,
  ) => Promise<CalendarEvent | null>;
  deleteCalendarEvent: (id: string) => Promise<boolean>;
}

export type CalendarEventPatch = Partial<{
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  reminderMinutes: number;
  timeZone: string;
  repeat: CalendarEvent["repeat"];
  meetingUrl: string;
  participants: string[];
  notes: string;
  description: string;
  taskSummarySnapshot: string;
  rsvpStatus: "yes" | "no" | "maybe";
  rsvpDeclineReason: string;
  color: string | null;
}>;
