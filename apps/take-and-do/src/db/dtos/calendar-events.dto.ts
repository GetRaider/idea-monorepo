import { z } from "zod";

const isoDateTime = z.string().min(1);

export const CalendarEventsListQueryDto = z.object({
  from: isoDateTime,
  to: isoDateTime,
});

export const CalendarEventCreateBodySchema = z.object({
  id: z.string().min(1).optional(),
  type: z.enum(["common", "timeBlock"]),
  title: z.string().min(1),
  start: isoDateTime,
  end: isoDateTime,
  allDay: z.boolean().optional(),
  color: z.string().nullable().optional(),
  reminderMinutes: z.number().int().optional(),
  timeZone: z.string().optional(),
  repeat: z.enum(["daily", "weekly", "monthly"]).optional(),
  meetingUrl: z.string().optional(),
  participants: z.array(z.string()).optional(),
  notes: z.string().optional(),
  description: z.string().optional(),
  taskScope: z.array(z.string()).optional(),
  rsvpStatus: z.enum(["yes", "no", "maybe"]).optional(),
  rsvpDeclineReason: z.string().optional(),
});

export const CalendarEventPatchBodySchema =
  CalendarEventCreateBodySchema.partial();

export const CalendarEventApiResponseSchema = z
  .object({
    id: z.string(),
    type: z.enum(["common", "timeBlock"]),
    title: z.string(),
    start: z.string(),
    end: z.string(),
    allDay: z.boolean(),
    color: z.string().nullable().optional(),
    reminderMinutes: z.number().optional(),
    timeZone: z.string().optional(),
    repeat: z.enum(["daily", "weekly", "monthly"]).optional(),
    meetingUrl: z.string().optional(),
    participants: z.array(z.string()).optional(),
    notes: z.string().optional(),
    description: z.string().optional(),
    taskScope: z.array(z.string()).optional(),
    rsvpStatus: z.enum(["yes", "no", "maybe"]).optional(),
    rsvpDeclineReason: z.string().optional(),
  })
  .passthrough();

export const CalendarEventListResponseDto = z.array(
  CalendarEventApiResponseSchema,
);

export type CalendarEventCreateBody = z.infer<
  typeof CalendarEventCreateBodySchema
>;
export type CalendarEventPatchBody = z.infer<
  typeof CalendarEventPatchBodySchema
>;
