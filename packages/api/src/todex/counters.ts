import { z } from "zod";

import { IsoDateTimeSchema } from "./iso.ts";
import { TaskWeekdaySchema, TimeZoneSchema } from "./recurrence.ts";

export const COUNTER_TARGET_MAX = 999;

export const COUNTER_SKIP_REASON_MAX_LENGTH = 500;

export const COUNTER_DAY_INTERVAL_MAX = 99;

/** Monday first, the order a schedule is stored and shown in. */
export const COUNTER_WEEKDAYS = [
  { code: "MO", label: "Mon" },
  { code: "TU", label: "Tue" },
  { code: "WE", label: "Wed" },
  { code: "TH", label: "Thu" },
  { code: "FR", label: "Fri" },
  { code: "SA", label: "Sat" },
  { code: "SU", label: "Sun" },
] as const;

export const CounterScheduleSchema = z.discriminatedUnion("frequency", [
  z
    .object({
      frequency: z.literal("daily"),
      interval: z.number().int().min(1).max(COUNTER_DAY_INTERVAL_MAX),
    })
    .strict(),
  z
    .object({
      frequency: z.literal("weekly"),
      interval: z.number().int().min(1).max(2),
      weekdays: z
        .array(TaskWeekdaySchema)
        .min(1)
        .max(7)
        .refine((days) => new Set(days).size === days.length, {
          message: "Duplicate weekday",
        }),
    })
    .strict(),
  z
    .object({
      frequency: z.literal("monthly"),
      /** Shorter months use their last day. */
      monthDay: z.number().int().min(1).max(31),
    })
    .strict(),
]);

export const CounterStatusSchema = z.enum(["active", "archived"]);

export const CounterDayOutcomeSchema = z.enum(["met", "excused", "failed"]);

const occurrenceStatusSchema = z.enum(["completed", "skipped", "failed"]);

const localDateSchema = z.iso.date();

const nameSchema = z.string().trim().min(1).max(200);

const targetSchema = z.number().int().min(1).max(COUNTER_TARGET_MAX);

const spaceIdSchema = z.string().min(1);

const ruleShape = {
  schedule: CounterScheduleSchema,
  /** Completions wanted on each scheduled day. */
  target: targetSchema,
};

export const CounterOccurrenceSchema = z.object({
  id: z.string(),
  date: localDateSchema,
  status: occurrenceStatusSchema,
  source: z.enum(["manual", "task", "system"]),
  skipReason: z.string().nullable(),
  taskId: z.string().nullable(),
  taskSummary: z.string().nullable(),
  deletable: z.boolean(),
  createdAt: IsoDateTimeSchema,
});

export const CounterDaySchema = z.object({
  date: localDateSchema,
  /** The Counter is scheduled on this day, or the day has history. */
  tracked: z.boolean(),
  loggable: z.boolean(),
  fill: z.enum(["empty", "partial", "filled"]),
  capacity: z.number().int().positive(),
  completed: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  canComplete: z.boolean(),
  occurrences: z.array(CounterOccurrenceSchema),
});

export const CounterSchema = z.object({
  id: z.string(),
  name: z.string(),
  spaceId: z.string().nullable(),
  countsSpaceTasks: z.boolean(),
  /** Counters are listed from the lowest position up. */
  position: z.number(),
  ...ruleShape,
  timeZone: z.string(),
  showInToday: z.boolean(),
  status: CounterStatusSchema,
  today: localDateSchema,
  progress: z.object({
    /** Null when the Counter is not scheduled today or is archived. */
    today: z
      .object({
        completed: z.number().int().nonnegative(),
        target: z.number().int().positive(),
      })
      .nullable(),
    /** The next scheduled day after today; null when archived. */
    nextDate: localDateSchema.nullable(),
  }),
  pendingChange: z
    .object({ ...ruleShape, effectiveDate: localDateSchema })
    .nullable(),
  stats: z.object({
    totalDays: z.number().int().nonnegative(),
    streak: z.number().int().nonnegative(),
  }),
  week: z.array(CounterDaySchema).length(7),
});

