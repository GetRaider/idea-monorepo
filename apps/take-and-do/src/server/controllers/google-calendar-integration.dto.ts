import { z } from "zod";

export const GoogleRecurrenceMetaDto = z.object({
  recurringEventId: z.string(),
  originalStart: z.string().optional(),
  originalAllDay: z.boolean().optional(),
});

const CalendarRepeatRuleDto = z.enum(["daily", "weekly", "monthly"]);

export const ImportedGoogleCalendarEventSchema = z.object({
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
  repeat: CalendarRepeatRuleDto.optional(),
  googleRecurrence: GoogleRecurrenceMetaDto.optional(),
  /** Local UI override; ignored by Google push until mapped to colorId. */
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
});

export const ToggleBodyDto = z.object({ enabled: z.boolean() });

export const StatusResponseDto = z.object({
  connected: z.boolean(),
  googleLinked: z.boolean(),
  email: z.string().nullable(),
  enabled: z.boolean(),
  lastSyncAt: z.string().nullable(),
});

export const SyncResponseDto = z.object({
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

export const PushEventBodyDto = z
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
    repeat: CalendarRepeatRuleDto.optional(),
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

export const PushResponseDto = z.object({ ok: z.literal(true) });

export const DeleteEventBodyDto = z
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

export const CreateEventBodyDto = z.object({
  type: z.literal("common"),
  title: z.string(),
  start: z.string(),
  end: z.string(),
  allDay: z.boolean(),
  timeZone: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  repeat: CalendarRepeatRuleDto.optional(),
});

export const CreateEventResponseDto = z.object({
  event: ImportedGoogleCalendarEventSchema,
});
