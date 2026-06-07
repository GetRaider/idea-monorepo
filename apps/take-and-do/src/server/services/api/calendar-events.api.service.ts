import { randomUUID } from "node:crypto";

import { and, eq, gt, lt } from "@/db/client";
import { calendarEventsTable } from "@/db/schemas/calendar-event.schema";
import type {
  CalendarEventCreateBody,
  CalendarEventPatchBody,
} from "@/db/dtos";
import {
  calendarEventRowToClient,
  clientCalendarEventToExtra,
} from "@/helpers/calendar-event-db.mapper";
import type {
  CommonCalendarEvent,
  TimeBlockCalendarEvent,
} from "@/types/calendar.types";

import {
  BaseApiService,
  type DataAccess,
} from "@/server/services/api/base.api.service";

export class CalendarEventsApiService extends BaseApiService {
  async listOverlapping(from: Date, to: Date, access: DataAccess) {
    return this.handleOperation(async () => {
      if (access.isAnonymous) return [];
      const rows = await this.db
        .select()
        .from(calendarEventsTable)
        .where(
          and(
            eq(calendarEventsTable.userId, access.userId),
            lt(calendarEventsTable.start, to),
            gt(calendarEventsTable.end, from),
          ),
        );
      return rows.map(calendarEventRowToClient);
    });
  }

  async create(body: CalendarEventCreateBody, access: DataAccess) {
    return this.handleOperation(async () => {
      if (access.isAnonymous) return null;
      const id = body.id?.trim() || randomUUID();
      const now = new Date();
      const start = new Date(body.start);
      const end = new Date(body.end);
      const forExtra = {
        id,
        type: body.type,
        title: body.title,
        start: body.start,
        end: body.end,
        allDay: body.allDay ?? false,
        ...(body.color != null && body.color !== ""
          ? { color: body.color }
          : {}),
        reminderMinutes: body.reminderMinutes,
        timeZone: body.timeZone,
        repeat: body.repeat,
        meetingUrl: body.meetingUrl,
        participants: body.participants,
        notes: body.notes,
        description: body.description,
        ...(body.type === "timeBlock" ? { taskScope: body.taskScope } : {}),
        ...(body.rsvpStatus !== undefined
          ? { rsvpStatus: body.rsvpStatus }
          : {}),
        ...(body.rsvpDeclineReason !== undefined
          ? { rsvpDeclineReason: body.rsvpDeclineReason }
          : {}),
      } as CommonCalendarEvent | TimeBlockCalendarEvent;
      const extra = clientCalendarEventToExtra(forExtra);
      const [row] = await this.db
        .insert(calendarEventsTable)
        .values({
          id,
          userId: access.userId,
          type: body.type,
          title: body.title,
          start,
          end,
          allDay: body.allDay ?? false,
          color: body.color ?? null,
          extra: Object.keys(extra).length > 0 ? extra : null,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      if (!row) return null;
      return calendarEventRowToClient(row);
    });
  }

  async updateById(
    id: string,
    patch: CalendarEventPatchBody,
    access: DataAccess,
  ) {
    return this.handleOperation(async () => {
      if (access.isAnonymous) return null;
      const rows = await this.db
        .select()
        .from(calendarEventsTable)
        .where(
          and(
            eq(calendarEventsTable.id, id),
            eq(calendarEventsTable.userId, access.userId),
          ),
        );
      const existing = rows[0];
      if (!existing) return null;

      const prevClient = calendarEventRowToClient(existing) as
        | CommonCalendarEvent
        | TimeBlockCalendarEvent;

      const mergedType = (patch.type ?? prevClient.type) as
        | "common"
        | "timeBlock";
      const mergedTitle = patch.title ?? prevClient.title;
      const mergedStart = patch.start
        ? new Date(patch.start)
        : new Date(prevClient.start);
      const mergedEnd = patch.end
        ? new Date(patch.end)
        : new Date(prevClient.end);
      const mergedAllDay =
        patch.allDay !== undefined ? patch.allDay : prevClient.allDay;
      const mergedColor =
        patch.color !== undefined
          ? patch.color
          : (prevClient as { color?: string }).color;

      const nextForExtra: CommonCalendarEvent | TimeBlockCalendarEvent = {
        ...prevClient,
        type: mergedType,
        title: mergedTitle,
        start: mergedStart.toISOString(),
        end: mergedEnd.toISOString(),
        allDay: mergedAllDay,
        ...(mergedColor ? { color: mergedColor } : {}),
        ...(patch.reminderMinutes !== undefined
          ? { reminderMinutes: patch.reminderMinutes }
          : {}),
        ...(patch.timeZone !== undefined ? { timeZone: patch.timeZone } : {}),
        ...(patch.repeat !== undefined ? { repeat: patch.repeat } : {}),
        ...(patch.meetingUrl !== undefined
          ? { meetingUrl: patch.meetingUrl }
          : {}),
        ...(patch.participants !== undefined
          ? { participants: patch.participants }
          : {}),
        ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
        ...(patch.description !== undefined
          ? { description: patch.description }
          : {}),
        ...(mergedType === "timeBlock" && patch.taskScope !== undefined
          ? { taskScope: patch.taskScope }
          : {}),
        ...(patch.rsvpStatus !== undefined
          ? { rsvpStatus: patch.rsvpStatus }
          : {}),
        ...(patch.rsvpDeclineReason !== undefined
          ? { rsvpDeclineReason: patch.rsvpDeclineReason }
          : {}),
      } as CommonCalendarEvent | TimeBlockCalendarEvent;

      if (patch.rsvpStatus !== undefined && patch.rsvpStatus !== "no") {
        delete (nextForExtra as CommonCalendarEvent).rsvpDeclineReason;
      }

      const extra = clientCalendarEventToExtra(nextForExtra);
      const now = new Date();
      const [row] = await this.db
        .update(calendarEventsTable)
        .set({
          type: mergedType,
          title: mergedTitle,
          start: mergedStart,
          end: mergedEnd,
          allDay: mergedAllDay,
          color: mergedColor ?? null,
          extra: Object.keys(extra).length > 0 ? extra : null,
          updatedAt: now,
        })
        .where(eq(calendarEventsTable.id, id))
        .returning();
      if (!row) return null;
      return calendarEventRowToClient(row);
    });
  }

  async deleteById(id: string, access: DataAccess) {
    return this.handleOperation(async () => {
      if (access.isAnonymous) return false;
      const deleted = await this.db
        .delete(calendarEventsTable)
        .where(
          and(
            eq(calendarEventsTable.id, id),
            eq(calendarEventsTable.userId, access.userId),
          ),
        )
        .returning({ id: calendarEventsTable.id });
      return deleted.length > 0;
    });
  }
}
