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
} from "@/server/services/google/google-calendar.client";
import {
  pushGoogleCalendarFollowingSplit,
  truncateGoogleCalendarSeriesBefore,
} from "@/server/services/google/google-calendar-recurring-push";

import { BaseController } from "./base.controller";
import {
  CreateEventBodyDto,
  CreateEventResponseDto,
  DeleteEventBodyDto,
  PushEventBodyDto,
  PushResponseDto,
  StatusResponseDto,
  SyncResponseDto,
  ToggleBodyDto,
} from "./google-calendar-integration.dto";
import {
  adjustPatchBodyForRecurringMaster,
  effectiveGoogleRecurrenceTimes,
  mapGoogleApiRecordToCalendarEvent,
  mapGoogleEventToCalendarEvent,
  mapPushBodyToGooglePatch,
  type ImportedGoogleCalendarEvent,
} from "./google-calendar-integration.mapper";

async function readGoogleOAuthAccessToken(headers: Headers): Promise<string> {
  const tokenResult = await auth.api.getAccessToken({
    body: { providerId: "google" },
    headers,
  });
  const accessToken = (tokenResult as { accessToken?: string } | null)
    ?.accessToken;
  if (!accessToken) {
    throw new HttpError(
      400,
      "Missing Google access token. Reconnect Google Calendar.",
    );
  }
  return accessToken;
}

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

      const accessToken = await readGoogleOAuthAccessToken(request.headers);

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

      const accessToken = await readGoogleOAuthAccessToken(request.headers);

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

      const accessToken = await readGoogleOAuthAccessToken(request.headers);

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

      const accessToken = await readGoogleOAuthAccessToken(request.headers);

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
