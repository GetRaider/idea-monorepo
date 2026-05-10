import { z } from "zod";

import { getAccessByAuth, requireNonAnonymous } from "@/auth/guards";
import { auth } from "@/auth/server";
import { HttpError } from "@/lib/api/errors";
import { apiServices } from "@/server/services/api";
import {
  listGoogleCalendarEvents,
  type GoogleCalendarEventItem,
} from "@/server/services/google/google-calendar.client";
import type { CalendarEvent, CalendarRsvpStatus } from "@/types/calendar.types";

import { BaseController } from "./base.controller";

type ImportedGoogleCalendarEvent = Omit<CalendarEvent, "type"> & {
  type: "common";
};

const ToggleBodyDto = z.object({ enabled: z.boolean() });

const StatusResponseDto = z.object({
  connected: z.boolean(),
  email: z.string().nullable(),
  enabled: z.boolean(),
  lastSyncAt: z.string().nullable(),
});

const SyncResponseDto = z.object({
  imported: z.array(
    z.object({
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
    }),
  ),
  lastSyncAt: z.string(),
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
        email: status.connected ? authContext.user.email : null,
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
      if (!status.connected) {
        throw new HttpError(400, "Connect Google Calendar first.");
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
        email: refreshed.connected ? authContext.user.email : null,
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
      if (!status.connected) {
        throw new HttpError(400, "Connect Google Calendar first.");
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

      return { imported, lastSyncAt: now.toISOString() };
    },
  });

  disconnect = this.initRoute({
    handler: async ({ request }) => {
      const authContext = await requireNonAnonymous();
      const access = getAccessByAuth(authContext);

      // Best-effort unlink; Better Auth may prevent unlinking the last account.
      try {
        await auth.api.unlinkAccount({
          body: { providerId: "google" },
          headers: request.headers,
        });
      } catch (e) {
        const message =
          e instanceof Error
            ? e.message
            : "Failed to disconnect Google account.";
        throw new HttpError(400, message);
      } finally {
        await apiServices.googleCalendarIntegration.clearIntegration(
          access.userId,
        );
      }

      return new Response(null, { status: 204 });
    },
  });
}

function mapGoogleEventToCalendarEvent(
  e: GoogleCalendarEventItem,
): ImportedGoogleCalendarEvent | null {
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
