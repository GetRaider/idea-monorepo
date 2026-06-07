import type { z } from "zod";

import { HttpError } from "@/lib/api/errors";
import {
  googleEventColorIdToHex,
  googleEventColorPatchFromHex,
  type GoogleCalendarColorPalettes,
} from "@/helpers/calendar/google-calendar-event-colors";
import { normalizeHexColor } from "@/helpers/calendar/calendar-colors";
import {
  parseGoogleRecurrenceToCalendarRepeat,
  calendarRepeatToGoogleRecurrence,
} from "@/helpers/calendar/google-calendar-repeat.helper";
import { resolveGoogleRecurrenceMeta } from "@/helpers/calendar/google-calendar-recurrence.helper";
import { resolveGoogleInstanceOriginalStartMeta } from "@/server/services/google/google-calendar-recurring-push";
import { GOOGLE_SPLIT_GROUP_PROP } from "@/server/services/google/google-calendar-split-lineage";
import type { GoogleCalendarEventItem } from "@/server/services/google/google-calendar.client";
import type {
  CalendarEvent,
  CalendarRsvpStatus,
  GoogleCalendarRecurrenceMeta,
} from "@/types/calendar.types";

import {
  GoogleRecurrenceMetaDto,
  PushEventBodyDto,
} from "./google-calendar-integration.dto";

export type ImportedGoogleCalendarEvent = Omit<CalendarEvent, "type"> & {
  type: "common";
};

