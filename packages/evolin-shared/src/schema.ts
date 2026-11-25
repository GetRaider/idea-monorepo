import { z } from "zod";

export const DEFAULT_SLOT_LIMIT = 2;
export const MAX_CHECKPOINTS_PER_DAY = 12;

export const LIFE_AREA_IDS = [
  "health",
  "fitness",
  "mind",
  "work",
  "home",
  "relationships",
  "learning",
  "other",
] as const;

export const LIFE_AREA_NAMES: Record<(typeof LIFE_AREA_IDS)[number], string> = {
  health: "Health",
  fitness: "Fitness",
  mind: "Mind",
  work: "Work",
  home: "Home",
  relationships: "Relationships",
  learning: "Learning",
  other: "Other",
};

export const LIFE_AREAS = LIFE_AREA_IDS.map((id) => ({
  id,
  name: LIFE_AREA_NAMES[id],
  slotLimit: DEFAULT_SLOT_LIMIT,
}));

export const HABIT_STATUSES = [
  "backlog",
  "establishing",
  "established",
] as const;

export const CHECK_IN_STATUSES = ["completed", "failed", "skipped"] as const;

export const SKIP_REASONS = [
  "sick",
  "travel",
  "day_off",
  "too_busy",
  "other",
] as const;

export const habitStatusSchema = z.enum(HABIT_STATUSES);
export const checkInStatusSchema = z.enum(CHECK_IN_STATUSES);
export const skipReasonSchema = z.enum(SKIP_REASONS);
export const lifeAreaIdSchema = z.enum(LIFE_AREA_IDS);
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")
  .refine(isRealIsoDate, "Expected a real calendar date");
export const timeZoneSchema = z
  .string()
  .min(1)
  .refine(isValidTimeZone, "Expected a valid IANA timezone");

const nameSchema = z.string().trim().min(1).max(80);
const whySchema = z.string().trim().min(1).max(500);
const triggerSchema = z.string().trim().min(1).max(200);
const acceptanceCriteriaSchema = z.string().trim().min(1).max(500);
const checkpointsPerDaySchema = z
  .number()
  .int()
  .min(1)
  .max(MAX_CHECKPOINTS_PER_DAY);
const checkpointLabelSchema = z.string().trim().min(1).max(40);
const weekdaysSchema = z
  .array(z.number().int().min(1).max(7))
  .min(1)
  .max(7)
  .transform((weekdays) => [...new Set(weekdays)].sort());
const noteSchema = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmedValue = value.trim();
  return trimmedValue.length === 0 ? null : trimmedValue;
}, z.string().min(1).max(500).nullable());

const habitFieldsSchema = z
  .object({
    lifeAreaId: lifeAreaIdSchema,
    name: nameSchema,
    why: whySchema,
    trigger: triggerSchema,
    acceptanceCriteria: acceptanceCriteriaSchema,
    checkpointsPerDay: checkpointsPerDaySchema,
    checkpointLabels: z.array(checkpointLabelSchema).nullable(),
    weekdays: weekdaysSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.checkpointLabels &&
      value.checkpointLabels.length !== value.checkpointsPerDay
    ) {
      context.addIssue({
        code: "custom",
        path: ["checkpointLabels"],
        message: "Provide one label per checkpoint, or none.",
      });
    }
  });

export const requestContextSchema = z
  .object({
    timeZone: timeZoneSchema,
    date: isoDateSchema,
  })
  .strict();

export const createHabitSchema = habitFieldsSchema;

export const updateHabitSchema = z
  .object({
    lifeAreaId: lifeAreaIdSchema.optional(),
    name: nameSchema.optional(),
    why: whySchema.optional(),
    trigger: triggerSchema.optional(),
    acceptanceCriteria: acceptanceCriteriaSchema.optional(),
    checkpointsPerDay: checkpointsPerDaySchema.optional(),
    checkpointLabels: z.array(checkpointLabelSchema).nullable().optional(),
    weekdays: weekdaysSchema.optional(),
    timeZone: timeZoneSchema,
    date: isoDateSchema,
  })
  .strict()
  .refine(
    (value) =>
      Object.keys(value).some((key) => key !== "timeZone" && key !== "date"),
    "At least one habit field is required",
  );

export const startEstablishingSchema = requestContextSchema;

