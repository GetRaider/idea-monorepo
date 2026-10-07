import { z } from "zod";

import { TaskStatus } from "./enums.ts";

export const TASK_WEEKDAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"] as const;

export const TaskWeekdaySchema = z.enum(TASK_WEEKDAYS);

export const TaskRecurrenceSchema = z
  .object({
    frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
    interval: z.number().int().min(1).max(99),
    weekdays: z.array(TaskWeekdaySchema).min(1).max(7).optional(),
    timeZone: z
      .string()
      .min(1)
      .max(100)
      .refine(isTimeZone, { message: "Expected an IANA time zone" }),
    end: z.discriminatedUnion("type", [
      z.object({ type: z.literal("never") }),
      z.object({
        type: z.literal("count"),
        count: z.number().int().min(1).max(999),
      }),
      z.object({
        type: z.literal("until"),
        until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }),
    ]),
  })
  .superRefine((rule, context) => {
    if (rule.frequency !== "weekly" && rule.weekdays) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Weekdays are only valid for weekly recurrence",
        path: ["weekdays"],
      });
    }
    if (!rule.weekdays) return;
    const seen = new Set<string>();
    for (const [index, weekday] of rule.weekdays.entries()) {
      if (seen.has(weekday)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Duplicate weekday",
          path: ["weekdays", index],
        });
      }
      seen.add(weekday);
    }
  });

