import { TaskStatus } from "@repo/api/todex";
import type {
  Counter,
  CounterDay,
  CounterLink,
  SetCounterDayBody,
  Task,
} from "@repo/api/todex";

const LINK_CANDIDATE_LIMIT = 20;

const NO_SPACE_NAME = "No space";

export function progressLabel(counter: Counter, locale?: string): string {
  const { period } = counter;
  if (!period) return "Archived";
  if (!period.isOpen) {
    return `Resumes ${formatLocalDate(period.start, locale)}`;
  }
  return `${period.completed} / ${counter.target} ${periodName(counter)}`;
}

export function streakLabel(counter: Counter): string {
  const unit = counter.interval > 1 ? "period" : PERIOD_UNIT[counter.frequency];
  return countLabel(counter.stats.streak, unit);
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
  const summary = marks.length > 0 ? marks.join(", ") : "nothing logged";
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

/** Share of the Counters tracked on one column that are done, or null. */
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

function periodName(counter: Counter): string {
  const unit = PERIOD_UNIT[counter.frequency];
  if (counter.interval > 1) return `these ${counter.interval} ${unit}s`;
  if (counter.frequency === "daily") return "today";
  return `this ${unit}`;
}

const PERIOD_UNIT: Record<Counter["frequency"], string> = {
  daily: "day",
  weekly: "week",
  monthly: "month",
};

export interface CounterGroup {
  id: string;
  name: string;
  color: string | null;
  counters: Counter[];
}