function readImportedGoogleSplitGroupId(
  event: GoogleCalendarEventItem,
): string | undefined {
  const extendedProperties = event.extendedProperties;
  const shared = extendedProperties?.shared;
  const value = shared?.[GOOGLE_SPLIT_GROUP_PROP];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function effectiveGoogleRecurrenceTimes(
  meta: z.infer<typeof GoogleRecurrenceMetaDto>,
  fallback: { start: string; allDay: boolean; timeZone?: string },
): { originalStart: string; originalAllDay: boolean } {
  const rawOriginalStart =
    (typeof meta.originalStart === "string" && meta.originalStart.trim()) ||
    fallback.start;
  const originalAllDay = meta.originalAllDay ?? fallback.allDay;
  return {
    originalStart: normalizeGoogleOriginalStartInstant({
      originalStart: rawOriginalStart,
      originalAllDay,
      timeZone: fallback.timeZone,
    }),
    originalAllDay,
  };
}

export function resolvePushGoogleRecurrenceFromBody(
  body: z.infer<typeof PushEventBodyDto>,
): GoogleCalendarRecurrenceMeta | undefined {
  const resolved = resolveGoogleRecurrenceMeta(body.id, body.googleRecurrence, {
    start: body.start,
    allDay: body.allDay,
    timeZone: body.timeZone,
  });
  if (!resolved?.originalStart?.trim()) return resolved;
  return {
    ...resolved,
    originalStart: normalizeGoogleOriginalStartInstant({
      originalStart: resolved.originalStart,
      originalAllDay: resolved.originalAllDay,
      timeZone: body.timeZone,
    }),
  };
}

function normalizeGoogleOriginalStartInstant(params: {
  originalStart: string;
  originalAllDay?: boolean;
  timeZone?: string;
}): string {
  const trimmed = params.originalStart.trim();
  if (!trimmed) return trimmed;
  if (params.originalAllDay || /^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }
  if (/[Zz]$/.test(trimmed) || /[+-]\d{2}:?\d{2}$/.test(trimmed)) {
    const parsedMs = Date.parse(trimmed);
    if (!Number.isNaN(parsedMs)) {
      return new Date(parsedMs).toISOString().replace(/\.\d{3}Z$/, "Z");
    }
  }
  const wallUtcMs = parseGoogleWallDateTimeToUtcMs(trimmed, params.timeZone);
  if (wallUtcMs != null) {
    return new Date(wallUtcMs).toISOString().replace(/\.\d{3}Z$/, "Z");
  }
  return trimmed;
}

function parseGoogleWallDateTimeToUtcMs(
  dateTime: string,
  timeZone?: string,
): number | null {
  const target = dateTime.trim().replace(/\.\d+$/, "");
  const tz = timeZone?.trim() || "UTC";
  if (tz === "UTC") {
    const parsedMs = Date.parse(target.endsWith("Z") ? target : `${target}Z`);
    return Number.isNaN(parsedMs) ? null : parsedMs;
  }
  let utcMs = Date.parse(`${target}Z`);
  if (Number.isNaN(utcMs)) return null;
  for (let attempt = 0; attempt < 4; attempt++) {
    const wall = formatWallDateTimeInZone(new Date(utcMs), tz);
    if (wall === target) return utcMs;
    const wallMs = Date.parse(`${wall}Z`);
    const targetMs = Date.parse(`${target}Z`);
    if (Number.isNaN(wallMs) || Number.isNaN(targetMs)) return null;
    utcMs += targetMs - wallMs;
  }
  return utcMs;
}

function omitGooglePatchStartEnd(
  patchBody: Record<string, unknown>,
): Record<string, unknown> {
  const { start: _start, end: _end, ...rest } = patchBody;
  return rest;
}

export function stripGooglePatchColorUnlessRequested(
  patchBody: Record<string, unknown>,
  body: Pick<z.infer<typeof PushEventBodyDto>, "color">,
): Record<string, unknown> {
  if ("color" in body) return patchBody;
  if (!("colorId" in patchBody)) return patchBody;
  const { colorId: _colorId, ...rest } = patchBody;
  return rest;
}

export function resolveFollowingTruncateMeta(params: {
  instanceRaw: Record<string, unknown>;
  resolvedRecurrence: z.infer<typeof GoogleRecurrenceMetaDto>;
  body: Pick<z.infer<typeof PushEventBodyDto>, "start" | "allDay" | "timeZone">;
}): { originalStart: string; originalAllDay: boolean } {
  const fromInstance = resolveGoogleInstanceOriginalStartMeta(
    params.instanceRaw,
  );
  const fallback = effectiveGoogleRecurrenceTimes(params.resolvedRecurrence, {
    start: params.body.start,
    allDay: params.body.allDay,
    timeZone: params.body.timeZone,
  });
  if (!fromInstance) return fallback;

  return {
    originalStart: normalizeGoogleOriginalStartInstant({
      originalStart: fromInstance.originalStart,
      originalAllDay: fromInstance.originalAllDay,
      timeZone: fromInstance.timeZone ?? params.body.timeZone,
    }),
    originalAllDay: fromInstance.originalAllDay,
    ...(fromInstance.timeZone ? { timeZone: fromInstance.timeZone } : {}),
  };
}

export function mapGoogleEventToCalendarEvent(
  e: GoogleCalendarEventItem,
  palettes?: GoogleCalendarColorPalettes,
): ImportedGoogleCalendarEvent | null {
  if (e.status === "cancelled") return null;
  const id = e.id ? `gcal:${e.id}` : null;
  if (!id) return null;

  const title = (e.summary && e.summary.trim()) || "(No title)";

  const allDay = !!(e.start?.date && e.end?.date);
  const start = e.start?.dateTime ?? e.start?.date ?? null;
  const end = e.end?.dateTime ?? e.end?.date ?? null;
  if (!start || !end) return null;
  const timeZone = e.start?.timeZone ?? e.end?.timeZone;

  const meetingUrl = e.hangoutLink || undefined;
  const description = e.description || undefined;

  const attendees = e.attendees ?? [];
  const participants =
    attendees
      .map((a) => a.email || a.displayName)
      .filter((v): v is string => typeof v === "string" && v.length > 0) || [];

  const rsvpStatus = mapRsvp(attendees);

  let googleRecurrence: GoogleCalendarRecurrenceMeta | undefined;
  const recurringEventId = e.recurringEventId;
  const splitGroupId = readImportedGoogleSplitGroupId(e);
  const ost = e.originalStartTime;
  if (typeof recurringEventId === "string" && recurringEventId.length > 0) {
    const splitFields = splitGroupId ? { splitGroupId } : {};
    if (
      ost &&
      (typeof ost.dateTime === "string" || typeof ost.date === "string")
    ) {
      const originalAllDay = !!(ost.date && !ost.dateTime);
      const originalStart =
        (typeof ost.dateTime === "string" && ost.dateTime) ||
        (typeof ost.date === "string" && ost.date) ||
        "";
      if (originalStart) {
        googleRecurrence = {
          recurringEventId,
          originalStart,
          originalAllDay,
          ...splitFields,
        };
      } else {
        googleRecurrence = { recurringEventId, ...splitFields };
      }
    } else {
      googleRecurrence = { recurringEventId, ...splitFields };
    }
  }

  const normalizedRange = normalizeImportedRange({
    start,
    end,
    allDay,
  });
  if (!normalizedRange) return null;

  const repeat = parseGoogleRecurrenceToCalendarRepeat(e.recurrence);
  const color = googleEventColorIdToHex(e.colorId, palettes);

  return {
    id,
    type: "common",
    title,
    start: normalizedRange.start,
    end: normalizedRange.end,
    allDay: normalizedRange.allDay,
    ...(timeZone ? { timeZone } : {}),
    ...(meetingUrl ? { meetingUrl } : {}),
    ...(participants.length ? { participants } : {}),
    ...(description ? { description } : {}),
    ...(rsvpStatus ? { rsvpStatus } : {}),
    ...(repeat ? { repeat } : {}),
    ...(googleRecurrence ? { googleRecurrence } : {}),
    ...(color ? { color } : {}),
  };
}

function normalizeImportedRange(params: {
  start: string;
  end: string;
  allDay: boolean;
}): { start: string; end: string; allDay: boolean } | null {
  if (!params.allDay) {
    const s = new Date(params.start);
    const e = new Date(params.end);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null;
    return { start: s.toISOString(), end: e.toISOString(), allDay: false };
  }

  // Google all-day: date-only fields; `end.date` is exclusive — we store inclusive end-of-day.
  const startParts = parseIsoDateOnly(params.start);
  const endExclusiveParts = parseIsoDateOnly(params.end);
  if (!startParts || !endExclusiveParts) return null;

  const startLocal = new Date(
    startParts.y,
    startParts.m - 1,
    startParts.d,
    0,
    0,
    0,
    0,
  );
  const endExclusiveLocal = new Date(
    endExclusiveParts.y,
    endExclusiveParts.m - 1,
    endExclusiveParts.d,
    0,
    0,
    0,
    0,
  );
  const endLocal = new Date(endExclusiveLocal);
  endLocal.setDate(endLocal.getDate() - 1);
  endLocal.setHours(23, 59, 59, 999);
  return {
    start: startLocal.toISOString(),
    end: endLocal.toISOString(),
    allDay: true,
  };
}

function parseIsoDateOnly(
  value: string,
): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d))
    return null;
  return { y, m: mo, d };
}