export function readTaskRecurrence(value: unknown): TaskRecurrence | null {
  const parsed = TaskRecurrenceSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function defaultTaskRecurrence(input: {
  scheduleDate: string | null;
  dueDate: string | null;
  timeZone: string;
  now?: Date;
}): TaskRecurrence {
  const anchorIso = input.scheduleDate ?? input.dueDate;
  const anchor = anchorIso ? new Date(anchorIso) : (input.now ?? new Date());
  const weekday = zonedParts(anchor, input.timeZone).weekday;
  return {
    frequency: "weekly",
    interval: 1,
    weekdays: [weekdayCode(weekday)],
    timeZone: input.timeZone,
    end: { type: "never" },
  };
}

export function formatTaskRecurrence(rule: TaskRecurrence): string {
  const cadence =
    rule.interval === 1
      ? FREQUENCY_LABEL[rule.frequency]
      : `Every ${rule.interval} ${FREQUENCY_UNIT[rule.frequency]}s`;
  const days =
    rule.frequency === "weekly" && rule.weekdays?.length
      ? ` on ${rule.weekdays.map((weekday) => WEEKDAY_LABEL[weekday]).join(", ")}`
      : "";
  if (rule.end.type === "count") {
    const remaining =
      rule.end.count === 1 ? "1 time left" : `${rule.end.count} times left`;
    return `${cadence}${days}, ${remaining}`;
  }
  if (rule.end.type === "until") {
    return `${cadence}${days}, until ${rule.end.until}`;
  }
  return `${cadence}${days}`;
}

export function completeRecurringTask<T extends RecurrenceCriterion>(
  task: RecurringTaskSnapshot<T>,
): RecurrenceCompletion<T> {
  const rule = task.recurrence;
  if (!rule) return { type: "complete" };
  const anchorIso = task.scheduleDate ?? task.dueDate;
  if (!anchorIso) return { type: "complete" };
  if (rule.end.type === "count" && rule.end.count <= 1) {
    return { type: "finish-series" };
  }

  const anchor = new Date(anchorIso);
  const nextAnchor = nextOccurrence(anchor, rule);
  if (!nextAnchor) return { type: "complete" };
  if (
    rule.end.type === "until" &&
    dateKey(nextAnchor, rule.timeZone) > rule.end.until
  ) {
    return { type: "finish-series" };
  }

  const dayDelta = calendarDayDelta(anchor, nextAnchor, rule.timeZone);
  return {
    type: "advance",
    scheduleDate: shiftDate(task.scheduleDate, anchorIso, nextAnchor, dayDelta, rule.timeZone),
    dueDate: shiftDate(task.dueDate, anchorIso, nextAnchor, dayDelta, rule.timeZone),
    recurrence:
      rule.end.type === "count"
        ? { ...rule, end: { type: "count", count: rule.end.count - 1 } }
        : rule,
    acceptanceCriteria: task.acceptanceCriteria.map((criterion) => ({
      ...criterion,
      done: false,
    })),
  };
}

/** Occurrence starts inside `[rangeStart, rangeEnd)`, counting from the series start. */
export function expandRecurrenceStarts(input: {
  start: Date;
  rule: TaskRecurrence;
  rangeStart: Date;
  rangeEnd: Date;
  limit?: number;
}): Date[] {
  const limit = input.limit ?? 500;
  const countLimit =
    input.rule.end.type === "count"
      ? input.rule.end.count
      : Number.POSITIVE_INFINITY;
  const starts: Date[] = [];
  let cursor: Date | null = input.start;
  let emitted = 0;
  let guard = 0;
  while (cursor && emitted < countLimit && guard < 8000) {
    guard += 1;
    if (
      input.rule.end.type === "until" &&
      dateKey(cursor, input.rule.timeZone) > input.rule.end.until
    ) {
      break;
    }
    if (cursor.getTime() >= input.rangeEnd.getTime()) break;
    if (cursor.getTime() >= input.rangeStart.getTime()) {
      starts.push(cursor);
      if (starts.length >= limit) break;
    }
    emitted += 1;
    const next = nextOccurrence(cursor, input.rule);
    if (!next || next.getTime() <= cursor.getTime()) break;
    cursor = next;
  }
  return starts;
}

function nextOccurrence(anchor: Date, rule: TaskRecurrence): Date | null {
  if (rule.frequency === "daily") {
    return addCalendarDays(anchor, rule.interval, rule.timeZone);
  }
  if (rule.frequency === "monthly") {
    return addCalendarMonths(anchor, rule.interval, rule.timeZone);
  }
  if (rule.frequency === "yearly") {
    return addCalendarMonths(anchor, rule.interval * 12, rule.timeZone);
  }
  return nextWeekly(anchor, rule);
}

function nextWeekly(anchor: Date, rule: TaskRecurrence): Date | null {
  const anchorParts = zonedParts(anchor, rule.timeZone);
  const allowed = new Set(
    (rule.weekdays?.length ? rule.weekdays : [weekdayCode(anchorParts.weekday)]).map(
      (weekday) => WEEKDAY_INDEX[weekday],
    ),
  );
  const anchorWeek = sundayWeekIndex(
    anchorParts.year,
    anchorParts.month,
    anchorParts.day,
  );
  const limit = rule.interval * 7 + 7;
  for (let offset = 1; offset <= limit; offset += 1) {
    const candidate = addCalendarDays(anchor, offset, rule.timeZone);
    const parts = zonedParts(candidate, rule.timeZone);
    if (!allowed.has(parts.weekday)) continue;
    const week = sundayWeekIndex(parts.year, parts.month, parts.day);
    if ((week - anchorWeek) % rule.interval !== 0) continue;
    return candidate;
  }
  return null;
}

function shiftDate(
  iso: string | null,
  anchorIso: string,
  nextAnchor: Date,
  dayDelta: number,
  timeZone: string,
): string | null {
  if (!iso) return null;
  if (iso === anchorIso) return nextAnchor.toISOString();
  return addCalendarDays(new Date(iso), dayDelta, timeZone).toISOString();
}

function dateKey(instant: Date, timeZone: string): string {
  const parts = zonedParts(instant, timeZone);
  const month = String(parts.month).padStart(2, "0");
  const day = String(parts.day).padStart(2, "0");
  return `${parts.year}-${month}-${day}`;
}

function calendarDayDelta(from: Date, to: Date, timeZone: string): number {
  const start = zonedParts(from, timeZone);
  const end = zonedParts(to, timeZone);
  const startUtc = Date.UTC(start.year, start.month - 1, start.day);
  const endUtc = Date.UTC(end.year, end.month - 1, end.day);
  return Math.round((endUtc - startUtc) / 86_400_000);
}

function addCalendarDays(instant: Date, days: number, timeZone: string): Date {
  const parts = zonedParts(instant, timeZone);
  const shifted = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return zonedWallTimeToUtc(
    {
      year: shifted.getUTCFullYear(),
      month: shifted.getUTCMonth() + 1,
      day: shifted.getUTCDate(),
      hour: parts.hour,
      minute: parts.minute,
      second: parts.second,
    },
    timeZone,
  );
}

function addCalendarMonths(instant: Date, months: number, timeZone: string): Date {
  const parts = zonedParts(instant, timeZone);
  const monthIndex = parts.month - 1 + months;
  const year = parts.year + Math.floor(monthIndex / 12);
  const month = ((monthIndex % 12) + 12) % 12;
  const day = Math.min(parts.day, daysInMonth(year, month + 1));
  return zonedWallTimeToUtc(
    {
      year,
      month: month + 1,
      day,
      hour: parts.hour,
      minute: parts.minute,
      second: parts.second,
    },
    timeZone,
  );
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function sundayWeekIndex(year: number, month: number, day: number): number {
  const dayNumber = Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return Math.floor((dayNumber - weekday) / 7);
}

function zonedParts(instant: Date, timeZone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const year = Number(read("year"));
  const month = Number(read("month"));
  const day = Number(read("day"));
  let hour = Number(read("hour"));
  if (hour === 24) hour = 0;
  return {
    year,
    month,
    day,
    hour,
    minute: Number(read("minute")),
    second: Number(read("second")),
    weekday: new Date(Date.UTC(year, month - 1, day)).getUTCDay(),
  };
}

function zonedWallTimeToUtc(wall: WallTime, timeZone: string): Date {
  let utc = Date.UTC(
    wall.year,
    wall.month - 1,
    wall.day,
    wall.hour,
    wall.minute,
    wall.second,
  );
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const offset = timeZoneOffsetMs(new Date(utc), timeZone);
    const next =
      Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second) -
      offset;
    if (next === utc) break;
    utc = next;
  }
  return new Date(utc);
}

function timeZoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = zonedParts(instant, timeZone);
  const wallAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return wallAsUtc - instant.getTime();
}

function weekdayCode(index: number): TaskWeekday {
  return TASK_WEEKDAYS[index] ?? "MO";
}

function isTimeZone(value: string): boolean {
  try {
    Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

const WEEKDAY_INDEX: Record<TaskWeekday, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
};

const WEEKDAY_LABEL: Record<TaskWeekday, string> = {
  SU: "Sun",
  MO: "Mon",
  TU: "Tue",
  WE: "Wed",
  TH: "Thu",
  FR: "Fri",
  SA: "Sat",
};

const FREQUENCY_LABEL: Record<TaskRecurrence["frequency"], string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

const FREQUENCY_UNIT: Record<TaskRecurrence["frequency"], string> = {
  daily: "day",
  weekly: "week",
  monthly: "month",
  yearly: "year",
};

export type TaskWeekday = z.infer<typeof TaskWeekdaySchema>;
export type TaskRecurrence = z.infer<typeof TaskRecurrenceSchema>;

interface RecurrenceCriterion {
  id: string;
  text: string;
  done: boolean;
}

interface RecurringTaskSnapshot<T extends RecurrenceCriterion> {
  status: (typeof TaskStatus)[keyof typeof TaskStatus];
  scheduleDate: string | null;
  dueDate: string | null;
  recurrence: TaskRecurrence | null;
  acceptanceCriteria: T[];
}

type RecurrenceCompletion<T extends RecurrenceCriterion> =
  | { type: "complete" }
  | { type: "finish-series" }
  | {
      type: "advance";
      scheduleDate: string | null;
      dueDate: string | null;
      recurrence: TaskRecurrence;
      acceptanceCriteria: T[];
    };

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number;
}

interface WallTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}
