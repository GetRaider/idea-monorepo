import {
  isoDateSchema,
  timeZoneSchema,
  type CheckInStatus,
  type WeekCellState,
} from "./schema";

export const ESTABLISHMENT_WINDOW_DAYS = 30;
export const ESTABLISHMENT_COMPLETION_THRESHOLD = 0.9;
/**
 * Q2 is unanswered. The provisional rule has no minimum completions and no
 * cap on skipped checkpoints, so a single completion can reach 100%.
 */
export const ESTABLISHMENT_MINIMUM_COMPLETED = 0;

export function addDays(isoDate: string, dayCount: number): string {
  const parsedDate = new Date(`${isoDateSchema.parse(isoDate)}T00:00:00.000Z`);
  parsedDate.setUTCDate(parsedDate.getUTCDate() + dayCount);
  return parsedDate.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  const start = Date.parse(`${isoDateSchema.parse(from)}T00:00:00.000Z`);
  const end = Date.parse(`${isoDateSchema.parse(to)}T00:00:00.000Z`);
  return Math.round((end - start) / 86_400_000);
}

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

export function localDateInTimeZone(date: Date, timeZone: string): string {
  timeZoneSchema.parse(timeZone);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

export function completionRate(
  checkIns: readonly { status: CheckInStatus }[],
): number | null {
  const counts = countCheckInStatuses(checkIns);
  const denominator = counts.completed + counts.failed;
  if (denominator === 0) return null;
  return counts.completed / denominator;
}

export function summarizeEstablishment(input: {
  establishingStartedOn: string;
  asOfDate: string;
  checkIns: readonly DatedCheckIn[];
}): EstablishmentSummary {
  const establishingDay =
    daysBetween(input.establishingStartedOn, input.asOfDate) + 1;
  const windowCheckIns = checkInsInEstablishmentWindow(input);
  const counts = countCheckInStatuses(windowCheckIns);
  const rate = completionRate(windowCheckIns);
  const established =
    establishingDay >= ESTABLISHMENT_WINDOW_DAYS &&
    counts.completed >= ESTABLISHMENT_MINIMUM_COMPLETED &&
    rate !== null &&
    rate + Number.EPSILON >= ESTABLISHMENT_COMPLETION_THRESHOLD;

  return {
    establishingDay,
    completionRate: rate,
    counts,
    established,
  };
}

export function weekCellState(input: {
  scheduled: boolean;
  checkpointsPerDay: number;
  checkIns: readonly { status: CheckInStatus }[];
}): WeekCellState {
  if (!input.scheduled) return "off";

  const completed = input.checkIns.filter(
    (checkIn) => checkIn.status === "completed",
  ).length;
  const failed = input.checkIns.filter(
    (checkIn) => checkIn.status === "failed",
  ).length;
  const skipped = input.checkIns.filter(
    (checkIn) => checkIn.status === "skipped",
  ).length;

  if (failed > 0) return "failed";
  if (completed >= input.checkpointsPerDay) return "completed";
  if (completed > 0) return "partial";
  if (skipped > 0) return "skipped";
  return "open";
}

export function currentStreak(input: {
  today: string;
  weekdays: readonly number[];
  timeZone: string;
  checkpointsPerDay: number;
  checkIns: readonly DatedCheckIn[];
  activeFrom: string;
}): number {
  const checkInsByDate = new Map<string, Map<number, CheckInStatus>>();
  for (const checkIn of input.checkIns) {
    const dayCheckIns =
      checkInsByDate.get(checkIn.date) ?? new Map<number, CheckInStatus>();
    dayCheckIns.set(checkIn.checkpointIndex, checkIn.status);
    checkInsByDate.set(checkIn.date, dayCheckIns);
  }

  let streak = 0;
  let cursor = input.today;
  for (let step = 0; step < 400 && cursor >= input.activeFrom; step += 1) {
    if (
      isScheduledWeekday(input.weekdays, isoWeekday(cursor, input.timeZone))
    ) {
      const dayCheckIns = checkInsByDate.get(cursor);
      const statuses = Array.from(
        { length: input.checkpointsPerDay },
        (_, checkpointIndex) => dayCheckIns?.get(checkpointIndex) ?? "open",
      );
      if (statuses.some((status) => status === "failed")) break;
      if (statuses.every((status) => status === "completed")) streak += 1;
    }
    cursor = addDays(cursor, -1);
  }

  return streak;
}

function checkInsInEstablishmentWindow(input: {
  establishingStartedOn: string;
  asOfDate: string;
  checkIns: readonly DatedCheckIn[];
}): DatedCheckIn[] {
  const windowStart = addDays(input.asOfDate, -(ESTABLISHMENT_WINDOW_DAYS - 1));
  const boundedStart =
    windowStart > input.establishingStartedOn
      ? windowStart
      : input.establishingStartedOn;

  return input.checkIns.filter(
    (checkIn) => checkIn.date >= boundedStart && checkIn.date <= input.asOfDate,
  );
}

function countCheckInStatuses(
  checkIns: readonly { status: CheckInStatus }[],
): EstablishmentCounts {
  const counts: EstablishmentCounts = { completed: 0, failed: 0, skipped: 0 };
  for (const checkIn of checkIns) counts[checkIn.status] += 1;
  return counts;
}

type DatedCheckIn = {
  date: string;
  checkpointIndex: number;
  status: CheckInStatus;
};

type EstablishmentCounts = {
  completed: number;
  failed: number;
  skipped: number;
};

export type EstablishmentSummary = {
  establishingDay: number;
  completionRate: number | null;
  counts: EstablishmentCounts;
  established: boolean;
};
