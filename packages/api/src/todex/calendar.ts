import { z } from "zod";

import { IsoDateTimeSchema } from "./iso.ts";
import { TaskRecurrenceSchema } from "./recurrence.ts";

export const CalendarRsvpStatusSchema = z.enum(["yes", "no", "maybe"]);

export const CalendarEventScopeSchema = z.enum(["instance", "series"]);

const CalendarColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/)
  .nullable();

export const CalendarEventSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  seriesEventId: z.string().nullable(),
  title: z.string(),
  start: IsoDateTimeSchema,
  end: IsoDateTimeSchema,
  allDay: z.boolean(),
  color: z.string().nullable(),
  timeZone: z.string(),
  recurrence: TaskRecurrenceSchema.nullable(),
  rawRrule: z.string().nullable(),
  description: z.string(),
  taskScope: z.array(z.string()),
  participants: z.array(z.string()),
  rsvpStatus: CalendarRsvpStatusSchema.nullable(),
  googleEventId: z.string().nullable(),
  googleEtag: z.string().nullable(),
  organizerSelf: z.boolean(),
  originalStart: IsoDateTimeSchema.nullable(),
  cancelled: z.boolean(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});

export const ListCalendarEventsQuerySchema = z
  .object({
    from: IsoDateTimeSchema,
    to: IsoDateTimeSchema,
  })
  .refine((value) => Date.parse(value.from) < Date.parse(value.to), {
    message: "to must be after from",
  });

const eventFields = {
  title: z.string().trim().min(1).max(500),
  start: IsoDateTimeSchema,
  end: IsoDateTimeSchema,
  allDay: z.boolean().optional(),
  color: CalendarColorSchema.optional(),
  timeZone: z.string().trim().min(1).max(100),
  recurrence: TaskRecurrenceSchema.nullable().optional(),
  description: z.string().max(20_000).optional(),
  taskScope: z.array(z.string().trim().min(1)).max(50).optional(),
  participants: z.array(z.string().trim().email()).max(50).optional(),
  rsvpStatus: CalendarRsvpStatusSchema.nullable().optional(),
};

export const CreateCalendarEventBodySchema = z
  .object(eventFields)
  .refine((value) => Date.parse(value.start) < Date.parse(value.end), {
    message: "end must be after start",
  });

export const UpdateCalendarEventBodySchema = z
  .object({
    ...eventFields,
    title: eventFields.title.optional(),
    start: eventFields.start.optional(),
    end: eventFields.end.optional(),
    timeZone: eventFields.timeZone.optional(),
    scope: CalendarEventScopeSchema.optional(),
    originalStart: IsoDateTimeSchema.optional(),
  })
  .refine(
    (value) =>
      value.start == null ||
      value.end == null ||
      Date.parse(value.start) < Date.parse(value.end),
    { message: "end must be after start" },
  );

export const DeleteCalendarEventQuerySchema = z.object({
  scope: CalendarEventScopeSchema.optional(),
  originalStart: IsoDateTimeSchema.optional(),
});

export const CalendarEventTemplateSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  title: z.string(),
  durationMinutes: z.number().int().positive(),
  color: CalendarColorSchema,
  description: z.string(),
  taskScope: z.array(z.string()),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});

export const CreateCalendarEventTemplateBodySchema = z.object({
  title: z.string().trim().min(1).max(500),
  durationMinutes: z.number().int().min(5).max(24 * 60),
  color: CalendarColorSchema.optional(),
  description: z.string().max(20_000).optional(),
  taskScope: z.array(z.string().trim().min(1)).max(50).optional(),
});

export const UpdateCalendarEventTemplateBodySchema =
  CreateCalendarEventTemplateBodySchema.partial();

export const GoogleCalendarIntegrationSchema = z.object({
  connected: z.boolean(),
  enabled: z.boolean(),
  calendarId: z.string(),
  lastSyncAt: IsoDateTimeSchema.nullable(),
  lastError: z.string().nullable(),
  needsConsent: z.boolean(),
});

export type CalendarRsvpStatus = z.infer<typeof CalendarRsvpStatusSchema>;
export type CalendarEventScope = z.infer<typeof CalendarEventScopeSchema>;
export type CalendarEvent = z.infer<typeof CalendarEventSchema>;
export type ListCalendarEventsQuery = z.infer<
  typeof ListCalendarEventsQuerySchema
>;
export type CreateCalendarEventBody = z.infer<
  typeof CreateCalendarEventBodySchema
>;
export type UpdateCalendarEventBody = z.infer<
  typeof UpdateCalendarEventBodySchema
>;
export type DeleteCalendarEventQuery = z.infer<
  typeof DeleteCalendarEventQuerySchema
>;
export type CalendarEventTemplate = z.infer<typeof CalendarEventTemplateSchema>;
export type CreateCalendarEventTemplateBody = z.infer<
  typeof CreateCalendarEventTemplateBodySchema
>;
export type UpdateCalendarEventTemplateBody = z.infer<
  typeof UpdateCalendarEventTemplateBodySchema
>;
export type GoogleCalendarIntegration = z.infer<
  typeof GoogleCalendarIntegrationSchema
>;
