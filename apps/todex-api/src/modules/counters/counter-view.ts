import { addDaysToDate } from "@repo/api/todex";
import type { Counter, CounterOccurrence } from "@repo/api/todex";

import type { CounterOccurrenceRow, CounterRow } from "../../db/schema";
import {
  countStatus,
  isWithin,
  localDate,
  openPeriod,
  weekDays,
  type ClosedPeriod,
  type Period,
} from "./counter-periods";

/** The period currently being tracked; archived Counters have none. */
export function trackedPeriod(counter: CounterRow): Period | null {
  if (counter.status !== "active") return null;
  return openPeriod(counter, counter.anchorDate, counter.closedThrough);
}

export function toCounterOccurrence(
  counter: CounterRow,
  row: OccurrenceWithTask,
): CounterOccurrence {
  const period = trackedPeriod(counter);
  return {
    id: row.id,
    date: row.localDate,
    status: row.status,
    source: row.source,
    skipReason: row.skipReason,
    taskId: row.taskId,
    taskSummary: row.taskSummary,
    deletable:
      row.source === "manual" &&
      period !== null &&
      isWithin(period, row.localDate),
    createdAt: row.createdAt.toISOString(),
  };
}

export function toCounter(input: {
  counter: CounterRow;
  occurrences: readonly CounterOccurrence[];
  closedPeriods: readonly ClosedPeriod[];
  now: Date;
}): Counter {
  const { counter } = input;
  const today = localDate(input.now, counter.timeZone);
  const period = trackedPeriod(counter);
  const inPeriod = period
    ? input.occurrences.filter((occurrence) =>
        isWithin(period, occurrence.date),
      )
    : [];
  return {
    id: counter.id,
    name: counter.name,
    frequency: counter.frequency,
    interval: counter.interval,
    target: counter.target,
    timeZone: counter.timeZone,
    showInToday: counter.showInToday,
    status: counter.status,
    today,
    period: period
      ? {
          ...period,
          completed: countStatus(inPeriod, "completed"),
          skipped: countStatus(inPeriod, "skipped"),
          failed: countStatus(inPeriod, "failed"),
          isOpen: period.start <= today,
        }
      : null,
    pendingChange: counter.pendingChange
      ? {
          ...counter.pendingChange,
          effectiveDate: period ? addDaysToDate(period.end, 1) : null,
        }
      : null,
    week: weekDays({
      today,
      rule: counter,
      period,
      closedPeriods: input.closedPeriods,
      occurrences: input.occurrences,
    }),
  };
}

export type OccurrenceWithTask = CounterOccurrenceRow & {
  taskSummary: string | null;
};
