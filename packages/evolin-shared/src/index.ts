import { z } from 'zod';

export const ACTIVE_HABIT_RECOMMENDED = 2;
export const ACTIVE_HABIT_MAXIMUM = 3;

export const HABIT_CATEGORIES = [
  'health',
  'mind',
  'work',
  'home',
  'relationships',
  'learning',
  'other',
] as const;

export const HABIT_STATUSES = [
  'backlog',
  'establishing',
  'paused',
  'established',
] as const;

export const PRACTICE_OUTCOMES = ['completed', 'skipped'] as const;

export const habitCategorySchema = z.enum(HABIT_CATEGORIES);
export const habitStatusSchema = z.enum(HABIT_STATUSES);
export const practiceOutcomeSchema = z.enum(PRACTICE_OUTCOMES);
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')
  .refine(isRealIsoDate, 'Expected a real calendar date');
export const timeZoneSchema = z
  .string()
  .min(1)
  .refine(isValidTimeZone, 'Expected a valid IANA timezone');

const titleSchema = z.string().trim().min(1).max(80);
const descriptionSchema = nullableTrimmedString(500);
const whySchema = nullableTrimmedString(500);
const minimumActionSchema = nullableTrimmedString(200);
const triggerSchema = nullableTrimmedString(200);
const weekdaysSchema = z
  .array(z.number().int().min(1).max(7))
  .min(1)
  .max(7)
  .transform((weekdays) => [...new Set(weekdays)].sort())
  .nullable();
const estimatedDurationMinutesSchema = z.number().int().min(1).max(180).nullable();

export const planSchema = z
  .object({
    why: whySchema,
    minimumAction: minimumActionSchema,
    trigger: triggerSchema,
    weekdays: weekdaysSchema,
    estimatedDurationMinutes: estimatedDurationMinutesSchema,
  })
  .strict();

export const requestContextSchema = z
  .object({
    timeZone: timeZoneSchema,
    date: isoDateSchema,
  })
  .strict();

export const createHabitSchema = z
  .object({
    title: titleSchema,
    description: descriptionSchema.optional().default(null),
    category: habitCategorySchema,
    why: whySchema.optional().default(null),
    minimumAction: minimumActionSchema.optional().default(null),
    trigger: triggerSchema.optional().default(null),
    weekdays: weekdaysSchema.optional().default(null),
    estimatedDurationMinutes: estimatedDurationMinutesSchema.optional().default(null),
    startEstablishing: z.boolean().optional().default(false),
    timeZone: timeZoneSchema,
    date: isoDateSchema,
  })
  .strict();

const habitUpdateFieldsSchema = z
  .object({
    title: titleSchema.optional(),
    description: descriptionSchema.optional(),
    category: habitCategorySchema.optional(),
    why: whySchema.optional(),
    minimumAction: minimumActionSchema.optional(),
    trigger: triggerSchema.optional(),
    weekdays: weekdaysSchema.optional(),
    estimatedDurationMinutes: estimatedDurationMinutesSchema.optional(),
  })
  .strict();

export const updateHabitSchema = habitUpdateFieldsSchema
  .extend({
    timeZone: timeZoneSchema,
    date: isoDateSchema,
  })
  .refine(
    (value) =>
      Object.keys(value).some((key) => key !== 'timeZone' && key !== 'date'),
    'At least one habit field is required',
  );

export const transitionHabitSchema = requestContextSchema;

export const putPracticeSchema = z
  .object({
    outcome: practiceOutcomeSchema,
    timeZone: timeZoneSchema,
  })
  .strict();

export const practiceHistoryQuerySchema = z
  .object({
    from: isoDateSchema.optional(),
    to: isoDateSchema.optional(),
    timeZone: timeZoneSchema,
  })
  .strict();

export const habitSchema = z.object({
  id: z.string().uuid(),
  title: titleSchema,
  description: z.string().nullable(),
  category: habitCategorySchema,
  why: z.string().nullable(),
  minimumAction: z.string().nullable(),
  trigger: z.string().nullable(),
  weekdays: z.array(z.number().int().min(1).max(7)).nullable(),
  estimatedDurationMinutes: z.number().int().nullable(),
  status: habitStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  activatedAt: z.string().datetime().nullable(),
  pausedAt: z.string().datetime().nullable(),
  establishedAt: z.string().datetime().nullable(),
  scheduledToday: z.boolean(),
  todayPractice: z
    .object({
      date: isoDateSchema,
      outcome: practiceOutcomeSchema,
    })
    .nullable(),
});

