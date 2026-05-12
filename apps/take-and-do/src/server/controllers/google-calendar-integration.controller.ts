import { z } from "zod";

import { getAccessByAuth, requireNonAnonymous } from "@/auth/guards";
import { auth } from "@/auth/server";
import { HttpError } from "@/lib/api/errors";
import { apiServices } from "@/server/services/api";
import {
  deleteGoogleCalendarEvent,
  getGoogleCalendarEvent,
  listGoogleCalendarEvents,
  mergeGoogleMasterForPut,
  patchGoogleCalendarEvent,
  postGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  type GoogleCalendarEventItem,
} from "@/server/services/google/google-calendar.client";
import {
  pushGoogleCalendarFollowingSplit,
  truncateGoogleCalendarSeriesBefore,
} from "@/server/services/google/google-calendar-recurring-push";
import type {
  CalendarEvent,
  CalendarRsvpStatus,
  GoogleCalendarRecurrenceMeta,
} from "@/types/calendar.types";

import { BaseController } from "./base.controller";

type ImportedGoogleCalendarEvent = Omit<CalendarEvent, "type"> & {
  type: "common";
};

const ToggleBodyDto = z.object({ enabled: z.boolean() });

const StatusResponseDto = z.object({
  connected: z.boolean(),
  googleLinked: z.boolean(),
  email: z.string().nullable(),
  enabled: z.boolean(),
  lastSyncAt: z.string().nullable(),
});

const GoogleRecurrenceMetaDto = z.object({
  recurringEventId: z.string(),
  originalStart: z.string().optional(),
  originalAllDay: z.boolean().optional(),
});

function effectiveGoogleRecurrenceTimes(
  meta: z.infer<typeof GoogleRecurrenceMetaDto>,
  fallback: { start: string; allDay: boolean },
): { originalStart: string; originalAllDay: boolean } {
  const originalStart =
    (typeof meta.originalStart === "string" && meta.originalStart.trim()) ||
    fallback.start;
  return {
    originalStart,
    originalAllDay: meta.originalAllDay ?? fallback.allDay,
  };
}

const ImportedGoogleCalendarEventSchema = z.object({
  id: z.string(),
  type: z.literal("common"),
  title: z.string(),
  start: z.string(),
  end: z.string(),
  allDay: z.boolean(),
  timeZone: z.string().optional(),
  meetingUrl: z.string().optional(),
  participants: z.array(z.string()).optional(),
  description: z.string().optional(),
  rsvpStatus: z.enum(["yes", "no", "maybe"]).optional(),
  googleRecurrence: GoogleRecurrenceMetaDto.optional(),
  /** Local UI override; ignored by Google push until mapped to colorId. */
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
});

const SyncResponseDto = z.object({
  imported: z.array(ImportedGoogleCalendarEventSchema),
  lastSyncAt: z.string(),
  /** True when this response applied incremental sync (sync token); omit orphan pruning by id. */
  incremental: z.boolean(),
  /** Present on full sync — used to drop stale `gcal:` ids no longer returned by Google. */
  syncRange: z
    .object({
      timeMin: z.string(),
      timeMax: z.string(),
    })
    .optional(),
});

const PushEventBodyDto = z
  .object({
    id: z.string(),
    type: z.literal("common"),
    title: z.string(),
    start: z.string(),
    end: z.string(),
    allDay: z.boolean(),
    /** IANA zone from Google import; required server-side for recurring writes. */
    timeZone: z.string().optional(),
    description: z.string().optional(),
    notes: z.string().optional(),
    recurrenceScope: z.enum(["instance", "series", "following"]).optional(),
    googleRecurrence: GoogleRecurrenceMetaDto.optional(),
  })
  .refine((b) => b.id.startsWith("gcal:"), {
    message: "Only Google-linked events can be updated.",
    path: ["id"],
  })
  .refine(
    (b) => {
      const scope = b.recurrenceScope ?? "instance";
      if (scope === "instance") return true;
      return !!b.googleRecurrence?.recurringEventId;
    },
    {
      message:
        "Choose a recurring Google event or omit recurrence scope for single events.",
      path: ["googleRecurrence"],
    },
  );

const PushResponseDto = z.object({ ok: z.literal(true) });

