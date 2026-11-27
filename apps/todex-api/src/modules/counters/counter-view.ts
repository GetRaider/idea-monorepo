import { addDaysToDate } from "@repo/api/todex";
import type { Counter, CounterOccurrence, CounterRule } from "@repo/api/todex";

import type {
  CounterDayRow,
  CounterOccurrenceRow,
  CounterRow,
} from "../../db/schema";
import {
  calendarDays,
  countStatus,
  currentStreak,
  totalDays,
} from "./counter-days";
import {
  isSameSchedule,
  isScheduled,
  localDate,
  nextScheduledDate,
} from "./counter-schedule";

/**
 * Puts a rule in force from a date. A new schedule counts its interval from
 * that date; a new target alone keeps the old rhythm.
 */
export function applyRule(
  counter: CounterRow,
  rule: CounterRule,
  from: string,
): CounterRow {
  const isNewSchedule = !isSameSchedule(counter.schedule, rule.schedule);
  return {
    ...counter,
    schedule: rule.schedule,
    target: rule.target,
    anchorDate: isNewSchedule ? from : counter.anchorDate,
    pendingChange: null,
  };
}

/**
 * The target of each date, or null when the Counter does not track it. A saved
 * day keeps its own target; any other date follows the schedule.
 */
export function targetResolver(
  counter: CounterRow,
  days: readonly CounterDayRow[],
  today: string,
): (date: string) => number | null {
  const saved = new Map(days.map((day) => [day.localDate, day.target]));
  return (date) => {
    const target = saved.get(date);
    if (target !== undefined) return target;
    if (counter.status !== "active") return null;
    const rule = ruleOn(counter, date, today);
    return isScheduled(rule.schedule, rule.anchorDate, date)
      ? rule.target
      : null;
  };
}

export function toCounterOccurrence(
  counter: CounterRow,
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
    deletable: counter.status === "active" && row.source !== "system",
    createdAt: row.createdAt.toISOString(),
  };
}

export function toCounter(input: {
  counter: CounterRow;
  occurrences: readonly CounterOccurrence[];
  days: readonly CounterDayRow[];
  spaceIds: string[];
  until?: string;
  now: Date;
}): Counter {
  const { counter, occurrences, days } = input;
  const today = localDate(input.now, counter.timeZone);
  const isActive = counter.status === "active";
  const targetOn = targetResolver(counter, days, today);
  const todayTarget = isActive ? targetOn(today) : null;
  const todaysEntries = occurrences.filter((entry) => entry.date === today);
  const progress =
    todayTarget === null
      ? null
      : {
          completed: countStatus(todaysEntries, "completed"),
          target: todayTarget,
        };
  const tomorrow = addDaysToDate(today, 1);
  const upcoming = ruleOn(counter, tomorrow, today);
  return {
    id: counter.id,
    name: counter.name,
    sectionId: counter.sectionId,
    color: counter.color,
    spaceIds: input.spaceIds,
    countsAnyTask: input.spaceIds.length > 0 && counter.countsAnyTask,
    position: counter.position,
    schedule: counter.schedule,
    target: counter.target,
    timeZone: counter.timeZone,
    showInToday: counter.showInToday,
    status: counter.status,
    today,
    progress: {
      today: progress,
      nextDate: isActive
        ? nextScheduledDate(upcoming.schedule, upcoming.anchorDate, today)
        : null,
    },
    pendingChange: counter.pendingChange
      ? { ...counter.pendingChange, effectiveDate: tomorrow }
      : null,
    stats: {
      totalDays: totalDays(occurrences, targetOn),
      streak: currentStreak({
        days: days
          .filter((day) => day.localDate < today)
          .map((day) => ({
            date: day.localDate,
            outcome: day.outcome,
            skipped: day.skipped,
          })),
        today: progress && {
          ...progress,
          hasFail: countStatus(todaysEntries, "failed") > 0,
        },
        createdOn: localDate(counter.createdAt, counter.timeZone),
        isScheduledOn: (date) =>
          isScheduled(counter.schedule, counter.anchorDate, date),
      }),
    },
    week: calendarDays({
      until: input.until ?? today,
      today,
      isActive,
      targetOn,
      entries: occurrences,
    }),
  };
}

/** A waiting change already decides the days after today. */
function ruleOn(counter: CounterRow, date: string, today: string): CounterRow {
  if (!counter.pendingChange || date <= today) return counter;
  return applyRule(counter, counter.pendingChange, addDaysToDate(today, 1));
}

export type OccurrenceWithTask = CounterOccurrenceRow & {
  taskSummary: string | null;
};
