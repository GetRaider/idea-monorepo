import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
} from "@nestjs/common";
import { httpClient } from "@repo/api/helpers";
import { and, eq, inArray } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { randomUUID } from "crypto";

import { env } from "../../env/env";
import { accounts, users } from "../../db/auth-schema";
import { mapCalendarEvent } from "../../db/mappers";
import {
  calendarEvents,
  googleCalendarIntegrations,
  tasks,
} from "../../db/schema";
import type { CalendarEventRow } from "../../db/schema";
import { DRIZZLE_DB } from "../../db/tokens";
import {
  googleCalendarRequest,
  googleEventBody,
  googleInstanceId,
  readGoogleEvent,
  type GoogleCalendarApiEvent,
  type GoogleEventDraft,
} from "./google-calendar.map";

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);

  constructor(@Inject(DRIZZLE_DB) private readonly db: NodePgDatabase) {}

  async status(userId: string) {
    const [integration] = await this.db
      .select()
      .from(googleCalendarIntegrations)
      .where(eq(googleCalendarIntegrations.userId, userId));
    const account = await this.googleAccount(userId);
    return {
      connected: Boolean(account?.refreshToken || account?.accessToken),
      enabled: integration?.enabled ?? false,
      calendarId: integration?.calendarId ?? "primary",
      lastSyncAt: integration?.lastSyncAt?.toISOString() ?? null,
      lastError: integration?.lastError ?? null,
      needsConsent: !hasCalendarScope(account?.scope ?? null),
    };
  }

  async disconnect(userId: string) {
    await this.db
      .update(googleCalendarIntegrations)
      .set({ enabled: false, syncToken: null, updatedAt: new Date() })
      .where(eq(googleCalendarIntegrations.userId, userId));
    return this.status(userId);
  }

  async sync(userId: string, workspaceId: string) {
    const account = await this.googleAccount(userId);
    if (!account) throw new BadRequestException("Sign in with Google first");
    if (!hasCalendarScope(account.scope)) {
      throw new ForbiddenException("Reconnect Google to allow calendar access");
    }
    const integration = await this.ensureIntegration(userId);
    try {
      const token = await this.accessToken(account);
      const email = await this.userEmail(userId);
      await this.pull(token, integration.calendarId, integration.syncToken, userId, workspaceId);
      await this.pushUnlinked(token, integration.calendarId, email, workspaceId);
      return this.status(userId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google sync failed";
      await this.db
        .update(googleCalendarIntegrations)
        .set({ lastError: message, updatedAt: new Date() })
        .where(eq(googleCalendarIntegrations.userId, userId));
      if (error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(message);
      throw new BadRequestException(message);
    }
  }

  async pushEvent(userId: string, workspaceId: string, eventId: string) {
    const status = await this.status(userId);
    if (!status.enabled || status.needsConsent) return;
    const [row] = await this.db
      .select()
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.id, eventId),
          eq(calendarEvents.workspaceId, workspaceId),
        ),
      );
    if (!row) return;
    try {
      const account = await this.googleAccount(userId);
      if (!account) return;
      const token = await this.accessToken(account);
      const email = await this.userEmail(userId);
      const integration = await this.ensureIntegration(userId);
      await this.pushRow(token, integration.calendarId, email, workspaceId, row);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google push failed";
      this.logger.warn(message);
      await this.db
        .update(googleCalendarIntegrations)
        .set({ lastError: message, updatedAt: new Date() })
        .where(eq(googleCalendarIntegrations.userId, userId));
    }
  }

  private async pull(
    accessToken: string,
    calendarId: string,
    syncToken: string | null,
    userId: string,
    workspaceId: string,
  ) {
    const collected: GoogleCalendarApiEvent[] = [];
    let pageToken: string | undefined;
    let nextSyncToken: string | null = null;
    do {
      const query: Record<string, string> = {
        singleEvents: "false",
        showDeleted: "true",
        maxResults: "250",
      };
      if (pageToken) query.pageToken = pageToken;
      else if (syncToken) query.syncToken = syncToken;
      const response = await googleCalendarRequest<{
        items?: GoogleCalendarApiEvent[];
        nextPageToken?: string;
        nextSyncToken?: string;
      }>({
        method: "get",
        accessToken,
        path: `/calendars/${encodeURIComponent(calendarId)}/events`,
        query,
      });
      if (response.status === 410 && syncToken) {
        await this.pull(accessToken, calendarId, null, userId, workspaceId);
        return;
      }
      if (response.status >= 400) {
        throw new BadRequestException(googleError(response.data, response.status));
      }
      collected.push(...(response.data.items ?? []));
      pageToken = response.data.nextPageToken;
      if (response.data.nextSyncToken) nextSyncToken = response.data.nextSyncToken;
    } while (pageToken);

    const drafts = collected
      .map(readGoogleEvent)
      .filter((draft): draft is GoogleEventDraft => draft != null);
    const masters = drafts.filter((draft) => !draft.recurringEventId);
    const exceptions = drafts.filter((draft) => draft.recurringEventId);
    for (const draft of masters) {
      await this.applyDraft(workspaceId, draft, null);
    }
    for (const draft of exceptions) {
      const master = await this.findByGoogleId(workspaceId, draft.recurringEventId!);
      await this.applyDraft(workspaceId, draft, master?.id ?? null);
    }
    await this.db
      .update(googleCalendarIntegrations)
      .set({
        syncToken: nextSyncToken,
        lastSyncAt: new Date(),
        lastError: null,
        enabled: true,
        updatedAt: new Date(),
      })
      .where(eq(googleCalendarIntegrations.userId, userId));
  }

  private async applyDraft(
    workspaceId: string,
    draft: GoogleEventDraft,
    seriesEventId: string | null,
  ) {
    if (draft.cancelled) {
      await this.db
        .delete(calendarEvents)
        .where(
          and(
            eq(calendarEvents.workspaceId, workspaceId),
            eq(calendarEvents.googleEventId, draft.googleEventId),
          ),
        );
      return;
    }
    const existing =
      (await this.findByGoogleId(workspaceId, draft.googleEventId)) ??
      (!draft.recurringEventId && draft.todexEventId
        ? await this.findById(workspaceId, draft.todexEventId)
        : undefined);
    if (
      existing?.googleEventId &&
      existing.updatedAt.getTime() > draft.updated.getTime() + 2000
    ) {
      return;
    }
    const taskScope = await this.resolveTaskScope(workspaceId, draft);
    const now = new Date();
    const values = {
      title: draft.title,
      start: draft.start,
      end: draft.end,
      allDay: draft.allDay,
      timeZone: draft.timeZone,
      recurrence: draft.recurringEventId ? null : draft.recurrence,
      rawRrule: draft.recurringEventId ? null : draft.rawRrule,
      description: draft.description,
      taskScope,
      participants: draft.participants,
      rsvpStatus: draft.rsvpStatus,
      googleEventId: draft.googleEventId,
      googleEtag: draft.etag,
      googleUpdatedAt: draft.updated,
      organizerSelf: draft.organizerSelf,
      seriesEventId,
      originalStart: draft.originalStart,
      cancelled: false,
      updatedAt: now,
    };
    if (existing) {
      await this.db
        .update(calendarEvents)
        .set(values)
        .where(eq(calendarEvents.id, existing.id));
      return;
    }
    await this.db.insert(calendarEvents).values({
      id: randomUUID(),
      workspaceId,
      color: null,
      createdAt: now,
      ...values,
    });
  }

  private async pushUnlinked(
    accessToken: string,
    calendarId: string,
    email: string,
    workspaceId: string,
  ) {
    const rows = await this.db
      .select()
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.workspaceId, workspaceId),
          eq(calendarEvents.organizerSelf, true),
          eq(calendarEvents.cancelled, false),
        ),
      );
    const pending = rows.filter((row) => !row.googleEventId && !row.seriesEventId);
    for (const row of pending) {
      await this.pushRow(accessToken, calendarId, email, workspaceId, row);
    }
  }

  private async pushRow(
    accessToken: string,
    calendarId: string,
    email: string,
    workspaceId: string,
    row: CalendarEventRow,
  ) {
    if (row.cancelled) {
      const targetId = await this.googleIdForRow(workspaceId, row);
      if (targetId) await this.removeGoogle(accessToken, calendarId, targetId);
      return;
    }
    if (!row.organizerSelf) {
      await this.pushRsvp(accessToken, calendarId, email, row);
      return;
    }
    const event = mapCalendarEvent(row);
    const summaries = await this.taskSummaries(workspaceId, event.taskScope);
    const body = googleEventBody(event, summaries, email);
    const pathId = await this.googleIdForRow(workspaceId, row);
    const path = pathId
      ? `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(pathId)}`
      : `/calendars/${encodeURIComponent(calendarId)}/events`;
    const response = await googleCalendarRequest<GoogleCalendarApiEvent>({
      method: pathId ? "patch" : "post",
      accessToken,
      path,
      query: { sendUpdates: "none" },
      body,
      etag: pathId ? row.googleEtag : null,
    });
    if (response.status === 412 && pathId) {
      await this.refreshFromGoogle(accessToken, calendarId, pathId, workspaceId);
      return;
    }
    if (response.status >= 400) {
      throw new Error(googleError(response.data, response.status));
    }
    const draft = readGoogleEvent(response.data);
    if (!draft) return;
    await this.db
      .update(calendarEvents)
      .set({
        googleEventId: row.seriesEventId ? row.googleEventId : draft.googleEventId,
        googleEtag: draft.etag ?? response.etag,
        googleUpdatedAt: draft.updated,
        updatedAt: new Date(),
      })
      .where(eq(calendarEvents.id, row.id));
    if (row.seriesEventId && !row.googleEventId) {
      await this.db
        .update(calendarEvents)
        .set({ googleEventId: draft.googleEventId, googleEtag: draft.etag })
        .where(eq(calendarEvents.id, row.id));
    }
  }

  private async pushRsvp(
    accessToken: string,
    calendarId: string,
    email: string,
    row: CalendarEventRow,
  ) {
    if (!row.googleEventId) return;
    const event = mapCalendarEvent(row);
    await googleCalendarRequest({
      method: "patch",
      accessToken,
      path: `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(row.googleEventId)}`,
      query: { sendUpdates: "none" },
      body: { attendees: googleEventBody(event, [], email).attendees },
      etag: row.googleEtag,
    });
  }

  async removeEvent(userId: string, workspaceId: string, row: CalendarEventRow) {
    const status = await this.status(userId);
    if (!status.enabled || status.needsConsent || !row.organizerSelf) return;
    const account = await this.googleAccount(userId);
    if (!account) return;
    const token = await this.accessToken(account);
    const integration = await this.ensureIntegration(userId);
    const targetId = await this.googleIdForRow(workspaceId, row);
    if (!targetId) return;
    await this.removeGoogle(token, integration.calendarId, targetId);
  }

  private async removeGoogle(
    accessToken: string,
    calendarId: string,
    googleEventId: string,
  ) {
    const response = await googleCalendarRequest({
      method: "delete",
      accessToken,
      path: `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(googleEventId)}`,
      query: { sendUpdates: "none" },
    });
    if (response.status === 404 || response.status === 410) return;
    if (response.status >= 400) {
      throw new Error(googleError(response.data, response.status));
    }
  }

  private async refreshFromGoogle(
    accessToken: string,
    calendarId: string,
    googleEventId: string,
    workspaceId: string,
  ) {
    const response = await googleCalendarRequest<GoogleCalendarApiEvent>({
      method: "get",
      accessToken,
      path: `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(googleEventId)}`,
    });
    const draft = readGoogleEvent(response.data);
    if (!draft) return;
    await this.applyDraft(workspaceId, draft, null);
  }

  private async googleIdForRow(
    workspaceId: string,
    row: CalendarEventRow,
  ): Promise<string | null> {
    if (!row.seriesEventId) return row.googleEventId;
    if (row.googleEventId) return row.googleEventId;
    const master = await this.findById(workspaceId, row.seriesEventId);
    if (!master?.googleEventId || !row.originalStart) return null;
    return googleInstanceId(
      master.googleEventId,
      row.originalStart,
      master.allDay,
      master.timeZone,
    );
  }

  private async resolveTaskScope(
    workspaceId: string,
    draft: GoogleEventDraft,
  ): Promise<string[]> {
    const linked = await this.tasksByIds(workspaceId, draft.taskIds);
    if (draft.scopeLines.length === 0) return linked.map((task) => task.id);
    const summaries = new Set(linked.map((task) => task.summary));
    const linesMatch =
      linked.length > 0 &&
      draft.scopeLines.length === linked.length &&
      draft.scopeLines.every((line) => summaries.has(line));
    if (linesMatch) return linked.map((task) => task.id);
    const bySummary = await this.db
      .select({ id: tasks.id, summary: tasks.summary })
      .from(tasks)
      .where(
        and(
          eq(tasks.workspaceId, workspaceId),
          inArray(tasks.summary, draft.scopeLines),
        ),
      );
    const ids: string[] = [];
    for (const line of draft.scopeLines) {
      const match = bySummary.find(
        (task) => task.summary === line && !ids.includes(task.id),
      );
      if (match) ids.push(match.id);
    }
    return ids.length > 0 ? ids : linked.map((task) => task.id);
  }

  private async taskSummaries(workspaceId: string, ids: string[]) {
    const rows = await this.tasksByIds(workspaceId, ids);
    return ids.flatMap((id) => {
      const task = rows.find((row) => row.id === id);
      return task ? [task.summary] : [];
    });
  }

  private async tasksByIds(workspaceId: string, ids: string[]) {
    if (ids.length === 0) return [];
    return this.db
      .select({ id: tasks.id, summary: tasks.summary })
      .from(tasks)
      .where(and(eq(tasks.workspaceId, workspaceId), inArray(tasks.id, ids)));
  }

  private async findByGoogleId(workspaceId: string, googleEventId: string) {
    const [row] = await this.db
      .select()
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.workspaceId, workspaceId),
          eq(calendarEvents.googleEventId, googleEventId),
        ),
      );
    return row;
  }

  private async findById(workspaceId: string, eventId: string) {
    const [row] = await this.db
      .select()
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.workspaceId, workspaceId),
          eq(calendarEvents.id, eventId),
        ),
      );
    return row;
  }

  private async ensureIntegration(userId: string) {
    const [existing] = await this.db
      .select()
      .from(googleCalendarIntegrations)
      .where(eq(googleCalendarIntegrations.userId, userId));
    if (existing) {
      if (!existing.enabled) {
        await this.db
          .update(googleCalendarIntegrations)
          .set({ enabled: true, updatedAt: new Date() })
          .where(eq(googleCalendarIntegrations.userId, userId));
      }
      return existing;
    }
    const now = new Date();
    const [created] = await this.db
      .insert(googleCalendarIntegrations)
      .values({
        userId,
        enabled: true,
        calendarId: "primary",
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    if (!created) throw new BadRequestException("Could not store Google Calendar");
    return created;
  }

  private async googleAccount(userId: string) {
    const [account] = await this.db
      .select()
      .from(accounts)
      .where(and(eq(accounts.userId, userId), eq(accounts.providerId, "google")));
    return account;
  }

  private async userEmail(userId: string) {
    const [user] = await this.db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId));
    if (!user?.email) throw new BadRequestException("Missing account email");
    return user.email;
  }

  private async accessToken(account: {
    id: string;
    accessToken: string | null;
    refreshToken: string | null;
    accessTokenExpiresAt: Date | null;
  }) {
    if (
      account.accessToken &&
      account.accessTokenExpiresAt &&
      account.accessTokenExpiresAt.getTime() > Date.now() + 60_000
    ) {
      return account.accessToken;
    }
    if (!account.refreshToken) {
      throw new ForbiddenException("Reconnect Google to allow calendar access");
    }
    const body = new URLSearchParams({
      client_id: env.google.clientId,
      client_secret: env.google.clientSecret,
      refresh_token: account.refreshToken,
      grant_type: "refresh_token",
    });
    const response = await httpClient.post<{
      access_token?: string;
      expires_in?: number;
      error?: string;
    }>({
      url: "https://oauth2.googleapis.com/token",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    if (response.status >= 400 || !response.data.access_token) {
      throw new ForbiddenException("Reconnect Google to allow calendar access");
    }
    const expiresAt = new Date(
      Date.now() + (response.data.expires_in ?? 3600) * 1000,
    );
    await this.db
      .update(accounts)
      .set({
        accessToken: response.data.access_token,
        accessTokenExpiresAt: expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, account.id));
    return response.data.access_token;
  }
}

function hasCalendarScope(scope: string | null): boolean {
  return Boolean(scope?.includes(CALENDAR_SCOPE) || scope?.includes("calendar"));
}

function googleError(data: unknown, status: number): string {
  if (data && typeof data === "object" && "error" in data) {
    const error = (data as { error?: { message?: string } | string }).error;
    if (typeof error === "string") return error;
    if (error?.message) return error.message;
  }
  return `Google Calendar request failed (${status})`;
}
