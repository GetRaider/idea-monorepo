import {
  CounterScheduleSchema,
  TASK_WEEKDAYS,
  TaskStatus,
} from "@repo/api/todex";
import type {
  Counter,
  CounterDay,
  CounterLink,
  CounterSchedule,
  SetCounterDayBody,
  Task,
  TaskWeekday,
} from "@repo/api/todex";

const LINK_CANDIDATE_LIMIT = 20;

const NO_SPACE_NAME = "No space";

export function progressLabel(counter: Counter, locale?: string): string {
  if (counter.status === "archived") return "Archived";
  const { today, nextDate } = counter.progress;
  if (today) return `${today.completed} / ${today.target} today`;
  return nextDate
    ? `Next ${formatLocalDate(nextDate, locale)}`
    : "Not scheduled";
}

/** The form keeps a value for every repeat kind, so switching loses nothing. */
export function scheduleDraft(
  schedule: CounterSchedule,
  today: string,
): ScheduleDraft {
  const weekday = TASK_WEEKDAYS[new Date(`${today}T00:00:00Z`).getUTCDay()];
  const draft: ScheduleDraft = {
    frequency: schedule.frequency,
    dayInterval: "1",
    weekInterval: 1,
    weekdays: weekday ? [weekday] : [],
    monthDay: String(Number(today.slice(8))),
  };
  if (schedule.frequency === "daily") {
    return { ...draft, dayInterval: String(schedule.interval) };
  }
  if (schedule.frequency === "monthly") {
    return { ...draft, monthDay: String(schedule.monthDay) };
  }
  return {
    ...draft,
    weekInterval: schedule.interval,
    weekdays: schedule.weekdays,
  };
}

/** Null while the chosen repeat kind is incomplete or out of range. */
export function scheduleFromDraft(
  draft: ScheduleDraft,
): CounterSchedule | null {
  const parsed = CounterScheduleSchema.safeParse(draftSchedule(draft));
  return parsed.success ? parsed.data : null;
}

export function countLabel(count: number, unit: string): string {
  return `${count} ${count === 1 ? unit : `${unit}s`}`;
}

/** Counter dates are calendar dates, so they are formatted without a shift. */
export function formatLocalDate(date: string, locale?: string): string {
  return formatDate(date, locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function weekdayName(date: string, locale?: string): string {
  return formatDate(date, locale, { weekday: "short" });
}

/** The viewer's calendar date, used to line up the day columns. */
export function localToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function dayLabel(day: CounterDay, locale?: string): string {
  const reason = day.occurrences.find(
    (occurrence) => occurrence.skipReason,
  )?.skipReason;
  const marks = [
    day.completed ? `${day.completed} completed` : null,
    day.skipped
      ? `${day.skipped} skipped${reason ? ` (${reason})` : ""}`
      : null,
    day.failed ? `${day.failed} failed` : null,
  ].filter(Boolean);
  const nothing = day.tracked ? "nothing logged" : "not scheduled";
  const summary = marks.length > 0 ? marks.join(", ") : nothing;
  return `${formatLocalDate(day.date, locale)}: ${summary}`;
}

/**
 * What a plain click does: one more completion while there is room, otherwise
 * clear a completed day.
 */
export function dayClickChange(day: CounterDay): SetCounterDayBody | null {
  if (!day.loggable) return null;
  if (day.canComplete) {
    return { status: "completed", count: day.completed + 1 };
  }
  return day.completed > 0 ? { status: "empty" } : null;
}

/** Share of the Counters scheduled on one column that are done, or null. */
export function dayShare(
  counters: readonly Counter[],
  column: number,
): number | null {
  const tracked = counters.flatMap((counter) => {
    const day = counter.week[column];
    return day?.tracked ? [day] : [];
  });
  if (tracked.length === 0) return null;
  const done = tracked.filter((day) => day.fill === "filled").length;
  return done / tracked.length;
}

export function groupBySpace(
  counters: readonly Counter[],
  spaces: readonly { id: string; name: string; color: string }[],
): CounterGroup[] {
  const known = new Set(spaces.map((space) => space.id));
  const groups: CounterGroup[] = spaces.map((space) => ({
    id: space.id,
    name: space.name,
    color: space.color,
    counters: counters.filter((counter) => counter.spaceId === space.id),
  }));
  groups.push({
    id: "none",
    name: NO_SPACE_NAME,
    color: null,
    counters: counters.filter(
      (counter) => !counter.spaceId || !known.has(counter.spaceId),
    ),
  });
  return groups.filter((group) => group.counters.length > 0);
}

/** Open Tasks that can still be linked, with a repeating Task listed once. */
export function linkCandidates(
  tasks: readonly Task[],
  links: readonly Pick<CounterLink, "taskId" | "seriesId">[],
  search: string,
): Task[] {
  const query = search.trim().toLowerCase();
  const linkedTasks = new Set(links.map((link) => link.taskId));
  const linkedSeries = new Set(links.map((link) => link.seriesId));
  const candidates = new Map<string, Task>();
  for (const task of tasks) {
    if (task.status === TaskStatus.CANCELLED) continue;
    if (task.seriesId) {
      if (linkedSeries.has(task.seriesId)) continue;
      const listed = candidates.get(task.seriesId);
      if (!listed || listed.status === TaskStatus.DONE) {
        candidates.set(task.seriesId, task);
      }
      continue;
    }
    if (task.status === TaskStatus.DONE || linkedTasks.has(task.id)) continue;
    candidates.set(task.id, task);
  }
  return [...candidates.values()]
    .filter((task) =>
      `${task.summary} ${task.taskKey}`.toLowerCase().includes(query),
    )
    .slice(0, LINK_CANDIDATE_LIMIT);
}

function formatDate(
  date: string,
  locale: string | undefined,
  options: Intl.DateTimeFormatOptions,
): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(locale, {
    ...options,
    timeZone: "UTC",
  });
}

function draftSchedule(draft: ScheduleDraft) {
  if (draft.frequency === "daily") {
    return { frequency: "daily", interval: Number(draft.dayInterval) };
  }
  if (draft.frequency === "monthly") {
    return { frequency: "monthly", monthDay: Number(draft.monthDay) };
  }
  return {
    frequency: "weekly",
    interval: draft.weekInterval,
    weekdays: draft.weekdays,
  };
}

export interface CounterGroup {
  id: string;
  name: string;
  color: string | null;
  counters: Counter[];
}

export interface ScheduleDraft {
  frequency: CounterSchedule["frequency"];
  dayInterval: string;
  weekInterval: number;
  weekdays: TaskWeekday[];
  monthDay: string;
}