export const putCheckInSchema = z
  .object({
    status: checkInStatusSchema,
    skipReason: skipReasonSchema.nullable().optional().default(null),
    note: noteSchema.optional().default(null),
    timeZone: timeZoneSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (value.status === "skipped" && !value.skipReason) {
      context.addIssue({
        code: "custom",
        path: ["skipReason"],
        message: "Choose a reason to save a skip.",
      });
    }
    if (value.status !== "skipped" && value.skipReason) {
      context.addIssue({
        code: "custom",
        path: ["skipReason"],
        message: "A skip reason is only stored when the checkpoint is skipped.",
      });
    }
  });

export const lifeAreaSchema = z.object({
  id: lifeAreaIdSchema,
  name: z.string(),
  slotLimit: z.number().int().positive(),
  slotsUsed: z.number().int().nonnegative(),
});

export const todayCheckpointSchema = z.object({
  index: z.number().int().nonnegative(),
  label: z.string().nullable(),
  status: z.enum(["open", ...CHECK_IN_STATUSES]),
  skipReason: skipReasonSchema.nullable(),
  note: z.string().nullable(),
});

export const windowCountsSchema = z.object({
  completed: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
});

export const habitSchema = z.object({
  id: z.string().uuid(),
  lifeAreaId: lifeAreaIdSchema,
  name: nameSchema,
  why: z.string(),
  trigger: z.string(),
  acceptanceCriteria: z.string(),
  checkpointsPerDay: checkpointsPerDaySchema,
  checkpointLabels: z.array(z.string()).nullable(),
  weekdays: z.array(z.number().int().min(1).max(7)),
  status: habitStatusSchema,
  establishingStartedAt: z.string().datetime().nullable(),
  establishedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  scheduledToday: z.boolean(),
  establishingDay: z.number().int().positive().nullable(),
  completionRate: z.number().min(0).max(1).nullable(),
  windowCounts: windowCountsSchema,
  streak: z.number().int().nonnegative(),
  todayCheckpoints: z.array(todayCheckpointSchema),
});

export const checkInSchema = z.object({
  id: z.string(),
  habitId: z.string().uuid(),
  date: isoDateSchema,
  checkpointIndex: z.number().int().nonnegative(),
  status: checkInStatusSchema,
  skipReason: skipReasonSchema.nullable(),
  note: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const errorEnvelopeSchema = z.object({
  statusCode: z.number().int(),
  code: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional().default({}),
});

export const WEEK_CELL_STATES = [
  "off",
  "open",
  "completed",
  "failed",
  "skipped",
  "partial",
] as const;

export const weekCellStateSchema = z.enum(WEEK_CELL_STATES);

export const weekHabitSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  lifeAreaId: lifeAreaIdSchema,
  status: habitStatusSchema,
  streak: z.number().int().nonnegative(),
  checkpointsPerDay: checkpointsPerDaySchema,
  days: z.array(
    z.object({
      date: isoDateSchema,
      state: weekCellStateSchema,
    }),
  ),
});

export const weekResponseSchema = z.object({
  anchorDate: isoDateSchema,
  days: z.array(z.object({ date: isoDateSchema })),
  habits: z.array(weekHabitSchema),
});

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
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export type LifeAreaId = z.infer<typeof lifeAreaIdSchema>;
export type HabitStatus = z.infer<typeof habitStatusSchema>;
export type CheckInStatus = z.infer<typeof checkInStatusSchema>;
export type SkipReason = z.infer<typeof skipReasonSchema>;
export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;
export type RequestContext = z.infer<typeof requestContextSchema>;
export type PutCheckInInput = z.infer<typeof putCheckInSchema>;
export type LifeArea = z.infer<typeof lifeAreaSchema>;
export type TodayCheckpoint = z.infer<typeof todayCheckpointSchema>;
export type Habit = z.infer<typeof habitSchema>;
export type CheckIn = z.infer<typeof checkInSchema>;
export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;
export type HabitListResponse = {
  lifeAreas: LifeArea[];
  habits: Habit[];
};
export type HabitMutationResponse = {
  habit: Habit;
  lifeAreas: LifeArea[];
};
export type HabitDetailResponse = {
  habit: Habit;
  lifeArea: LifeArea;
  checkIns: CheckIn[];
};
export type WeekCellState = z.infer<typeof weekCellStateSchema>;
export type WeekHabit = z.infer<typeof weekHabitSchema>;
export type WeekResponse = z.infer<typeof weekResponseSchema>;