const DeleteEventBodyDto = z
  .object({
    id: z.string(),
    recurrenceScope: z.enum(["instance", "series", "following"]).optional(),
    googleRecurrence: GoogleRecurrenceMetaDto.optional(),
    /** Instance anchor when `googleRecurrence.originalStart` is omitted. */
    start: z.string().optional(),
    allDay: z.boolean().optional(),
  })
  .refine((b) => b.id.startsWith("gcal:"), {
    message: "Only Google-linked events can be deleted.",
    path: ["id"],
  })
  .refine(
    (b) => {
      const scope = b.recurrenceScope ?? "instance";
      if (scope === "instance") return true;
      return !!b.googleRecurrence?.recurringEventId;
    },
    {
      message:
        "Choose recurrence scope for repeating Google events, or delete a single instance.",
      path: ["googleRecurrence"],
    },
  );

const CreateEventBodyDto = z.object({
  type: z.literal("common"),
  title: z.string(),
  start: z.string(),
  end: z.string(),
  allDay: z.boolean(),
  timeZone: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

const CreateEventResponseDto = z.object({
  event: ImportedGoogleCalendarEventSchema,
});

export class GoogleCalendarIntegrationController extends BaseController {
  status = this.initRoute({
    responseDto: StatusResponseDto,
    handler: async () => {
      const authContext = await requireNonAnonymous();
      const access = getAccessByAuth(authContext);
      const status = await apiServices.googleCalendarIntegration.getStatus(
        access.userId,
      );
      return {
        connected: status.connected,
        googleLinked: status.googleLinked,
        email: status.googleLinked ? authContext.user.email : null,
        enabled: status.enabled,
        lastSyncAt: status.lastSyncAt ? status.lastSyncAt.toISOString() : null,
      };
    },
  });

  toggle = this.initRoute({
    bodyDto: ToggleBodyDto,
    responseDto: StatusResponseDto,
    handler: async ({ body }) => {
      const authContext = await requireNonAnonymous();
      const access = getAccessByAuth(authContext);

      const status = await apiServices.googleCalendarIntegration.getStatus(
        access.userId,
      );
      if (!status.googleLinked) {
        throw new HttpError(
          400,
          "Link Google to your account first (Sign in with Google or Connect).",
        );
      }

      await apiServices.googleCalendarIntegration.setEnabled(
        access.userId,
        body.enabled,
      );
      const refreshed = await apiServices.googleCalendarIntegration.getStatus(
        access.userId,
      );
      return {
        connected: refreshed.connected,
        googleLinked: refreshed.googleLinked,
        email: refreshed.googleLinked ? authContext.user.email : null,
        enabled: refreshed.enabled,
        lastSyncAt: refreshed.lastSyncAt
          ? refreshed.lastSyncAt.toISOString()
          : null,
      };
    },
  });

  sync = this.initRoute({
    responseDto: SyncResponseDto,
    handler: async ({ request }) => {
      const authContext = await requireNonAnonymous();
      const access = getAccessByAuth(authContext);

      const status = await apiServices.googleCalendarIntegration.getStatus(
        access.userId,
      );
      if (!status.googleLinked) {
        throw new HttpError(400, "Link Google to your account first.");
      }

      const syncState =
        await apiServices.googleCalendarIntegration.getSyncState(access.userId);
      if (!syncState.enabled) {
        throw new HttpError(400, "Turn on Google Calendar import to sync.");
      }

      const tokenResult = await auth.api.getAccessToken({
        body: { providerId: "google" },
        headers: request.headers,
      });

      const accessToken = (tokenResult as { accessToken?: string } | null)
        ?.accessToken;
      if (!accessToken) {
        throw new HttpError(
          400,
          "Missing Google access token. Reconnect Google Calendar.",
        );
      }

      const incremental = !!syncState.syncToken;

      const now = new Date();
      const timeMin = new Date(
        now.getTime() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const timeMax = new Date(
        now.getTime() + 90 * 24 * 60 * 60 * 1000,
      ).toISOString();

      const { items, nextSyncToken } = await listGoogleCalendarEvents({
        accessToken,
        calendarId: syncState.calendarId,
        syncToken: syncState.syncToken,
        timeMin,
        timeMax,
      });

      const imported = items
        .map((e) => mapGoogleEventToCalendarEvent(e))
        .filter((e): e is ImportedGoogleCalendarEvent => e !== null);

      await apiServices.googleCalendarIntegration.upsertSyncResult({
        userId: access.userId,
        nextSyncToken,
        lastSyncAt: now,
      });

      return {
        imported,
        lastSyncAt: now.toISOString(),
        incremental,
        ...(incremental
          ? {}
          : {
              syncRange: { timeMin, timeMax },
            }),
      };
    },
  });

  push = this.initRoute({
    bodyDto: PushEventBodyDto,
    responseDto: PushResponseDto,
    handler: async ({ body, request }) => {
      const authContext = await requireNonAnonymous();
      const access = getAccessByAuth(authContext);

      const status = await apiServices.googleCalendarIntegration.getStatus(
        access.userId,
      );
      if (!status.googleLinked) {
        throw new HttpError(400, "Link Google to your account first.");
      }

      const syncState =
        await apiServices.googleCalendarIntegration.getSyncState(access.userId);
      if (!syncState.enabled) {
        throw new HttpError(400, "Turn on Google Calendar import to sync.");
      }

      const tokenResult = await auth.api.getAccessToken({
        body: { providerId: "google" },
        headers: request.headers,
      });

      const accessToken = (tokenResult as { accessToken?: string } | null)
        ?.accessToken;
      if (!accessToken) {
        throw new HttpError(
          400,
          "Missing Google access token. Reconnect Google Calendar.",
        );
      }

      const googleEventId = body.id.slice("gcal:".length);
      if (!googleEventId) {
        throw new HttpError(400, "Invalid Google event id.");
      }

      let patchBody: Record<string, unknown>;
      try {
        patchBody = mapPushBodyToGooglePatch(body);
      } catch (e) {
        if (e instanceof HttpError) throw e;
        throw new HttpError(400, "Invalid event times.");
      }

      const scope = body.recurrenceScope ?? "instance";

      try {
        if (scope === "following") {
          const meta = body.googleRecurrence;
          if (!meta) {
            throw new HttpError(400, "Missing Google recurrence metadata.");
          }
          const times = effectiveGoogleRecurrenceTimes(meta, {
            start: body.start,
            allDay: body.allDay,
          });
          await pushGoogleCalendarFollowingSplit({
            accessToken,
            calendarId: syncState.calendarId,
            masterId: meta.recurringEventId,
            meta: times,
            patchBody,
          });
        } else {
          const targetGoogleId =
            scope === "series" && body.googleRecurrence
              ? body.googleRecurrence.recurringEventId
              : googleEventId;

          let bodyToSend = patchBody;
          const seriesUsesMasterPut =
            scope === "series" && !!body.googleRecurrence?.recurringEventId;

          if (seriesUsesMasterPut && body.googleRecurrence) {
            const masterGet = await getGoogleCalendarEvent({
              accessToken,
              calendarId: syncState.calendarId,
              googleEventId: body.googleRecurrence.recurringEventId,
            });
            const mergedMeta = {
              ...body.googleRecurrence,
              ...effectiveGoogleRecurrenceTimes(body.googleRecurrence, {
                start: body.start,
                allDay: body.allDay,
              }),
            };
            bodyToSend = adjustPatchBodyForRecurringMaster(
              patchBody,
              masterGet.raw,
              mergedMeta,
              body,
            );
            const putBody = mergeGoogleMasterForPut(masterGet.raw, bodyToSend);
            await updateGoogleCalendarEvent({
              accessToken,
              calendarId: syncState.calendarId,
              googleEventId: targetGoogleId,
              body: putBody,
              etag: masterGet.etag,
            });
          } else {
            await patchGoogleCalendarEvent({
              accessToken,
              calendarId: syncState.calendarId,
              googleEventId: targetGoogleId,
              body: bodyToSend,
            });
          }
        }
      } catch (e) {
        if (e instanceof HttpError) throw e;
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("(403)")) {
          throw new HttpError(
            403,
            "Google denied calendar edits (missing permission or read-only event). Open Settings → Reconnect Google Calendar and accept calendar access. If it persists, confirm Google Calendar API is enabled for this app and you can edit this event in calendar.google.com.",
          );
        }
        throw new HttpError(502, msg || "Google Calendar update failed.");
      }

      return { ok: true as const };
    },
  });

  deleteEvent = this.initRoute({
    bodyDto: DeleteEventBodyDto,
    responseDto: PushResponseDto,
    handler: async ({ body, request }) => {
      const authContext = await requireNonAnonymous();
      const access = getAccessByAuth(authContext);

      const status = await apiServices.googleCalendarIntegration.getStatus(
        access.userId,
      );
      if (!status.googleLinked) {
        throw new HttpError(400, "Link Google to your account first.");
      }

      const syncState =
        await apiServices.googleCalendarIntegration.getSyncState(access.userId);
      if (!syncState.enabled) {
        throw new HttpError(400, "Turn on Google Calendar import to sync.");
      }

      const tokenResult = await auth.api.getAccessToken({
        body: { providerId: "google" },
        headers: request.headers,
      });

      const accessToken = (tokenResult as { accessToken?: string } | null)
        ?.accessToken;
      if (!accessToken) {
        throw new HttpError(
          400,
          "Missing Google access token. Reconnect Google Calendar.",
        );
      }

      const googleEventId = body.id.slice("gcal:".length);
      if (!googleEventId) {
        throw new HttpError(400, "Invalid Google event id.");
      }

      const scope = body.recurrenceScope ?? "instance";

      try {
        if (scope === "following") {
          const meta = body.googleRecurrence;
          if (!meta) {
            throw new HttpError(400, "Missing Google recurrence metadata.");
          }
          const startFb = body.start?.trim();
          if (!meta.originalStart?.trim() && !startFb) {
            throw new HttpError(
              400,
              "Recurring delete (this and following) needs the instance start time. Refresh the calendar and try again.",
            );
          }
          const times = effectiveGoogleRecurrenceTimes(meta, {
            start: startFb ?? "",
            allDay: body.allDay ?? false,
          });
          await truncateGoogleCalendarSeriesBefore({
            accessToken,
            calendarId: syncState.calendarId,
            masterId: meta.recurringEventId,
            meta: times,
          });
        } else {
          const targetGoogleId =
            scope === "series" && body.googleRecurrence
              ? body.googleRecurrence.recurringEventId
              : googleEventId;

          await deleteGoogleCalendarEvent({
            accessToken,
            calendarId: syncState.calendarId,
            googleEventId: targetGoogleId,
          });
        }
      } catch (e) {
        if (e instanceof HttpError) throw e;
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("(403)")) {
          throw new HttpError(
            403,
            "Google denied deleting this calendar event. Try reconnecting in Settings.",
          );
        }
        throw new HttpError(502, msg || "Google Calendar delete failed.");
      }

      return { ok: true as const };
    },
  });

  createEvent = this.initRoute({
    bodyDto: CreateEventBodyDto,
    responseDto: CreateEventResponseDto,
    handler: async ({ body, request }) => {
      const authContext = await requireNonAnonymous();
      const access = getAccessByAuth(authContext);

      const status = await apiServices.googleCalendarIntegration.getStatus(
        access.userId,
      );
      if (!status.googleLinked) {
        throw new HttpError(400, "Link Google to your account first.");
      }

      const syncState =
        await apiServices.googleCalendarIntegration.getSyncState(access.userId);
      if (!syncState.enabled) {
        throw new HttpError(400, "Turn on Google Calendar import to sync.");
      }

      const tokenResult = await auth.api.getAccessToken({
        body: { providerId: "google" },
        headers: request.headers,
      });

      const accessToken = (tokenResult as { accessToken?: string } | null)
        ?.accessToken;
      if (!accessToken) {
        throw new HttpError(
          400,
          "Missing Google access token. Reconnect Google Calendar.",
        );
      }

      let patchBody: Record<string, unknown>;
      try {
        patchBody = mapPushBodyToGooglePatch({
          ...body,
          id: "gcal:create-placeholder",
          type: "common",
        });
      } catch (e) {
        if (e instanceof HttpError) throw e;
        throw new HttpError(400, "Invalid event times.");
      }

      let raw: Record<string, unknown>;
      try {
        raw = await postGoogleCalendarEvent({
          accessToken,
          calendarId: syncState.calendarId,
          body: patchBody,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("(403)")) {
          throw new HttpError(
            403,
            "Google denied creating this calendar event. Try reconnecting in Settings.",
          );
        }
        throw new HttpError(502, msg || "Google Calendar create failed.");
      }

      const mapped = mapGoogleApiRecordToCalendarEvent(raw);
      if (!mapped) {
        throw new HttpError(
          502,
          "Google Calendar created an event we could not parse.",
        );
      }

      return { event: mapped };
    },
  });

  disconnect = this.initRoute({
    handler: async () => {
      const authContext = await requireNonAnonymous();
      const access = getAccessByAuth(authContext);

      await apiServices.googleCalendarIntegration.clearIntegration(
        access.userId,
      );

      return new Response(null, { status: 204 });
    },
  });
}

function mapGoogleEventToCalendarEvent(
  e: GoogleCalendarEventItem,
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
  const ost = e.originalStartTime;
  if (typeof recurringEventId === "string" && recurringEventId.length > 0) {
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
        };
      } else {
        googleRecurrence = { recurringEventId };
      }
    } else {
      googleRecurrence = { recurringEventId };
    }
  }

  const normalizedRange = normalizeImportedRange({
    start,
    end,
    allDay,
  });
  if (!normalizedRange) return null;

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
    ...(googleRecurrence ? { googleRecurrence } : {}),
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

  // Google all-day events use date-only and `end.date` is exclusive.
  // Our internal model expects an inclusive end (end-of-day).
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

