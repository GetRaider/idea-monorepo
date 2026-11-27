import { addDaysToDate, formatOccurrenceLocalKey } from "@repo/api/todex";
import type {
  CounterFill,
  CounterOccurrenceSource,
  CounterOccurrenceStatus,
  CounterPeriodOutcome,
  CounterRule,
  SetCounterDayBody,
} from "@repo/api/todex";

const DAY_MS = 86_400_000;

const TARGET_COVERED = "The Target for this period is already covered";

/** The calendar date of an instant in the Counter's time zone. */
export function localDate(now: Date, timeZone: string): string {
  return formatOccurrenceLocalKey(now, timeZone).slice(0, 10);
}

export function mondayOf(date: string): string {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  return addDaysToDate(date, -((weekday + 6) % 7));
}

export function periodContaining(
  rule: Recurrence,
  anchor: string,
  date: string,
): Period {
  if (rule.frequency === "monthly") return calendarMonth(date);
  if (rule.frequency === "weekly") {
    return dayBlock(mondayOf(anchor), rule.interval * 7, date);
  }
  return dayBlock(anchor, rule.interval, date);
}

/** The period that follows the cursor. A new rule may make it shorter than usual. */
export function openPeriod(
  rule: Recurrence,
  anchor: string,
  closedThrough: string,
): Period {
  const start = addDaysToDate(closedThrough, 1);
  return { start, end: periodContaining(rule, anchor, start).end };
}

/** `occurrences` are the hand and Task entries; default fails are the result. */
export function settlePeriod(
  period: Period,
  target: number,
  occurrences: readonly DatedStatus[],
): Settlement {
  const inside = occurrences.filter((occurrence) =>
    isWithin(period, occurrence.date),
  );
  const completed = countStatus(inside, "completed");
  const skipped = countStatus(inside, "skipped");
  const markedFailed = countStatus(inside, "failed");
  const untouched = Math.max(0, target - completed - skipped - markedFailed);
  const failed = markedFailed + untouched;
  return {
    completed,
    skipped,
    failed,
    outcome: outcomeFor(target, completed, failed),
    failedDates: placeFailures(period, untouched, inside),
  };
}

/** One mark per day, more only when the Target cannot fit otherwise. */
export function dayCapacity(period: Period, target: number): number {
  return Math.ceil(target / daysBetween(period.start, period.end, 1));
}

/**
 * Works out which entries to remove and add so a day ends up in the asked
 * state. `otherDays` counts the period's hand and Task entries on other days.
 */
export function planDay(input: {
  period: TrackedPeriod;
  dayEntries: readonly CounterEntry[];
  otherDays: number;
  change: SetCounterDayBody;
}): DayPlan {
  const { period, dayEntries, change } = input;
  if (change.status === "empty") return planKeeping(dayEntries, [], []);
  const capacity = dayCapacity(period, period.target);
  const room = period.target - input.otherDays;
  // Task completions are kept first, so lowering a count drops hand-made ones.
  const completions = dayEntries
    .filter((entry) => entry.status === "completed")
    .sort(
      (left, right) =>
        Number(right.source === "task") - Number(left.source === "task"),
    );
  if (change.status === "completed") {
    if (change.count > capacity) {
      return { error: `This day holds at most ${capacity}` };
    }
    if (change.count > room) return { error: TARGET_COVERED };
    const kept = completions.slice(0, change.count);
    return planKeeping(
      dayEntries,
      kept,
      repeat("completed", change.count - kept.length),
    );
  }
  if (room <= 0) return { error: TARGET_COVERED };
  const fitsBeside = completions.length < Math.min(capacity, room);
  const kept = fitsBeside ? completions : [];
  const slots = Math.min(capacity, room) - kept.length;
  return planKeeping(dayEntries, kept, repeat(change.status, slots));
}

/** The seven days ending on `until`, with what may be done to each. */
export function calendarDays<Entry extends CounterEntry>(input: {
  until: string;
  today: string;
  isActive: boolean;
  periods: readonly TrackedPeriod[];
  entries: readonly Entry[];
}) {
  return Array.from({ length: 7 }, (_, offset) => {
    const date = addDaysToDate(input.until, offset - 6);
    const period = input.periods.find((item) => isWithin(item, date));
    const occurrences = input.entries.filter((entry) => entry.date === date);
    const completed = countStatus(occurrences, "completed");
    const capacity = period ? dayCapacity(period, period.target) : 1;
    const loggable =
      input.isActive && period !== undefined && date <= input.today;
    const otherDays = period
      ? input.entries.filter(
          (entry) =>
            entry.source !== "system" &&
            entry.date !== date &&
            isWithin(period, entry.date),
        ).length
      : 0;
    const room = period ? period.target - otherDays : 0;
    return {
      date,
      tracked: period !== undefined,
      loggable,
      fill: fillFor(completed, capacity),
      capacity,
      completed,
      skipped: countStatus(occurrences, "skipped"),
      failed: countStatus(occurrences, "failed"),
      canComplete: loggable && completed < Math.min(capacity, room),
      canMark: loggable && room > 0,
      occurrences,
    };
  });
}

