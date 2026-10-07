import { httpClient } from "@repo/api/helpers";
import {
  formatGoogleEventDescription,
  formatWallDate,
  formatWallDateTime,
  parseGoogleEventDescription,
  recurrenceToRrule,
  rruleToRecurrence,
  wallTimeToUtc,
  type CalendarEvent,
  type CalendarRsvpStatus,
  type TaskRecurrence,
} from "@repo/api/todex";

const GOOGLE_CALENDAR = "https://www.googleapis.com/calendar/v3";

export async function googleCalendarRequest<T>(input: {
  method: "get" | "post" | "patch" | "put" | "delete";
  accessToken: string;
  path: string;
  query?: Record<string, string>;
  body?: unknown;
  etag?: string | null;
}): Promise<{ status: number; data: T; etag: string | null }> {
  const url = new URL(`${GOOGLE_CALENDAR}${input.path}`);
  for (const [key, value] of Object.entries(input.query ?? {})) {
    url.searchParams.set(key, value);
  }
  const headers: Record<string, string> = {
    Authorization: `Bearer ${input.accessToken}`,
    Accept: "application/json",
  };
  if (input.body !== undefined) headers["Content-Type"] = "application/json";
  if (input.etag) headers["If-Match"] = input.etag;
  const response = await httpClient[input.method]<T>({
    url: url.toString(),
    headers,
    body: input.body,
  });
  const headerEtag = headerValue(response.headers, "etag");
  return { status: response.status, data: response.data, etag: headerEtag };
}

export function googleEventBody(
  event: CalendarEvent,
  taskSummaries: string[],
  selfEmail: string,
): Record<string, unknown> {
  const description = formatGoogleEventDescription({
    taskSummaries,
    description: event.description,
  });
  const when = event.allDay
    ? {
        start: { date: formatWallDate(new Date(event.start), event.timeZone) },
        end: { date: formatWallDate(new Date(event.end), event.timeZone) },
      }
    : {
        start: {
          dateTime: formatWallDateTime(new Date(event.start), event.timeZone),
          timeZone: event.timeZone,
        },
        end: {
          dateTime: formatWallDateTime(new Date(event.end), event.timeZone),
          timeZone: event.timeZone,
        },
      };
  const recurrence = googleRecurrence(event);
  const attendees = googleAttendees(event, selfEmail);
  return {
    summary: event.title,
    description,
    ...when,
    ...(recurrence ? { recurrence } : {}),
    attendees,
    extendedProperties: {
      private: {
        todexEventId: event.seriesEventId ?? event.id,
        todexTaskIds: event.taskScope.join(","),
      },
    },
  };
}

export function googleInstanceId(
  masterGoogleId: string,
  originalStart: Date,
  allDay: boolean,
  timeZone: string,
): string {
  if (allDay) {
    return `${masterGoogleId}_${formatWallDate(originalStart, timeZone).replace(/-/g, "")}`;
  }
  const stamp = originalStart
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  return `${masterGoogleId}_${stamp}`;
}

export function readGoogleEvent(item: GoogleCalendarApiEvent): GoogleEventDraft | null {
  if (!item.id || !item.start) return null;
  const timeZone =
    item.start.timeZone ||
    item.end?.timeZone ||
    item.originalStartTime?.timeZone ||
    "UTC";
  const start = readGoogleEndpoint(item.start, timeZone);
  const end = item.end ? readGoogleEndpoint(item.end, timeZone) : null;
  if (!start || !end || end.getTime() <= start.getTime()) return null;
  const parsedDescription = parseGoogleEventDescription(item.description ?? "");
  const recurrence = item.recurrence?.filter((rule) => rule.startsWith("RRULE:"));
  const parsedRule = rruleToRecurrence(recurrence, timeZone);
  const rawRrule =
    recurrence && recurrence.length > 0 && !parsedRule
      ? (recurrence[0] ?? null)
      : null;
  const self = item.attendees?.find((attendee) => attendee.self);
  const original = item.originalStartTime
    ? readGoogleEndpoint(item.originalStartTime, timeZone)
    : null;
  return {
    googleEventId: item.id,
    cancelled: item.status === "cancelled",
    title: item.summary?.trim() || "(No title)",
    start,
    end,
    allDay: Boolean(item.start.date),
    timeZone,
    recurrence: parsedRule,
    rawRrule,
    description: parsedDescription.description,
    scopeLines: parsedDescription.scopeLines,
    taskIds: (item.extendedProperties?.private?.todexTaskIds ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id.length > 0),
    todexEventId: item.extendedProperties?.private?.todexEventId ?? null,
    participants: (item.attendees ?? [])
      .filter((attendee) => attendee.email && !attendee.self)
      .map((attendee) => attendee.email as string),
    rsvpStatus: readRsvp(self?.responseStatus),
    organizerSelf: item.organizer?.self !== false,
    recurringEventId: item.recurringEventId ?? null,
    originalStart: original,
    etag: item.etag ?? null,
    updated: item.updated ? new Date(item.updated) : new Date(),
  };
}