export const capacitySchema = z.object({
  used: z.number().int().nonnegative(),
  recommended: z.literal(ACTIVE_HABIT_RECOMMENDED),
  maximum: z.literal(ACTIVE_HABIT_MAXIMUM),
});

export const practiceSchema = z.object({
  habitId: z.string().uuid(),
  practiceDate: isoDateSchema,
  outcome: practiceOutcomeSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const errorEnvelopeSchema = z.object({
  statusCode: z.number().int(),
  code: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional().default({}),
});

export function isoWeekday(date: string, timeZone: string): number {
  timeZoneSchema.parse(timeZone);
  const parsedDate = isoDateSchema.parse(date);
  const utcWeekday = new Date(`${parsedDate}T00:00:00.000Z`).getUTCDay();

  return utcWeekday === 0 ? 7 : utcWeekday;
}

export function isScheduledWeekday(
  weekdays: readonly number[] | null,
  weekday: number,
): boolean {
  return weekdays?.includes(weekday) ?? false;
}

export function getIncompletePlanFields(plan: PlanFields): PlanFieldName[] {
  const missingFields: PlanFieldName[] = [];

  if (!plan.why?.trim()) missingFields.push('why');
  if (!plan.minimumAction?.trim()) missingFields.push('minimumAction');
  if (!plan.trigger?.trim()) missingFields.push('trigger');
  if (!plan.weekdays?.length) missingFields.push('weekdays');
  if (plan.estimatedDurationMinutes == null) {
    missingFields.push('estimatedDurationMinutes');
  }

  return missingFields;
}

export function assertCompletePlan(
  plan: PlanFields,
): asserts plan is CompletePlan {
  const missingFields = getIncompletePlanFields(plan);

  if (missingFields.length > 0) {
    throw new IncompletePlanError(missingFields);
  }
}

export function isPlanComplete(plan: PlanFields): plan is CompletePlan {
  return getIncompletePlanFields(plan).length === 0;
}

export function localDateInTimeZone(
  date: Date,
  timeZone: string,
): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}

export class IncompletePlanError extends Error {
  constructor(readonly fields: PlanFieldName[]) {
    super('The habit needs a complete plan before it can be established.');
    this.name = 'IncompletePlanError';
  }
}

function nullableTrimmedString(maximumLength: number) {
  return z.preprocess((value) => {
    if (typeof value !== 'string') return value;
    const trimmedValue = value.trim();
    return trimmedValue.length === 0 ? null : trimmedValue;
  }, z.string().min(1).max(maximumLength).nullable());
}

function isRealIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  return (
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() === month - 1 &&
    parsedDate.getUTCDate() === day
  );
}

function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export type HabitCategory = z.infer<typeof habitCategorySchema>;
export type HabitStatus = z.infer<typeof habitStatusSchema>;
export type PracticeOutcome = z.infer<typeof practiceOutcomeSchema>;
export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;
export type TransitionHabitInput = z.infer<typeof transitionHabitSchema>;
export type PutPracticeInput = z.infer<typeof putPracticeSchema>;
export type PracticeHistoryQuery = z.infer<typeof practiceHistoryQuerySchema>;
export type Habit = z.infer<typeof habitSchema>;
export type Capacity = z.infer<typeof capacitySchema>;
export type Practice = z.infer<typeof practiceSchema>;
export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;
export type PlanFieldName =
  | 'why'
  | 'minimumAction'
  | 'trigger'
  | 'weekdays'
  | 'estimatedDurationMinutes';
export type PlanFields = {
  why: string | null;
  minimumAction: string | null;
  trigger: string | null;
  weekdays: number[] | null;
  estimatedDurationMinutes: number | null;
};
export type CompletePlan = {
  why: string;
  minimumAction: string;
  trigger: string;
  weekdays: number[];
  estimatedDurationMinutes: number;
};
export type HabitListResponse = {
  capacity: Capacity;
  habits: Habit[];
};
export type HabitMutationResponse = {
  habit: Habit;
  capacity: Capacity;
};
export type RecentPracticeDay = {
  date: string;
  weekday: number;
  inSchedule: boolean;
  duringEstablishing: boolean;
  outcome: PracticeOutcome | null;
};
export type HabitProgress = {
  completedCount: number;
  skippedCount: number;
  establishingDayCount: number;
  recent: RecentPracticeDay[];
};
export type HabitDetailResponse = {
  habit: Habit;
  capacity: Capacity;
  progress: HabitProgress;
};
