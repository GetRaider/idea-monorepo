import { getAccessByAuth, requireNonAnonymous } from "@/auth/guards";
import { auth } from "@/auth/server";
import { HttpError } from "@/lib/api/errors";
import { apiServices } from "@/server/services/api";
import { googleCalendarColorIdToHex } from "@/helpers/calendar/google-calendar-event-colors";
import {
  parseGoogleGcalInstanceOccurrence,
  resolveGoogleRecurrenceMeta,
  resolveRecurringMasterId,
} from "@/helpers/calendar/google-calendar-recurrence.helper";
import {
  deleteGoogleCalendarEvent,
  getGoogleCalendarColors,
  getGoogleCalendarEvent,
  getGoogleCalendarListEntry,
  GoogleCalendarSyncTokenExpiredError,
  listGoogleCalendarEvents,
  mergeGoogleMasterForPut,
  patchGoogleCalendarEvent,
  postGoogleCalendarEvent,
  updateGoogleCalendarEvent,
} from "@/server/services/google/google-calendar.client";
import {
  pushGoogleCalendarFollowingSplit,
  resolveFollowingMasterIdFromInstance,
  truncateGoogleCalendarSeriesBefore,
} from "@/server/services/google/google-calendar-recurring-push";
import { resolveLinkedRecurringMasterIds } from "@/server/services/google/google-calendar-split-lineage";

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
  effectiveGoogleRecurrenceTimes,
  mapGoogleApiRecordToCalendarEvent,
  mapGoogleEventToCalendarEvent,
  mapPushBodyToGooglePatch,
  mergeGoogleRsvpIntoPatch,
  prepareSeriesMasterPushPatch,
  resolveFollowingTruncateMeta,
  resolvePushGoogleRecurrenceFromBody,
  stripGooglePatchColorUnlessRequested,
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

      let palettes;
      try {
        palettes = await getGoogleCalendarColors(accessToken);
      } catch {
        palettes = undefined;
      }

      let listResult: Awaited<ReturnType<typeof listGoogleCalendarEvents>>;
      let didFullResync = false;
      try {
        listResult = await listGoogleCalendarEvents({
          accessToken,
          calendarId: syncState.calendarId,
          syncToken: syncState.syncToken,
          timeMin,
          timeMax,
        });
      } catch (error) {
        if (
          error instanceof GoogleCalendarSyncTokenExpiredError &&
          syncState.syncToken
        ) {
          didFullResync = true;
          listResult = await listGoogleCalendarEvents({
            accessToken,
            calendarId: syncState.calendarId,
            syncToken: null,
            timeMin,
            timeMax,
          });
        } else {
          throw error;
        }
      }

      const { items, nextSyncToken } = listResult;

      const imported = items
        .map((event) => mapGoogleEventToCalendarEvent(event, palettes))
        .filter(
          (event): event is ImportedGoogleCalendarEvent => event !== null,
        );

      let googleCalendarColor: string | undefined;
      try {
        const listEntry = await getGoogleCalendarListEntry({
          accessToken,
          calendarId: syncState.calendarId,
        });
        googleCalendarColor = googleCalendarColorIdToHex(
          listEntry.colorId,
          palettes,
        );
      } catch {
        googleCalendarColor = undefined;
      }

      await apiServices.googleCalendarIntegration.upsertSyncResult({
        userId: access.userId,
        nextSyncToken,
        lastSyncAt: now,
      });

      const effectiveIncremental = incremental && !didFullResync;

      return {
        imported,
        lastSyncAt: now.toISOString(),
        incremental: effectiveIncremental,
        ...(googleCalendarColor ? { googleCalendarColor } : {}),
        ...(effectiveIncremental
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
      const resolvedRecurrence = resolvePushGoogleRecurrenceFromBody(body);
      const userEmail = authContext.user.email?.trim();
      if (body.rsvpStatus && !userEmail) {
        throw new HttpError(
          400,
          "Your account email is required to update RSVP on Google Calendar.",
        );
      }

      try {
        if (scope === "following") {
          if (!resolvedRecurrence?.recurringEventId) {
            throw new HttpError(400, "Missing Google recurrence metadata.");
          }
          if (!parseGoogleGcalInstanceOccurrence(body.id)) {
            throw new HttpError(
              400,
              "Open a specific occurrence to update this and following events.",
            );
          }
          const instanceGet = await getGoogleCalendarEvent({
            accessToken,
            calendarId: syncState.calendarId,
            googleEventId,
          });
          const times = resolveFollowingTruncateMeta({
            instanceRaw: instanceGet.raw,
            resolvedRecurrence,
            body,
          });
          const followingMasterId = resolveFollowingMasterIdFromInstance(
            instanceGet.raw,
            resolveRecurringMasterId(body.id, resolvedRecurrence) ??
              resolvedRecurrence.recurringEventId,
          );
          let followingPatchBody = stripGooglePatchColorUnlessRequested(
            patchBody,
            body,
          );
          if (body.rsvpStatus && userEmail) {
            const masterGet = await getGoogleCalendarEvent({
              accessToken,
              calendarId: syncState.calendarId,
              googleEventId: followingMasterId,
            });
            followingPatchBody = mergeGoogleRsvpIntoPatch(
              followingPatchBody,
              masterGet.raw,
              body.rsvpStatus,
              userEmail,
            );
          }
          await pushGoogleCalendarFollowingSplit({
            accessToken,
            calendarId: syncState.calendarId,
            masterId: followingMasterId,
            meta: times,
            patchBody: followingPatchBody,
          });
          await apiServices.googleCalendarIntegration.invalidateSyncToken(
            access.userId,
          );
        } else if (scope === "series") {
          const masterId = resolveRecurringMasterId(
            body.id,
            body.googleRecurrence,
          );
          if (!masterId) {
            throw new HttpError(
              400,
              "Could not resolve the recurring series master for this Google event.",
            );
          }
          if (!resolvedRecurrence) {
            throw new HttpError(400, "Missing Google recurrence metadata.");
          }

          const masterGet = await getGoogleCalendarEvent({
            accessToken,
            calendarId: syncState.calendarId,
            googleEventId: masterId,
          });
          const linkedMasterIds = await resolveLinkedRecurringMasterIds({
            accessToken,
            calendarId: syncState.calendarId,
            seedMasterId: masterId,
            seedMasterRaw: masterGet.raw,
          });
          const mergedMeta = {
            ...resolvedRecurrence,
            recurringEventId: masterId,
            ...effectiveGoogleRecurrenceTimes(resolvedRecurrence, {
              start: body.start,
              allDay: body.allDay,
              timeZone: body.timeZone,
            }),
          };

          for (const linkedMasterId of linkedMasterIds) {
            const linkedMasterGet =
              linkedMasterId === masterId
                ? masterGet
                : await getGoogleCalendarEvent({
                    accessToken,
                    calendarId: syncState.calendarId,
                    googleEventId: linkedMasterId,
                  });
            let bodyToSend = prepareSeriesMasterPushPatch(
              patchBody,
              linkedMasterGet.raw,
              {
                ...mergedMeta,
                recurringEventId: linkedMasterId,
              },
              body,
            );
            if (body.rsvpStatus && userEmail) {
              bodyToSend = mergeGoogleRsvpIntoPatch(
                bodyToSend,
                linkedMasterGet.raw,
                body.rsvpStatus,
                userEmail,
              );
            }
            const putBody = mergeGoogleMasterForPut(
              linkedMasterGet.raw,
              bodyToSend,
            );
            await updateGoogleCalendarEvent({
              accessToken,
              calendarId: syncState.calendarId,
              googleEventId: linkedMasterId,
              body: putBody,
              etag: linkedMasterGet.etag,
            });
          }
        } else {
          if (body.rsvpStatus && userEmail) {
            const instanceGet = await getGoogleCalendarEvent({
              accessToken,
              calendarId: syncState.calendarId,
              googleEventId: googleEventId,
            });
            patchBody = mergeGoogleRsvpIntoPatch(
              patchBody,
              instanceGet.raw,
              body.rsvpStatus,
              userEmail,
            );
          }
          await patchGoogleCalendarEvent({
            accessToken,
            calendarId: syncState.calendarId,
            googleEventId,
            body: patchBody,
          });
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
      const resolvedRecurrence = resolveGoogleRecurrenceMeta(
        body.id,
        body.googleRecurrence,
        {
          start: body.start?.trim() ?? "",
          allDay: body.allDay ?? false,
        },
      );

      try {
        if (scope === "following") {
          if (!resolvedRecurrence?.recurringEventId) {
            throw new HttpError(400, "Missing Google recurrence metadata.");
          }
          if (!resolvedRecurrence.originalStart?.trim()) {
            throw new HttpError(
              400,
              "Recurring delete (this and following) needs the instance start time. Refresh the calendar and try again.",
            );
          }
          const times = effectiveGoogleRecurrenceTimes(resolvedRecurrence, {
            start: body.start?.trim() ?? "",
            allDay: body.allDay ?? false,
          });
          const deleteMasterId =
            resolveRecurringMasterId(body.id, resolvedRecurrence) ??
            resolvedRecurrence.recurringEventId;
          await truncateGoogleCalendarSeriesBefore({
            accessToken,
            calendarId: syncState.calendarId,
            masterId: deleteMasterId,
            meta: times,
          });
          await apiServices.googleCalendarIntegration.invalidateSyncToken(
            access.userId,
          );
        } else {
          const seriesMasterId =
            scope === "series"
              ? resolveRecurringMasterId(body.id, resolvedRecurrence)
              : undefined;
          const targetGoogleId =
            scope === "series" && seriesMasterId
              ? seriesMasterId
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
        patchBody = mapPushBodyToGooglePatch(
          {
            ...body,
            id: "gcal:create-placeholder",
            type: "common",
          },
          { includeRecurrence: true },
        );
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
