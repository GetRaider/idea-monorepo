import { addDaysToDate, formatOccurrenceLocalKey } from "@repo/api/todex";
import type {
  CounterFill,
  CounterOccurrenceStatus,
  CounterPeriodOutcome,
  CounterRule,
} from "@repo/api/todex";

const DAY_MS = 86_400_000;

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
  const failed = Math.max(0, target - completed - skipped);
  return {
    completed,
    skipped,
    failed,
    outcome: outcomeFor(target, completed, failed),
    failedDates: placeFailures(period, failed, inside),
  };
}

export function weekDays<Occurrence extends DatedStatus>(input: {
  today: string;
  rule: CounterRule;
  period: Period | null;
  closedPeriods: readonly ClosedPeriod[];
  occurrences: readonly Occurrence[];
}) {
  const monday = mondayOf(input.today);
  return Array.from({ length: 7 }, (_, offset) => {
    const date = addDaysToDate(monday, offset);
    const occurrences = input.occurrences.filter(
      (occurrence) => occurrence.date === date,
    );
    const completed = countStatus(occurrences, "completed");
    const closed = input.closedPeriods.find((period) => isWithin(period, date));
    const dayTarget = closed
      ? closedDayTarget(closed)
      : openDayTarget(input.rule);
    return {
      date,
      fill: fillFor(completed, dayTarget),
      completed,
      skipped: countStatus(occurrences, "skipped"),
      failed: countStatus(occurrences, "failed"),
      loggable:
        input.period !== null &&
        isWithin(input.period, date) &&
        date <= input.today,
      occurrences,
    };
  });
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
  const elapsed = Math.round(
    (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${origin}T00:00:00Z`)) /
      DAY_MS,
  );
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

/** Failed slots take the last empty days; any remainder lands on the last day. */
function placeFailures(
  period: Period,
  failed: number,
  occurrences: readonly DatedStatus[],
): string[] {
  if (failed === 0) return [];
  const taken = new Set(
    occurrences
      .filter((occurrence) => occurrence.status !== "failed")
      .map((occurrence) => occurrence.date),
  );
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

function openDayTarget(rule: CounterRule): number {
  return rule.frequency === "daily" && rule.interval === 1 ? rule.target : 1;
}

function closedDayTarget(period: ClosedPeriod): number {
  return period.start === period.end ? period.target : 1;
}

function fillFor(completed: number, dayTarget: number): CounterFill {
  if (completed === 0) return "empty";
  return completed >= dayTarget ? "filled" : "partial";
}

export type Recurrence = Pick<CounterRule, "frequency" | "interval">;

export interface Period {
  start: string;
  end: string;
}

export interface ClosedPeriod extends Period {
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
