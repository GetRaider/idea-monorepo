import {
  CounterScheduleSchema,
  positionForDrop,
  TASK_WEEKDAYS,
  TaskStatus,
} from "@repo/api/todex";
import type {
  Counter,
  CounterDay,
  CounterLink,
  CounterSchedule,
  CounterSection,
  SetCounterDayBody,
  Task,
  TaskWeekday,
} from "@repo/api/todex";

const LINK_CANDIDATE_LIMIT = 20;

const NO_SECTION_NAME = "No section";

export const NO_SECTION_ID = "none";

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

/** "Health", "Health and Growth", "Health, Growth and Home". */
export function joinNames(names: readonly string[]): string {
  if (names.length < 2) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
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

/** Short enough for a stat tile. */
export function formatDayAndMonth(date: string, locale?: string): string {
  return formatDate(date, locale, { month: "short", day: "numeric" });
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

/**
 * Counters under the user's sections in their order, then those in none. Empty
 * sections are included.
 */
export function groupBySection(
  counters: readonly Counter[],
  sections: readonly CounterSection[],
): CounterGroup[] {
  const known = new Set(sections.map((section) => section.id));
  const groups: CounterGroup[] = sections.map((section) => ({
    id: section.id,
    name: section.name,
    sectionId: section.id,
    counters: counters.filter((counter) => counter.sectionId === section.id),
  }));
  groups.push({
    id: NO_SECTION_ID,
    name: NO_SECTION_NAME,
    sectionId: null,
    counters: counters.filter(
      (counter) => !counter.sectionId || !known.has(counter.sectionId),
    ),
  });
  return groups;
}

/**
 * The new position of a section dropped on another one, taking its place; with
 * no target it goes to the end. Null when nothing would change.
 */
export function sectionMove(
  sections: readonly CounterSection[],
  sectionId: string,
  targetId: string | null,
): number | null {
  const ids = sections.map((section) => section.id);
  const from = ids.indexOf(sectionId);
  const to = targetId === null ? -1 : ids.indexOf(targetId);
  // Moving down lands after the target, moving up before it.
  const beforeId = to > from ? (ids[to + 1] ?? null) : targetId;
  return positionForDrop(
    ids,
    (id) => sections.find((section) => section.id === id)?.position ?? null,
    sectionId,
    beforeId,
  );
}

/**
 * Where a Counter lands when dropped into a section before another one, or at
 * its end. Null when nothing would change.
 */
export function counterMove(
  group: CounterGroup,
  counterId: string,
  beforeId: string | null,
): CounterMove | null {
  const position = positionForDrop(
    group.counters.map((counter) => counter.id),
    (id) =>
      group.counters.find((counter) => counter.id === id)?.position ?? null,
    counterId,
    beforeId,
  );
  if (position === null) return null;
  return { sectionId: group.sectionId, position };
}

/** The list as it will read once the move is saved. */
export function placeCounter(
  counters: readonly Counter[],
  counterId: string,
  move: CounterMove,
): Counter[] {
  return counters
    .map((counter) =>
      counter.id === counterId ? { ...counter, ...move } : counter,
    )
    .sort((left, right) => left.position - right.position);
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
  /** Null for Counters in no section. */
  sectionId: string | null;
  counters: Counter[];
}

export interface ScheduleDraft {
  frequency: CounterSchedule["frequency"];
  dayInterval: string;
  weekInterval: number;
  weekdays: TaskWeekday[];
  monthDay: string;
}

export interface CounterMove {
  sectionId: string | null;
  position: number;
}
