import {
  addDaysToDate,
  formatWallDate,
  wallTimeToUtc,
  type ExecutionInterval,
} from "@repo/api/todex";

export function sessionDisplayTitle(input: {
  title: string | null;
  tasks: { summary: string }[];
}) {
  const custom = input.title?.trim();
  if (custom) return custom;
  const first = input.tasks[0];
  if (!first) return "Session";
  if (input.tasks.length === 1) return first.summary;
  const extra = input.tasks.length - 1;
  const noun = extra === 1 ? "task" : "tasks";
  return `${first.summary} +${extra} ${noun}`;
}

export function unionDurationSeconds(
  intervals: ExecutionInterval[],
  now: Date,
) {
  const ranges = intervals.flatMap((interval) => {
    const start = Date.parse(interval.startedAt);
    const end = Date.parse(interval.endedAt ?? now.toISOString());
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      return [];
    }
    return [{ start, end }];
  });
  ranges.sort((left, right) => left.start - right.start);
  let total = 0;
  let cursor = -Infinity;
  for (const range of ranges) {
    const start = Math.max(range.start, cursor);
    if (range.end > start) total += range.end - start;
    cursor = Math.max(cursor, range.end);
  }
  return Math.floor(total / 1000);
}

export function splitIntervalAtLocalMidnight(
  interval: ExecutionInterval,
  timeZone: string,
  now: Date,
) {
  const start = Date.parse(interval.startedAt);
  const end = Date.parse(interval.endedAt ?? now.toISOString());
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return [];
  const slices: { start: Date; end: Date }[] = [];
  let cursor = start;
  while (cursor < end) {
    const nextDay = addDaysToDate(formatWallDate(new Date(cursor), timeZone), 1);
    const nextMidnight = wallTimeToUtc({
      year: Number(nextDay.slice(0, 4)),
      month: Number(nextDay.slice(5, 7)),
      day: Number(nextDay.slice(8, 10)),
      timeZone,
    }).getTime();
    const sliceEnd = Math.min(end, nextMidnight);
    if (sliceEnd > cursor) {
      slices.push({ start: new Date(cursor), end: new Date(sliceEnd) });
    }
    if (sliceEnd <= cursor) break;
    cursor = sliceEnd;
  }
  return slices;
}

export function formatChipRange(start: Date, end: Date) {
  const time = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${time.format(start)}–${time.format(end)} • ${formatChipDuration(chipSpanMinutes(start, end))}`;
}

export function chipSpanMinutes(start: Date, end: Date) {
  const startDay = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  const days = Math.round((endDay - startDay) / 86_400_000);
  return Math.max(0, days * 24 * 60 + clockMinutes(end) - clockMinutes(start));
}

export function formatSliceRange(start: Date, end: Date) {
  const time = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${time.format(start)}–${time.format(end)}`;
}

function clockMinutes(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function formatChipDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}