function mapPushBodyToGooglePatch(
  body: z.infer<typeof PushEventBodyDto>,
): Record<string, unknown> {
  const summary = body.title.trim() || "(No title)";
  const description = mergedGoogleDescription(body.description, body.notes);

  const base: Record<string, unknown> = {
    summary,
    description,
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
): Record<string, unknown> {
  if (!meta.originalStart) return patchBody;
  const origMs = new Date(meta.originalStart).getTime();
  const userStartMs = new Date(body.start).getTime();
  const userEndMs = new Date(body.end).getTime();
  if (
    Number.isNaN(origMs) ||
    Number.isNaN(userStartMs) ||
    Number.isNaN(userEndMs)
  ) {
    return patchBody;
  }

  const deltaMs = userStartMs - origMs;
  const newDurMs = userEndMs - userStartMs;

  const sObj = masterRaw.start;
  const eObj = masterRaw.end;
  if (!sObj || typeof sObj !== "object" || !eObj || typeof eObj !== "object") {
    return patchBody;
  }

  const st = sObj as { dateTime?: string; date?: string; timeZone?: string };
  const en = eObj as { dateTime?: string; date?: string; timeZone?: string };
  if (!st.dateTime || !en.dateTime) return patchBody;

  const mStart = new Date(st.dateTime);
  const mEnd = new Date(en.dateTime);
  if (Number.isNaN(mStart.getTime()) || Number.isNaN(mEnd.getTime())) {
    return patchBody;
  }

  const newMasterStart = new Date(mStart.getTime() + deltaMs);
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
): Record<string, unknown> {
  if (!meta.originalStart?.trim()) return patchBody;
  const origYmd = meta.originalStart.trim().slice(0, 10);
  const userStartYmd = formatLocalYmd(new Date(body.start));
  const userInclusiveEndYmd = formatLocalYmd(new Date(body.end));

  const dayDelta = diffDaysYmd(userStartYmd, origYmd);

  const st = masterRaw.start as { date?: string } | undefined;
  const en = masterRaw.end as { date?: string } | undefined;
  if (!st?.date || !en?.date) return patchBody;

  const newMasterStartYmd = addDaysToYmd(st.date, dayDelta);
  const inclusiveSpanDays = diffDaysYmd(userInclusiveEndYmd, userStartYmd) + 1;
  if (inclusiveSpanDays < 1) return patchBody;
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

function adjustPatchBodyForRecurringMaster(
  patchBody: Record<string, unknown>,
  masterRaw: Record<string, unknown>,
  meta: z.infer<typeof GoogleRecurrenceMetaDto>,
  body: z.infer<typeof PushEventBodyDto>,
): Record<string, unknown> {
  const times = effectiveGoogleRecurrenceTimes(meta, {
    start: body.start,
    allDay: body.allDay,
  });
  const metaFull: z.infer<typeof GoogleRecurrenceMetaDto> = {
    ...meta,
    originalStart: times.originalStart,
    originalAllDay: times.originalAllDay,
  };

  if (body.allDay && times.originalAllDay) {
    return adjustAllDayPatchForRecurringMaster(
      patchBody,
      masterRaw,
      metaFull,
      body,
    );
  }

  if (!body.allDay && !times.originalAllDay) {
    return adjustTimedPatchForRecurringMaster(
      patchBody,
      masterRaw,
      metaFull,
      body,
    );
  }

  return patchBody;
}

function mapGoogleApiRecordToCalendarEvent(
  raw: Record<string, unknown>,
): ImportedGoogleCalendarEvent | null {
  return mapGoogleEventToCalendarEvent(raw as GoogleCalendarEventItem);
}
