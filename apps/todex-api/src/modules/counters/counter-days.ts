import { addDaysToDate } from "@repo/api/todex";
import type {
  CounterDayOutcome,
  CounterFill,
  CounterOccurrenceSource,
  CounterOccurrenceStatus,
  SetCounterDayBody,
} from "@repo/api/todex";

/**
 * The result of a finished day. `entries` are its hand and Task marks. A
 * required day turns every untouched slot into a default fail.
 */
export function settleDay(
  target: number,
  required: boolean,
  entries: readonly { status: CounterOccurrenceStatus }[],
): Settlement {
  const completed = countStatus(entries, "completed");
  const skipped = countStatus(entries, "skipped");
  const untouched = Math.max(0, target - entries.length);
  const defaultFails = required ? untouched : 0;
  const failed = countStatus(entries, "failed") + defaultFails;
  return {
    completed,
    skipped,
    failed,
    outcome: outcomeFor(target, completed, failed),
    defaultFails,
  };
}

/**
 * Works out which entries to remove and add so a day ends up in the asked
 * state.
 */
export function planDay(input: {
  target: number;
  dayEntries: readonly CounterEntry[];
  change: SetCounterDayBody;
}): DayPlan {
  const { target, dayEntries, change } = input;
  if (change.status === "empty") return planKeeping(dayEntries, [], []);
  // Task completions are kept first, so lowering a count drops hand-made ones.
  const completions = dayEntries
    .filter((entry) => entry.status === "completed")
    .sort(
      (left, right) =>
        Number(right.source === "task") - Number(left.source === "task"),
    );
  if (change.status === "completed") {
    if (change.count > target) {
      return { error: `This day holds at most ${target}` };
    }
    const kept = completions.slice(0, change.count);
    return planKeeping(
      dayEntries,
      kept,
      repeat("completed", change.count - kept.length),
    );
  }
  // A fail or skip takes what is left of the day, or all of a finished one.
  const kept = completions.length < target ? completions : [];
  return planKeeping(
    dayEntries,
    kept,
    repeat(change.status, target - kept.length),
  );
}

/** The seven days ending on `until`, with what may be done to each. */
export function calendarDays<Entry extends CounterEntry>(input: {
  until: string;
  today: string;
  isActive: boolean;
  targetOn: (date: string) => number | null;
  entries: readonly Entry[];
}) {
  return Array.from({ length: 7 }, (_, offset) => {
    const date = addDaysToDate(input.until, offset - 6);
    const target = input.targetOn(date);
    const occurrences = input.entries.filter((entry) => entry.date === date);
    const completed = countStatus(occurrences, "completed");
    const capacity = target ?? 1;
    const loggable = input.isActive && target !== null && date <= input.today;
    return {
      date,
      tracked: target !== null,
      loggable,
      fill: fillFor(completed, capacity),
      capacity,
      completed,
      skipped: countStatus(occurrences, "skipped"),
      failed: countStatus(occurrences, "failed"),
      canComplete: loggable && completed < capacity,
      occurrences,
    };
  });
}

/**
 * Consecutive scheduled days ending now. A skipped day neither breaks nor
 * extends, and today only breaks on a hand-set fail. Before the Counter existed
 * nothing is failed by default, so there an unmarked or part-done day ends the
 * streak instead.
 */
export function currentStreak(input: {
  /** Saved days before today, in any order. */
  days: readonly SavedOutcome[];
  today: TodayProgress | null;
  createdOn: string;
  isScheduledOn: (date: string) => boolean;
}): number {
  const { today, createdOn } = input;
  if (today?.hasFail) return 0;
  let streak = today && today.completed >= today.target ? 1 : 0;
  const newestFirst = [...input.days].sort((left, right) =>
    right.date.localeCompare(left.date),
  );
  let laterDate = createdOn;
  for (const day of newestFirst) {
    if (day.date < createdOn) {
      if (hasScheduledBetween(day.date, laterDate, input.isScheduledOn)) break;
      laterDate = day.date;
      if (day.outcome === "excused" && day.skipped === 0) break;
    }
    if (day.outcome === "failed") break;
    if (day.outcome === "met") streak += 1;
  }
  return streak;
}

/** Days whose completions reached the day's target. */
export function totalDays(
  entries: readonly CounterEntry[],
  targetOn: (date: string) => number | null,
): number {
  const completedByDate = new Map<string, number>();
  for (const entry of entries) {
    if (entry.status !== "completed") continue;
    completedByDate.set(entry.date, (completedByDate.get(entry.date) ?? 0) + 1);
  }
  let total = 0;
  for (const [date, completed] of completedByDate) {
    if (completed >= (targetOn(date) ?? 1)) total += 1;
  }
  return total;
}

export function countStatus(
  entries: readonly { status: CounterOccurrenceStatus }[],
  status: CounterOccurrenceStatus,
): number {
  return entries.filter((entry) => entry.status === status).length;
}

function hasScheduledBetween(
  after: string,
  before: string,
  isScheduledOn: (date: string) => boolean,
): boolean {
  for (
    let date = addDaysToDate(after, 1);
    date < before;
    date = addDaysToDate(date, 1)
  ) {
    if (isScheduledOn(date)) return true;
  }
  return false;
}

function outcomeFor(
  target: number,
  completed: number,
  failed: number,
): CounterDayOutcome {
  if (failed > 0) return "failed";
  return completed >= target ? "met" : "excused";
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

export interface Settlement {
  completed: number;
  skipped: number;
  failed: number;
  outcome: CounterDayOutcome;
  defaultFails: number;
}

export interface CounterEntry {
  id: string;
  date: string;
  status: CounterOccurrenceStatus;
  source: CounterOccurrenceSource;
}

export type DayPlan =
  | { removeIds: string[]; add: CounterOccurrenceStatus[] }
  | { error: string };

export interface SavedOutcome {
  date: string;
  outcome: CounterDayOutcome;
  skipped: number;
}

export interface TodayProgress {
  completed: number;
  target: number;
  hasFail: boolean;
}