/**
 * Consecutive periods ending now. `closed` may be in any order; Excused neither
 * breaks nor extends, and an unfinished period only breaks on a hand-set fail.
 */
export function currentStreak(
  closed: readonly ClosedOutcome[],
  open: OpenProgress | null,
): number {
  if (open?.hasFail) return 0;
  let streak = open && open.completed >= open.target ? 1 : 0;
  const newestFirst = [...closed].sort((left, right) =>
    right.start.localeCompare(left.start),
  );
  for (const period of newestFirst) {
    if (period.outcome === "failed") break;
    if (period.outcome === "met") streak += 1;
  }
  return streak;
}

/** Days whose completions reached the day's capacity. */
export function totalDays(
  entries: readonly CounterEntry[],
  periods: readonly TrackedPeriod[],
): number {
  const completedByDate = new Map<string, number>();
  for (const entry of entries) {
    if (entry.status !== "completed") continue;
    completedByDate.set(entry.date, (completedByDate.get(entry.date) ?? 0) + 1);
  }
  let total = 0;
  for (const [date, completed] of completedByDate) {
    const period = periods.find((item) => isWithin(item, date));
    const capacity = period ? dayCapacity(period, period.target) : 1;
    if (completed >= capacity) total += 1;
  }
  return total;
}

export function isWithin(period: Period, date: string): boolean {
  return date >= period.start && date <= period.end;
}

export function countStatus(
  occurrences: readonly DatedStatus[],
  status: CounterOccurrenceStatus,
): number {
  return occurrences.filter((occurrence) => occurrence.status === status)
    .length;
}

function calendarMonth(date: string): Period {
  const [year, month] = date.split("-").map(Number);
  const last = new Date(Date.UTC(year ?? 0, month ?? 1, 0)).getUTCDate();
  const prefix = date.slice(0, 7);
  return { start: `${prefix}-01`, end: `${prefix}-${last}` };
}

function dayBlock(origin: string, length: number, date: string): Period {
  const elapsed = daysBetween(origin, date);
  const start = addDaysToDate(origin, Math.floor(elapsed / length) * length);
  return { start, end: addDaysToDate(start, length - 1) };
}

function outcomeFor(
  target: number,
  completed: number,
  failed: number,
): CounterPeriodOutcome {
  if (failed > 0) return "failed";
  return completed >= target ? "met" : "excused";
}

/** Default fails take the last empty days; any remainder lands on the last day. */
function placeFailures(
  period: Period,
  failed: number,
  occurrences: readonly DatedStatus[],
): string[] {
  if (failed === 0) return [];
  const taken = new Set(occurrences.map((occurrence) => occurrence.date));
  const empty: string[] = [];
  for (
    let date = period.start;
    date <= period.end;
    date = addDaysToDate(date, 1)
  ) {
    if (!taken.has(date)) empty.push(date);
  }
  const placed = empty.slice(-failed);
  const remainder = Array<string>(failed - placed.length).fill(period.end);
  return [...placed, ...remainder];
}

function fillFor(completed: number, capacity: number): CounterFill {
  if (completed === 0) return "empty";
  return completed >= capacity ? "filled" : "partial";
}

function planKeeping(
  dayEntries: readonly CounterEntry[],
  kept: readonly CounterEntry[],
  add: CounterOccurrenceStatus[],
): DayPlan {
  return {
    removeIds: dayEntries
      .filter((entry) => !kept.includes(entry))
      .map((entry) => entry.id),
    add,
  };
}

function repeat(
  status: CounterOccurrenceStatus,
  count: number,
): CounterOccurrenceStatus[] {
  return Array<CounterOccurrenceStatus>(count).fill(status);
}

/** Whole days from `start` to `end`, plus `extra`. */
function daysBetween(start: string, end: string, extra = 0): number {
  const elapsed =
    Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`);
  return Math.round(elapsed / DAY_MS) + extra;
}

export type Recurrence = Pick<CounterRule, "frequency" | "interval">;

export interface Period {
  start: string;
  end: string;
}

export interface TrackedPeriod extends Period {
  target: number;
}

export interface DatedStatus {
  date: string;
  status: CounterOccurrenceStatus;
}

export interface Settlement {
  completed: number;
  skipped: number;
  failed: number;
  outcome: CounterPeriodOutcome;
  failedDates: string[];
}

export interface CounterEntry extends DatedStatus {
  id: string;
  source: CounterOccurrenceSource;
}

export type DayPlan =
  | { removeIds: string[]; add: CounterOccurrenceStatus[] }
  | { error: string };

export interface ClosedOutcome {
  start: string;
  outcome: CounterPeriodOutcome;
}

export interface OpenProgress {
  completed: number;
  target: number;
  hasFail: boolean;
}
