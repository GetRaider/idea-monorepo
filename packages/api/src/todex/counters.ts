import { z } from "zod";

import { IsoDateTimeSchema } from "./iso.ts";
import { TimeZoneSchema } from "./recurrence.ts";

export const COUNTER_TARGET_MAX = 999;

export const COUNTER_SKIP_REASON_MAX_LENGTH = 500;

export const COUNTER_RECURRENCES = [
  { frequency: "daily", interval: 1, label: "Every day" },
  { frequency: "daily", interval: 2, label: "Every 2 days" },
  { frequency: "weekly", interval: 1, label: "Every week" },
  { frequency: "weekly", interval: 2, label: "Every 2 weeks" },
  { frequency: "monthly", interval: 1, label: "Every month" },
] as const;

export const CounterFrequencySchema = z.enum(["daily", "weekly", "monthly"]);

export const CounterStatusSchema = z.enum(["active", "archived"]);

export const CounterPeriodOutcomeSchema = z.enum(["met", "excused", "failed"]);

const occurrenceStatusSchema = z.enum(["completed", "skipped", "failed"]);

const localDateSchema = z.iso.date();

const nameSchema = z.string().trim().min(1).max(200);

const targetSchema = z.number().int().min(1).max(COUNTER_TARGET_MAX);

const intervalSchema = z.number().int().min(1).max(2);

const ruleShape = {
  frequency: CounterFrequencySchema,
  interval: intervalSchema,
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
  fill: z.enum(["empty", "partial", "filled"]),
  completed: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  loggable: z.boolean(),
  occurrences: z.array(CounterOccurrenceSchema),
});

export const CounterSchema = z.object({
  id: z.string(),
  name: z.string(),
  ...ruleShape,
  timeZone: z.string(),
  showInToday: z.boolean(),
  status: CounterStatusSchema,
  today: localDateSchema,
  period: z
    .object({
      start: localDateSchema,
      end: localDateSchema,
      completed: z.number().int().nonnegative(),
      skipped: z.number().int().nonnegative(),
      failed: z.number().int().nonnegative(),
      isOpen: z.boolean(),
    })
    .nullable(),
  pendingChange: z
    .object({ ...ruleShape, effectiveDate: localDateSchema.nullable() })
    .nullable(),
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

export const ListCountersQuerySchema = z.object({
  status: CounterStatusSchema.default("active"),
});

export const CreateCounterBodySchema = z
  .object({
    name: nameSchema,
    ...ruleShape,
    timeZone: TimeZoneSchema,
    showInToday: z.boolean().default(true),
  })
  .strict()
  .refine(isSupportedRecurrence, {
    message: "Unsupported recurrence",
    path: ["interval"],
  });

export const UpdateCounterBodySchema = z
  .object({
    name: nameSchema.optional(),
    frequency: CounterFrequencySchema.optional(),
    interval: intervalSchema.optional(),
    target: targetSchema.optional(),
    showInToday: z.boolean().optional(),
  })
  .strict()
  .refine(
    (body) => (body.frequency === undefined) === (body.interval === undefined),
    { message: "Send frequency and interval together", path: ["interval"] },
  )
  .refine(
    (body) =>
      body.frequency === undefined ||
      body.interval === undefined ||
      isSupportedRecurrence({
        frequency: body.frequency,
        interval: body.interval,
      }),
    { message: "Unsupported recurrence", path: ["interval"] },
  );

export const LogCounterOccurrenceBodySchema = z.discriminatedUnion("status", [
  z
    .object({
      status: z.literal("completed"),
      date: localDateSchema.optional(),
    })
    .strict(),
  z
    .object({
      status: z.literal("skipped"),
      date: localDateSchema.optional(),
      skipReason: z.string().trim().min(1).max(COUNTER_SKIP_REASON_MAX_LENGTH),
    })
    .strict(),
]);

export const LogCounterOccurrenceResultSchema = z.object({
  counter: CounterSchema,
  occurrenceId: z.string(),
});

export const LinkCounterTaskBodySchema = z
  .object({ taskId: z.string().min(1) })
  .strict();

export function formatCounterRule(rule: CounterRule): string {
  const recurrence = COUNTER_RECURRENCES.find((item) =>
    isSameRecurrence(item, rule),
  );
  const times = rule.target === 1 ? "1 time" : `${rule.target} times`;
  return `${recurrence?.label ?? "Custom"} · ${times}`;
}

function isSupportedRecurrence(rule: Omit<CounterRule, "target">): boolean {
  return COUNTER_RECURRENCES.some((item) => isSameRecurrence(item, rule));
}

function isSameRecurrence(
  left: Omit<CounterRule, "target">,
  right: Omit<CounterRule, "target">,
): boolean {
  return left.frequency === right.frequency && left.interval === right.interval;
}

export type CounterFrequency = z.infer<typeof CounterFrequencySchema>;
export type CounterStatus = z.infer<typeof CounterStatusSchema>;
export type CounterPeriodOutcome = z.infer<typeof CounterPeriodOutcomeSchema>;
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
export type CreateCounterBody = z.infer<typeof CreateCounterBodySchema>;
export type UpdateCounterBody = z.infer<typeof UpdateCounterBodySchema>;
export type LogCounterOccurrenceBody = z.infer<
  typeof LogCounterOccurrenceBodySchema
>;
export type LogCounterOccurrenceResult = z.infer<
  typeof LogCounterOccurrenceResultSchema
>;
export type LinkCounterTaskBody = z.infer<typeof LinkCounterTaskBodySchema>;

export interface CounterRule {
  frequency: CounterFrequency;
  interval: number;
  target: number;
}
