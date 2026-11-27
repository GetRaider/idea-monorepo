import { TaskStatus } from "@repo/api/todex";
import type { Counter, CounterDay, CounterLink, Task } from "@repo/api/todex";

const LINK_CANDIDATE_LIMIT = 20;

export function progressLabel(counter: Counter, locale?: string): string {
  const { period } = counter;
  if (!period) return "Archived";
  if (!period.isOpen) {
    return `Resumes ${formatLocalDate(period.start, locale)}`;
  }
  return `${period.completed} / ${counter.target} ${periodName(counter)}`;
}

/** Counter dates are calendar dates, so they are formatted without a shift. */
export function formatLocalDate(date: string, locale?: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function dayLabel(day: CounterDay, locale?: string): string {
  const marks = [
    day.completed ? `${day.completed} completed` : null,
    day.skipped ? `${day.skipped} skipped` : null,
    day.failed ? `${day.failed} failed` : null,
  ].filter(Boolean);
  const summary = marks.length > 0 ? marks.join(", ") : "nothing logged";
  return `${formatLocalDate(day.date, locale)}: ${summary}`;
}

export function isSkipCovered(counter: Counter): boolean {
  const { period } = counter;
  if (!period) return true;
  return period.completed + period.skipped >= counter.target;
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