function mapRsvp(
  attendees: Array<{ self?: boolean; responseStatus?: string }> | undefined,
): CalendarRsvpStatus | undefined {
  const self = attendees?.find((a) => a.self);
  const status = self?.responseStatus;
  if (status === "accepted") return "yes";
  if (status === "declined") return "no";
  if (status === "tentative") return "maybe";
  return undefined;
}

export function calendarRsvpToGoogleResponseStatus(
  rsvp: CalendarRsvpStatus,
): "accepted" | "declined" | "tentative" {
  if (rsvp === "no") return "declined";
  if (rsvp === "maybe") return "tentative";
  return "accepted";
}

type GoogleAttendeeRecord = {
  email?: string;
  displayName?: string;
  self?: boolean;
  responseStatus?: string;
};

/** Google requires `email` on attendees when updating RSVP. */
export function mergeGoogleRsvpIntoPatch(
  patchBody: Record<string, unknown>,
  existingRaw: Record<string, unknown>,
  rsvp: CalendarRsvpStatus,
  userEmail: string,
): Record<string, unknown> {
  const responseStatus = calendarRsvpToGoogleResponseStatus(rsvp);
  const email = userEmail.trim();
  const rawList = existingRaw.attendees;
  const attendees: GoogleAttendeeRecord[] = Array.isArray(rawList)
    ? rawList
        .filter(
          (a): a is Record<string, unknown> => !!a && typeof a === "object",
        )
        .map((a) => ({ ...(a as GoogleAttendeeRecord) }))
    : [];

  const selfIndex = attendees.findIndex((a) => a.self);
  if (selfIndex >= 0) {
    const self = attendees[selfIndex];
    attendees[selfIndex] = {
      ...self,
      email: self.email?.trim() || email,
      responseStatus,
      self: true,
    };
  } else {
    attendees.push({ self: true, email, responseStatus });
  }

  return { ...patchBody, attendees };
}

function formatLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

function addDaysToYmd(ymd: string, days: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) throw new HttpError(400, "Invalid date.");
  const dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  dt.setDate(dt.getDate() + days);
  return formatLocalYmd(dt);
}

function mergedGoogleDescription(description?: string, notes?: string): string {
  const d = description?.trim() ?? "";
  const n = notes?.trim() ?? "";
  if (!d && !n) return "";
  if (!d) return n;
  if (!n) return d;
  return `${d}\n\n${n}`;
}

/** Google expects local wall time without offset when `timeZone` is set (Calendar API). */
function formatWallDateTimeInZone(d: Date, timeZone: string): string {
  const tz = timeZone.trim() || "UTC";
  if (tz === "UTC") {
    return d.toISOString().replace(/\.\d{3}Z$/, "");
  }
  try {
    const formatted = new Intl.DateTimeFormat("sv-SE", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(d);
    return formatted.replace(" ", "T");
  } catch {
    return d.toISOString().replace(/\.\d{3}Z$/, "");
  }
}

function googleTimedStartEnd(params: {
  start: Date;
  end: Date;
  timeZone?: string;
}): { start: Record<string, string>; end: Record<string, string> } {
  const tz = params.timeZone?.trim() || "UTC";
  return {
    start: {
      dateTime: formatWallDateTimeInZone(params.start, tz),
      timeZone: tz,
    },
    end: {
      dateTime: formatWallDateTimeInZone(params.end, tz),
      timeZone: tz,
    },
  };
}

function pushBodyGoogleColorPatch(
  body: z.infer<typeof PushEventBodyDto>,
): Record<string, unknown> {
  if (!("color" in body)) return {};
  if (body.color === null) return googleEventColorPatchFromHex(null);
  const hex = normalizeHexColor(body.color);
  return hex
    ? googleEventColorPatchFromHex(hex)
    : googleEventColorPatchFromHex(null);
}

export function mapPushBodyToGooglePatch(
  body: z.infer<typeof PushEventBodyDto>,
  opts?: { includeRecurrence?: boolean },
): Record<string, unknown> {
  const summary = body.title.trim() || "(No title)";
  const description = mergedGoogleDescription(body.description, body.notes);
  const colorPatch = pushBodyGoogleColorPatch(body);
  const includeRecurrence = opts?.includeRecurrence ?? false;

  const base: Record<string, unknown> = {
    summary,
    description,
    ...colorPatch,
    ...(includeRecurrence && body.repeat
      ? { recurrence: calendarRepeatToGoogleRecurrence(body.repeat) }
      : {}),
  };

  if (body.allDay) {
    const startMs = new Date(body.start).getTime();
    const endMs = new Date(body.end).getTime();
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
      throw new HttpError(400, "Invalid start or end time.");
    }
    const startDate = formatLocalYmd(new Date(body.start));
    const inclusiveEnd = formatLocalYmd(new Date(body.end));
    if (inclusiveEnd < startDate) {
      throw new HttpError(400, "End must be on or after start.");
    }
    const endExclusive = addDaysToYmd(inclusiveEnd, 1);
    return {
      ...base,
      start: { date: startDate },
      end: { date: endExclusive },
    };
  }

  const s = new Date(body.start);
  const e = new Date(body.end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
    throw new HttpError(400, "Invalid start or end time.");
  }
  if (e.getTime() <= s.getTime()) {
    throw new HttpError(400, "End must be after start.");
  }

  const timed = googleTimedStartEnd({
    start: s,
    end: e,
    timeZone: body.timeZone,
  });

  return {
    ...base,
    start: timed.start,
    end: timed.end,
  };
}

