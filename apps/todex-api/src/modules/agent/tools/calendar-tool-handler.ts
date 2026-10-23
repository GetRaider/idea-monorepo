import { BadRequestException, Injectable } from "@nestjs/common";
import { z } from "zod";

import { CalendarEventsService } from "../../calendar/calendar-events.service";
import type { ToolHandler } from "./tool-handler";

const isoDateTimeSchema = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: "Expected an ISO date string",
});

const colorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/)
  .nullable();

@Injectable()
export class CalendarToolHandler {
  constructor(private readonly events: CalendarEventsService) {}

  handlers(): ToolHandler[] {
    return [
      {
        name: "list_calendar_events",
        access: "read",
        description: "List calendar events in the current workspace that overlap an ISO interval.",
        parameters: z
          .object({
            from: isoDateTimeSchema,
            to: isoDateTimeSchema,
          })
          .strict()
          .refine((value) => Date.parse(value.from) < Date.parse(value.to), {
            message: "to must be after from",
          }),
        handle: async ({ workspaceId, args }) => {
          const query = args as { from: string; to: string };
          return this.events.list(workspaceId, query);
        },
      },
      {
        name: "get_calendar_event",
        access: "read",
        description: "Get one calendar event in the current workspace by id.",
        parameters: z.object({ eventId: z.string().min(1) }).strict(),
        handle: async ({ workspaceId, args }) => {
          const { eventId } = args as { eventId: string };
          return this.events.get(workspaceId, eventId);
        },
      },
      {
        name: "create_calendar_event",
        access: "write",
        description:
          "Create a calendar event in the current workspace. start and end are ISO datetimes. timeZone is an IANA name.",
        parameters: z
          .object({
            title: z.string().trim().min(1).max(500),
            start: isoDateTimeSchema,
            end: isoDateTimeSchema,
            timeZone: z.string().trim().min(1).max(100),
            allDay: z.boolean().optional(),
            description: z.string().max(20_000).optional(),
            color: colorSchema.optional(),
          })
          .strict()
          .refine((value) => Date.parse(value.start) < Date.parse(value.end), {
            message: "end must be after start",
          }),
        handle: async ({ workspaceId, userId, args }) => {
          const body = args as CreateCalendarEventArgs;
          return this.events.create(workspaceId, userId, {
            title: body.title,
            start: body.start,
            end: body.end,
            timeZone: body.timeZone,
            ...(body.allDay !== undefined ? { allDay: body.allDay } : {}),
            ...(body.description !== undefined ? { description: body.description } : {}),
            ...(body.color !== undefined ? { color: body.color } : {}),
          });
        },
      },
      {
        name: "update_calendar_event",
        access: "write",
        description: "Update a calendar event in the current workspace.",
        parameters: z
          .object({
            eventId: z.string().min(1),
            title: z.string().trim().min(1).max(500).optional(),
            start: isoDateTimeSchema.optional(),
            end: isoDateTimeSchema.optional(),
            timeZone: z.string().trim().min(1).max(100).optional(),
            allDay: z.boolean().optional(),
            description: z.string().max(20_000).optional(),
            color: colorSchema.optional(),
          })
          .strict()
          .refine(
            (value) =>
              value.start == null ||
              value.end == null ||
              Date.parse(value.start) < Date.parse(value.end),
            { message: "end must be after start" },
          ),
        handle: async ({ workspaceId, userId, args }) => {
          const body = args as UpdateCalendarEventArgs;
          if (
            body.title === undefined &&
            body.start === undefined &&
            body.end === undefined &&
            body.timeZone === undefined &&
            body.allDay === undefined &&
            body.description === undefined &&
            body.color === undefined
          ) {
            throw new BadRequestException("No changes");
          }
          return this.events.update(workspaceId, userId, body.eventId, {
            ...(body.title !== undefined ? { title: body.title } : {}),
            ...(body.start !== undefined ? { start: body.start } : {}),
            ...(body.end !== undefined ? { end: body.end } : {}),
            ...(body.timeZone !== undefined ? { timeZone: body.timeZone } : {}),
            ...(body.allDay !== undefined ? { allDay: body.allDay } : {}),
            ...(body.description !== undefined ? { description: body.description } : {}),
            ...(body.color !== undefined ? { color: body.color } : {}),
          });
        },
      },
      {
        name: "delete_calendar_event",
        access: "write",
        description: "Delete a calendar event in the current workspace.",
        parameters: z.object({ eventId: z.string().min(1) }).strict(),
        handle: async ({ workspaceId, userId, args }) => {
          const { eventId } = args as { eventId: string };
          await this.events.remove(workspaceId, userId, eventId, {});
          return { ok: true };
        },
      },
    ];
  }
}

interface CreateCalendarEventArgs {
  title: string;
  start: string;
  end: string;
  timeZone: string;
  allDay?: boolean;
  description?: string;
  color?: string | null;
}

interface UpdateCalendarEventArgs {
  eventId: string;
  title?: string;
  start?: string;
  end?: string;
  timeZone?: string;
  allDay?: boolean;
  description?: string;
  color?: string | null;
}