function googleRecurrence(event: CalendarEvent): string[] | undefined {
  if (event.seriesEventId) return undefined;
  if (event.recurrence) return [recurrenceToRrule(event.recurrence)];
  if (!event.rawRrule) return undefined;
  return [
    event.rawRrule.startsWith("RRULE:")
      ? event.rawRrule
      : `RRULE:${event.rawRrule}`,
  ];
}

function googleAttendees(
  event: CalendarEvent,
  selfEmail: string,
): Array<{ email: string; self?: boolean; responseStatus: string }> {
  const responseStatus = toGoogleRsvp(event.rsvpStatus);
  const attendees: Array<{
    email: string;
    self?: boolean;
    responseStatus: string;
  }> = [{ email: selfEmail, self: true, responseStatus }];
  for (const email of event.participants) {
    if (email.toLowerCase() === selfEmail.toLowerCase()) continue;
    attendees.push({ email, responseStatus: "needsAction" });
  }
  return attendees;
}

function toGoogleRsvp(status: CalendarRsvpStatus | null): string {
  if (status === "yes") return "accepted";
  if (status === "no") return "declined";
  if (status === "maybe") return "tentative";
  return "needsAction";
}

function readRsvp(status: string | undefined): CalendarRsvpStatus | null {
  if (status === "accepted") return "yes";
  if (status === "declined") return "no";
  if (status === "tentative") return "maybe";
  return null;
}

function readGoogleEndpoint(
  endpoint: GoogleCalendarEndpoint,
  timeZone: string,
): Date | null {
  if (endpoint.dateTime) {
    const parsed = new Date(endpoint.dateTime);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (!endpoint.date) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(endpoint.date);
  if (!match) return null;
  return wallTimeToUtc({
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    timeZone: endpoint.timeZone || timeZone,
  });
}

function headerValue(headers: unknown, name: string): string | null {
  if (!headers || typeof headers !== "object") return null;
  const record = headers as Record<string, unknown>;
  const value = record[name] ?? record[name.toLowerCase()];
  return typeof value === "string" ? value : null;
}

export interface GoogleCalendarApiEvent {
  id?: string;
  etag?: string;
  status?: string;
  summary?: string;
  description?: string;
  updated?: string;
  start?: GoogleCalendarEndpoint;
  end?: GoogleCalendarEndpoint;
  recurrence?: string[];
  recurringEventId?: string;
  originalStartTime?: GoogleCalendarEndpoint;
  organizer?: { self?: boolean; email?: string };
  attendees?: Array<{
    email?: string;
    self?: boolean;
    responseStatus?: string;
  }>;
  extendedProperties?: { private?: Record<string, string> };
}

export interface GoogleEventDraft {
  googleEventId: string;
  cancelled: boolean;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  timeZone: string;
  recurrence: TaskRecurrence | null;
  rawRrule: string | null;
  description: string;
  scopeLines: string[];
  taskIds: string[];
  todexEventId: string | null;
  participants: string[];
  rsvpStatus: CalendarRsvpStatus | null;
  organizerSelf: boolean;
  recurringEventId: string | null;
  originalStart: Date | null;
  etag: string | null;
  updated: Date;
}

interface GoogleCalendarEndpoint {
  date?: string;
  dateTime?: string;
  timeZone?: string;
}
