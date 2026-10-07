import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { and, eq, gt, gte, inArray, isNotNull, isNull, lt, or } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { randomUUID } from "crypto";
import type {
  CreateCalendarEventBody,
  DeleteCalendarEventQuery,
  ListCalendarEventsQuery,
  UpdateCalendarEventBody,
} from "@repo/api/todex";

import { mapCalendarEvent } from "../../db/mappers";
import { calendarEvents, tasks } from "../../db/schema";
import type { CalendarEventRow } from "../../db/schema";
import { DRIZZLE_DB } from "../../db/tokens";
import { GoogleCalendarService } from "./google-calendar.service";

@Injectable()
export class CalendarEventsService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: NodePgDatabase,
    private readonly googleCalendar: GoogleCalendarService,
  ) {}

  async list(workspaceId: string, query: ListCalendarEventsQuery) {
    const from = new Date(query.from);
    const to = new Date(query.to);
    const rows = await this.db
      .select()
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.workspaceId, workspaceId),
          or(
            and(
              isNull(calendarEvents.seriesEventId),
              or(
                isNotNull(calendarEvents.recurrence),
                isNotNull(calendarEvents.rawRrule),
              ),
              lt(calendarEvents.start, to),
            ),
            and(lt(calendarEvents.start, to), gt(calendarEvents.end, from)),
            and(
              isNotNull(calendarEvents.originalStart),
              gte(calendarEvents.originalStart, from),
              lt(calendarEvents.originalStart, to),
            ),
          ),
        ),
      );
    return rows.map(mapCalendarEvent);
  }

  async get(workspaceId: string, eventId: string) {
    return mapCalendarEvent(await this.require(workspaceId, eventId));
  }

  async create(
    workspaceId: string,
    userId: string,
    body: CreateCalendarEventBody,
  ) {
    await this.requireTasks(workspaceId, body.taskScope ?? []);
    const now = new Date();
    const id = randomUUID();
    await this.db.insert(calendarEvents).values({
      id,
      workspaceId,
      title: body.title,
      start: new Date(body.start),
      end: new Date(body.end),
      allDay: body.allDay ?? false,
      color: body.color ?? null,
      timeZone: body.timeZone,
      recurrence: body.recurrence ?? null,
      description: body.description ?? "",
      taskScope: body.taskScope ?? [],
      participants: body.participants ?? [],
      rsvpStatus: body.rsvpStatus ?? null,
      organizerSelf: true,
      createdAt: now,
      updatedAt: now,
    });
    await this.googleCalendar.pushEvent(userId, workspaceId, id);
    return this.get(workspaceId, id);
  }

  async update(
    workspaceId: string,
    userId: string,
    eventId: string,
    body: UpdateCalendarEventBody,
  ) {
    const existing = await this.require(workspaceId, eventId);
    this.assertWritable(existing, body);
    if (body.taskScope) await this.requireTasks(workspaceId, body.taskScope);
    if (
      body.scope === "instance" &&
      isSeriesMaster(existing) &&
      body.originalStart
    ) {
      const exception = await this.upsertException(workspaceId, existing, body);
      await this.googleCalendar.pushEvent(userId, workspaceId, existing.id);
      await this.googleCalendar.pushEvent(userId, workspaceId, exception.id);
      return mapCalendarEvent(exception);
    }
    const now = new Date();
    await this.db
      .update(calendarEvents)
      .set({
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.start !== undefined ? { start: new Date(body.start) } : {}),
        ...(body.end !== undefined ? { end: new Date(body.end) } : {}),
        ...(body.allDay !== undefined ? { allDay: body.allDay } : {}),
        ...(body.color !== undefined ? { color: body.color } : {}),
        ...(body.timeZone !== undefined ? { timeZone: body.timeZone } : {}),
        ...(body.recurrence !== undefined
          ? { recurrence: body.recurrence, rawRrule: null }
          : {}),
        ...(body.description !== undefined
          ? { description: body.description }
          : {}),
        ...(body.taskScope !== undefined ? { taskScope: body.taskScope } : {}),
        ...(body.participants !== undefined
          ? { participants: body.participants }
          : {}),
        ...(body.rsvpStatus !== undefined
          ? { rsvpStatus: body.rsvpStatus }
          : {}),
        updatedAt: now,
      })
      .where(eq(calendarEvents.id, existing.id));
    await this.googleCalendar.pushEvent(userId, workspaceId, existing.id);
    return this.get(workspaceId, existing.id);
  }

  async remove(
    workspaceId: string,
    userId: string,
    eventId: string,
    query: DeleteCalendarEventQuery,
  ) {
    const existing = await this.require(workspaceId, eventId);
    if (query.scope === "instance" && isSeriesMaster(existing)) {
      if (!query.originalStart) {
        throw new BadRequestException("originalStart is required");
      }
      if (!existing.organizerSelf) {
        throw new BadRequestException("This event can only be RSVP'd");
      }
      const exception = await this.upsertException(workspaceId, existing, {
        originalStart: query.originalStart,
        title: existing.title,
      });
      await this.db
        .update(calendarEvents)
        .set({ cancelled: true, updatedAt: new Date() })
        .where(eq(calendarEvents.id, exception.id));
      const [cancelled] = await this.db
        .select()
        .from(calendarEvents)
        .where(eq(calendarEvents.id, exception.id));
      if (cancelled) {
        await this.googleCalendar.pushEvent(userId, workspaceId, cancelled.id);
      }
      return;
    }
    await this.googleCalendar.removeEvent(userId, workspaceId, existing);
    await this.db.delete(calendarEvents).where(eq(calendarEvents.id, existing.id));
  }

  private async upsertException(
    workspaceId: string,
    master: CalendarEventRow,
    body: UpdateCalendarEventBody,
  ) {
    const originalStart = new Date(body.originalStart ?? master.start);
    const rows = await this.db
      .select()
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.workspaceId, workspaceId),
          eq(calendarEvents.seriesEventId, master.id),
        ),
      );
    const existing = rows.find(
      (row) => row.originalStart?.getTime() === originalStart.getTime(),
    );
    const duration = master.end.getTime() - master.start.getTime();
    const start = body.start ? new Date(body.start) : originalStart;
    const end = body.end
      ? new Date(body.end)
      : new Date(start.getTime() + duration);
    const now = new Date();
    const values = {
      title: body.title ?? existing?.title ?? master.title,
      start,
      end,
      allDay: body.allDay ?? existing?.allDay ?? master.allDay,
      color: body.color === undefined ? (existing?.color ?? master.color) : body.color,
      timeZone: body.timeZone ?? existing?.timeZone ?? master.timeZone,
      description: body.description ?? existing?.description ?? master.description,
      taskScope: body.taskScope ?? existing?.taskScope ?? master.taskScope,
      participants: body.participants ?? existing?.participants ?? master.participants,
      rsvpStatus:
        body.rsvpStatus === undefined
          ? (existing?.rsvpStatus ?? master.rsvpStatus)
          : body.rsvpStatus,
      originalStart,
      updatedAt: now,
    };
    if (existing) {
      await this.db
        .update(calendarEvents)
        .set(values)
        .where(eq(calendarEvents.id, existing.id));
      const [updated] = await this.db
        .select()
        .from(calendarEvents)
        .where(eq(calendarEvents.id, existing.id));
      if (!updated) throw new NotFoundException("Calendar event");
      return updated;
    }
    const id = randomUUID();
    const [created] = await this.db
      .insert(calendarEvents)
      .values({
        id,
        workspaceId,
        seriesEventId: master.id,
        recurrence: null,
        rawRrule: null,
        organizerSelf: master.organizerSelf,
        cancelled: false,
        createdAt: now,
        ...values,
      })
      .returning();
    if (!created) throw new NotFoundException("Calendar event");
    return created;
  }

  private assertWritable(existing: CalendarEventRow, body: UpdateCalendarEventBody) {
    if (existing.organizerSelf) return;
    const locked = [
      body.title,
      body.start,
      body.end,
      body.allDay,
      body.color,
      body.timeZone,
      body.recurrence,
      body.description,
      body.taskScope,
      body.participants,
    ];
    if (locked.some((value) => value !== undefined)) {
      throw new BadRequestException("This event can only be RSVP'd");
    }
  }

  private async require(workspaceId: string, eventId: string) {
    const [row] = await this.db
      .select()
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.id, eventId),
          eq(calendarEvents.workspaceId, workspaceId),
        ),
      );
    if (!row) throw new NotFoundException("Calendar event");
    return row;
  }

  private async requireTasks(workspaceId: string, taskIds: string[]) {
    if (taskIds.length === 0) return;
    const rows = await this.db
      .select({ id: tasks.id })
      .from(tasks)
      .where(and(eq(tasks.workspaceId, workspaceId), inArray(tasks.id, taskIds)));
    if (rows.length !== new Set(taskIds).size) {
      throw new BadRequestException("Unknown task in scope");
    }
  }
}

function isSeriesMaster(row: CalendarEventRow): boolean {
  return !row.seriesEventId && (row.recurrence != null || row.rawRrule != null);
}
