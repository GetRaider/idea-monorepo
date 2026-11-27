import {
  addDaysToDate,
  formatOccurrenceLocalKey,
  TASK_WEEKDAYS,
} from "@repo/api/todex";
import type { CounterSchedule } from "@repo/api/todex";

const DAY_MS = 86_400_000;

/** Longer than the widest gap any schedule can have. */
const SEARCH_DAYS = 100;

/** The calendar date of an instant in the Counter's time zone. */
export function localDate(now: Date, timeZone: string): string {
  return formatOccurrenceLocalKey(now, timeZone).slice(0, 10);
}

/**
 * Whether the schedule falls on a date. The anchor fixes which days or weeks an
 * interval lands on, in both directions.
 */
export function isScheduled(
  schedule: CounterSchedule,
  anchor: string,
  date: string,
): boolean {
  if (schedule.frequency === "monthly") {
    const day = Number(date.slice(8));
    return day === Math.min(schedule.monthDay, daysInMonth(date));
  }
  if (schedule.frequency === "daily") {
    return daysBetween(anchor, date) % schedule.interval === 0;
  }
  const weeks = daysBetween(mondayOf(anchor), mondayOf(date)) / 7;
  const weekday = TASK_WEEKDAYS[weekdayIndex(date)];
  return (
    weeks % schedule.interval === 0 &&
    schedule.weekdays.some((scheduled) => scheduled === weekday)
  );
}

export function nextScheduledDate(
  schedule: CounterSchedule,
  anchor: string,
  after: string,
): string | null {
  for (let offset = 1; offset <= SEARCH_DAYS; offset += 1) {
    const date = addDaysToDate(after, offset);
    if (isScheduled(schedule, anchor, date)) return date;
  }
  return null;
}

export function isSameSchedule(
  left: CounterSchedule,
  right: CounterSchedule,
): boolean {
  return scheduleKey(left) === scheduleKey(right);
}

function scheduleKey(schedule: CounterSchedule): string {
  if (schedule.frequency === "monthly") return `monthly:${schedule.monthDay}`;
  if (schedule.frequency === "daily") return `daily:${schedule.interval}`;
  const weekdays = [...schedule.weekdays].sort().join(",");
  return `weekly:${schedule.interval}:${weekdays}`;
}

function mondayOf(date: string): string {
  return addDaysToDate(date, -((weekdayIndex(date) + 6) % 7));
}

/** Sunday is 0, the order of `TASK_WEEKDAYS`. */
function weekdayIndex(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

function daysInMonth(date: string): number {
  const [year, month] = date.split("-").map(Number);
  return new Date(Date.UTC(year ?? 0, month ?? 1, 0)).getUTCDate();
}

function daysBetween(start: string, end: string): number {
  const elapsed =
    Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`);
  return Math.round(elapsed / DAY_MS);
}