function diffDaysYmd(aYmd: string, bYmd: string): number {
  const a = new Date(`${aYmd}T12:00:00`);
  const b = new Date(`${bYmd}T12:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

function adjustTimedPatchForRecurringMaster(
  patchBody: Record<string, unknown>,
  masterRaw: Record<string, unknown>,
  meta: z.infer<typeof GoogleRecurrenceMetaDto>,
  body: z.infer<typeof PushEventBodyDto>,
): Record<string, unknown> | null {
  if (!meta.originalStart) return null;
  const origMs = Date.parse(
    normalizeGoogleOriginalStartInstant({
      originalStart: meta.originalStart,
      originalAllDay: meta.originalAllDay,
      timeZone: body.timeZone,
    }),
  );
  const userStartMs = new Date(body.start).getTime();
  const userEndMs = new Date(body.end).getTime();
  if (
    Number.isNaN(origMs) ||
    Number.isNaN(userStartMs) ||
    Number.isNaN(userEndMs)
  ) {
    return null;
  }

  const deltaMs = userStartMs - origMs;
  const newDurMs = userEndMs - userStartMs;

  const sObj = masterRaw.start;
  const eObj = masterRaw.end;
  if (!sObj || typeof sObj !== "object" || !eObj || typeof eObj !== "object") {
    return null;
  }

  const st = sObj as { dateTime?: string; date?: string; timeZone?: string };
  const en = eObj as { dateTime?: string; date?: string; timeZone?: string };
  if (!st.dateTime || !en.dateTime) return null;

  const masterStartMs = parseGoogleWallDateTimeToUtcMs(
    st.dateTime,
    st.timeZone,
  );
  const masterEndMs = parseGoogleWallDateTimeToUtcMs(en.dateTime, en.timeZone);
  if (masterStartMs == null || masterEndMs == null) return null;

  const newMasterStart = new Date(masterStartMs + deltaMs);
  const newMasterEnd = new Date(newMasterStart.getTime() + newDurMs);

  const tz =
    body.timeZone?.trim() ||
    st.timeZone?.trim() ||
    en.timeZone?.trim() ||
    "UTC";

  const timed = googleTimedStartEnd({
    start: newMasterStart,
    end: newMasterEnd,
    timeZone: tz,
  });

  return { ...patchBody, start: timed.start, end: timed.end };
}

function adjustAllDayPatchForRecurringMaster(
  patchBody: Record<string, unknown>,
  masterRaw: Record<string, unknown>,
  meta: z.infer<typeof GoogleRecurrenceMetaDto>,
  body: z.infer<typeof PushEventBodyDto>,
): Record<string, unknown> | null {
  if (!meta.originalStart?.trim()) return null;
  const origYmd = meta.originalStart.trim().slice(0, 10);
  const userStartYmd = formatLocalYmd(new Date(body.start));
  const userInclusiveEndYmd = formatLocalYmd(new Date(body.end));

  const dayDelta = diffDaysYmd(userStartYmd, origYmd);

  const st = masterRaw.start as { date?: string } | undefined;
  const en = masterRaw.end as { date?: string } | undefined;
  if (!st?.date || !en?.date) return null;

  const newMasterStartYmd = addDaysToYmd(st.date, dayDelta);
  const inclusiveSpanDays = diffDaysYmd(userInclusiveEndYmd, userStartYmd) + 1;
  if (inclusiveSpanDays < 1) return null;
  const newMasterEndExclusiveYmd = addDaysToYmd(
    newMasterStartYmd,
    inclusiveSpanDays,
  );

  return {
    ...patchBody,
    start: { date: newMasterStartYmd },
    end: { date: newMasterEndExclusiveYmd },
  };
}

export function adjustPatchBodyForRecurringMaster(
  patchBody: Record<string, unknown>,
  masterRaw: Record<string, unknown>,
  meta: z.infer<typeof GoogleRecurrenceMetaDto>,
  body: z.infer<typeof PushEventBodyDto>,
): Record<string, unknown> {
  const times = effectiveGoogleRecurrenceTimes(meta, {
    start: body.start,
    allDay: body.allDay,
    timeZone: body.timeZone,
  });
  const metaFull: z.infer<typeof GoogleRecurrenceMetaDto> = {
    ...meta,
    originalStart: times.originalStart,
    originalAllDay: times.originalAllDay,
  };

  if (body.allDay && times.originalAllDay) {
    return (
      adjustAllDayPatchForRecurringMaster(
        patchBody,
        masterRaw,
        metaFull,
        body,
      ) ?? omitGooglePatchStartEnd(patchBody)
    );
  }

  if (!body.allDay && !times.originalAllDay) {
    return (
      adjustTimedPatchForRecurringMaster(
        patchBody,
        masterRaw,
        metaFull,
        body,
      ) ?? omitGooglePatchStartEnd(patchBody)
    );
  }

  return omitGooglePatchStartEnd(patchBody);
}

export function pushBodyChangesSeriesSchedule(
  body: Pick<
    z.infer<typeof PushEventBodyDto>,
    "start" | "end" | "allDay" | "timeZone"
  >,
  meta: z.infer<typeof GoogleRecurrenceMetaDto>,
): boolean {
  if (!meta.originalStart?.trim()) return false;

  const times = effectiveGoogleRecurrenceTimes(meta, {
    start: body.start,
    allDay: body.allDay,
    timeZone: body.timeZone,
  });

  if (body.allDay !== times.originalAllDay) return true;

  if (body.allDay) {
    const origYmd = times.originalStart.slice(0, 10);
    const userStartYmd = formatLocalYmd(new Date(body.start));
    return userStartYmd !== origYmd;
  }

  const origMs = Date.parse(
    normalizeGoogleOriginalStartInstant({
      originalStart: times.originalStart,
      originalAllDay: false,
      timeZone: body.timeZone,
    }),
  );
  const userStartMs = new Date(body.start).getTime();
  if (Number.isNaN(origMs) || Number.isNaN(userStartMs)) return false;
  return Math.abs(userStartMs - origMs) > 1000;
}

export function prepareSeriesMasterPushPatch(
  patchBody: Record<string, unknown>,
  masterRaw: Record<string, unknown>,
  meta: z.infer<typeof GoogleRecurrenceMetaDto>,
  body: z.infer<typeof PushEventBodyDto>,
): Record<string, unknown> {
  let result = adjustPatchBodyForRecurringMaster(
    patchBody,
    masterRaw,
    meta,
    body,
  );
  if (!pushBodyChangesSeriesSchedule(body, meta)) {
    result = omitGooglePatchStartEnd(result);
  }
  return stripGooglePatchColorUnlessRequested(result, body);
}

export function mapGoogleApiRecordToCalendarEvent(
  raw: Record<string, unknown>,
  palettes?: GoogleCalendarColorPalettes,
): ImportedGoogleCalendarEvent | null {
  return mapGoogleEventToCalendarEvent(
    raw as GoogleCalendarEventItem,
    palettes,
  );
}