export const CounterLinkSchema = z.object({
  id: z.string(),
  kind: z.enum(["task", "series"]),
  taskId: z.string().nullable(),
  seriesId: z.string().nullable(),
  title: z.string(),
  taskKey: z.string().nullable(),
});

export const CounterDetailSchema = CounterSchema.extend({
  links: z.array(CounterLinkSchema),
  history: z.array(CounterOccurrenceSchema),
});

export const CounterDateSchema = localDateSchema;

export const CounterDetailQuerySchema = z.object({
  /** Last day of the seven-day strip; today when omitted. */
  until: localDateSchema.optional(),
});

export const ListCountersQuerySchema = CounterDetailQuerySchema.extend({
  status: CounterStatusSchema.default("active"),
});

export const CreateCounterBodySchema = z
  .object({
    name: nameSchema,
    ...ruleShape,
    timeZone: TimeZoneSchema,
    showInToday: z.boolean().default(true),
    spaceId: spaceIdSchema.nullable().default(null),
    countsSpaceTasks: z.boolean().default(false),
  })
  .strict();

export const UpdateCounterBodySchema = z
  .object({
    name: nameSchema.optional(),
    schedule: CounterScheduleSchema.optional(),
    target: targetSchema.optional(),
    showInToday: z.boolean().optional(),
    spaceId: spaceIdSchema.nullable().optional(),
    countsSpaceTasks: z.boolean().optional(),
    position: z.number().finite().optional(),
  })
  .strict();

export const SetCounterDayBodySchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("completed"), count: targetSchema }).strict(),
  z.object({ status: z.literal("failed") }).strict(),
  z
    .object({
      status: z.literal("skipped"),
      skipReason: z.string().trim().min(1).max(COUNTER_SKIP_REASON_MAX_LENGTH),
    })
    .strict(),
  z.object({ status: z.literal("empty") }).strict(),
]);

export const LinkCounterTaskBodySchema = z
  .object({ taskId: z.string().min(1) })
  .strict();

export function formatCounterSchedule(schedule: CounterSchedule): string {
  if (schedule.frequency === "monthly") {
    return `Monthly on day ${schedule.monthDay}`;
  }
  if (schedule.frequency === "daily") {
    return schedule.interval === 1
      ? "Every day"
      : `Every ${schedule.interval} days`;
  }
  const days = COUNTER_WEEKDAYS.filter((day) =>
    schedule.weekdays.includes(day.code),
  )
    .map((day) => day.label)
    .join(", ");
  if (schedule.interval === 1) return `Every ${days}`;
  return `Every ${schedule.interval} weeks on ${days}`;
}

export function formatCounterRule(rule: CounterRule): string {
  return `${formatCounterSchedule(rule.schedule)} · ${rule.target} per day`;
}

export type CounterSchedule = z.infer<typeof CounterScheduleSchema>;
export type CounterFrequency = CounterSchedule["frequency"];
export type CounterStatus = z.infer<typeof CounterStatusSchema>;
export type CounterDayOutcome = z.infer<typeof CounterDayOutcomeSchema>;
export type CounterOccurrence = z.infer<typeof CounterOccurrenceSchema>;
export type CounterOccurrenceStatus = CounterOccurrence["status"];
export type CounterOccurrenceSource = CounterOccurrence["source"];
export type CounterDay = z.infer<typeof CounterDaySchema>;
export type CounterFill = CounterDay["fill"];
export type Counter = z.infer<typeof CounterSchema>;
export type CounterPendingChange = NonNullable<Counter["pendingChange"]>;
export type CounterLink = z.infer<typeof CounterLinkSchema>;
export type CounterDetail = z.infer<typeof CounterDetailSchema>;
export type ListCountersQuery = z.infer<typeof ListCountersQuerySchema>;
export type CounterDetailQuery = z.infer<typeof CounterDetailQuerySchema>;
export type CreateCounterBody = z.infer<typeof CreateCounterBodySchema>;
export type UpdateCounterBody = z.infer<typeof UpdateCounterBodySchema>;
export type SetCounterDayBody = z.infer<typeof SetCounterDayBodySchema>;
export type LinkCounterTaskBody = z.infer<typeof LinkCounterTaskBodySchema>;

export interface CounterRule {
  schedule: CounterSchedule;
  target: number;
}
