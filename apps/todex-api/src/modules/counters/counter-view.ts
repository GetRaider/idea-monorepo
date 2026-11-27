import { addDaysToDate } from "@repo/api/todex";
import type { Counter, CounterOccurrence } from "@repo/api/todex";

import type {
  CounterOccurrenceRow,
  CounterPeriodRow,
  CounterRow,
} from "../../db/schema";
import {
  calendarDays,
  countStatus,
  currentStreak,
  isWithin,
  localDate,
  openPeriod,
  totalDays,
  type Period,
  type TrackedPeriod,
} from "./counter-periods";

/** The period currently being tracked; archived Counters have none. */
export function trackedPeriod(counter: CounterRow): Period | null {
  if (counter.status !== "active") return null;
  return openPeriod(counter, counter.anchorDate, counter.closedThrough);
}

/** Closed snapshots plus the open period: every day that belongs to a Target. */
export function trackedPeriods(
  counter: CounterRow,
  snapshots: readonly CounterPeriodRow[],
): TrackedPeriod[] {
  const closed = snapshots.map((snapshot) => ({
    start: snapshot.startDate,
    end: snapshot.endDate,
    target: snapshot.target,
  }));
  const open = trackedPeriod(counter);
  return open ? [...closed, { ...open, target: counter.target }] : closed;
}

export function toCounterOccurrence(
  counter: CounterRow,
  periods: readonly TrackedPeriod[],
  row: OccurrenceWithTask,
): CounterOccurrence {
  return {
    id: row.id,
    date: row.localDate,
    status: row.status,
    source: row.source,
    skipReason: row.skipReason,
    taskId: row.taskId,
    taskSummary: row.taskSummary,
    deletable:
      counter.status === "active" &&
      row.source !== "system" &&
      periods.some((period) => isWithin(period, row.localDate)),
    createdAt: row.createdAt.toISOString(),
  };
}

export function toCounter(input: {
  counter: CounterRow;
  occurrences: readonly CounterOccurrence[];
  snapshots: readonly CounterPeriodRow[];
  until?: string;
  now: Date;
}): Counter {
  const { counter, occurrences, snapshots } = input;
  const today = localDate(input.now, counter.timeZone);
  const period = trackedPeriod(counter);
  const periods = trackedPeriods(counter, snapshots);
  const inPeriod = period
    ? occurrences.filter((occurrence) => isWithin(period, occurrence.date))
    : [];
  const completed = countStatus(inPeriod, "completed");
  return {
    id: counter.id,
    name: counter.name,
    spaceId: counter.spaceId,
    countsSpaceTasks: counter.spaceId !== null && counter.countsSpaceTasks,
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
          completed,
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
    stats: {
      totalDays: totalDays(occurrences, periods),
      streak: currentStreak(
        snapshots.map((snapshot) => ({
          start: snapshot.startDate,
          outcome: snapshot.outcome,
        })),
        period
          ? {
              completed,
              target: counter.target,
              hasFail: countStatus(inPeriod, "failed") > 0,
            }
          : null,
      ),
    },
    week: calendarDays({
      until: input.until ?? today,
      today,
      isActive: counter.status === "active",
      periods,
      entries: occurrences,
    }),
  };
}

export type OccurrenceWithTask = CounterOccurrenceRow & {
  taskSummary: string | null;
};
