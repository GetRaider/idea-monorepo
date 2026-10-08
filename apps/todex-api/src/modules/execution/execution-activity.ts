import type { ExecutionActivity, ExecutionInterval } from "@repo/api/todex";

const MAX_RANGE_DAYS = 366;

export function buildExecutionActivity(
  input: BuildActivityInput,
): ExecutionActivity {
  const days = eachDay(input.from, input.to);
  if (days.length === 0 || days.length > MAX_RANGE_DAYS) {
    throw new Error("Invalid range");
  }
  const rangeStart = zonedBoundary(input.from, input.timeZone, false);
  const rangeEnd = zonedBoundary(input.to, input.timeZone, true);
  const daySeconds = new Map(days.map((day) => [day, 0]));
  const sessionSeconds = new Map<string, number>();
  const activitySeconds = new Map<string, { label: string; seconds: number }>();
  const boards = new Map<string, string>();

  for (const slice of input.slices) {
    let tracked = 0;
    for (const interval of slice.intervals) {
      const started = Date.parse(interval.startedAt);
      const ended = Date.parse(interval.endedAt ?? input.now.toISOString());
      if (!Number.isFinite(started) || !Number.isFinite(ended)) continue;
      const from = Math.max(started, rangeStart.getTime());
      const to = Math.min(ended, rangeEnd.getTime());
      if (to <= from) continue;
      const seconds = splitOverlap(from, to, input.timeZone, (day, amount) => {
        if (!daySeconds.has(day)) return;
        daySeconds.set(day, (daySeconds.get(day) ?? 0) + amount);
      });
      tracked += seconds;
    }
    if (tracked === 0) continue;
    boards.set(slice.boardId, slice.boardName);
    if (input.boardId && slice.boardId !== input.boardId) continue;
    sessionSeconds.set(
      slice.sessionId,
      (sessionSeconds.get(slice.sessionId) ?? 0) + tracked,
    );
    const section = slice.isDefaultArea ? null : slice.areaName;
    const id = section ? `${slice.boardId}:${slice.areaId}` : slice.boardId;
    const label = section ? `${slice.boardName} · ${section}` : slice.boardName;
    const current = activitySeconds.get(id);
    activitySeconds.set(id, {
      label,
      seconds: (current?.seconds ?? 0) + tracked,
    });
  }

  const filteredDaySeconds = input.boardId
    ? daySecondsFromSlices(input, rangeStart, rangeEnd, days)
    : daySeconds;
  const executionSeconds = [...filteredDaySeconds.values()].reduce(
    (total, seconds) => total + seconds,
    0,
  );
  const sessionTotals = [...sessionSeconds.values()];
  const activeDays = [...filteredDaySeconds.values()].filter(
    (seconds) => seconds > 0,
  ).length;

  return {
    executionSeconds,
    sessionCount: sessionTotals.length,
    dailyAverageSeconds: Math.round(executionSeconds / days.length),
    averageSessionSeconds:
      sessionTotals.length === 0
        ? 0
        : Math.round(executionSeconds / sessionTotals.length),
    longestSessionSeconds: sessionTotals.reduce(
      (longest, seconds) => Math.max(longest, seconds),
      0,
    ),
    activeDays,
    rangeDays: days.length,
    days: days.map((date) => ({
      date,
      seconds: filteredDaySeconds.get(date) ?? 0,
    })),
    boards: [...boards.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((left, right) => left.name.localeCompare(right.name)),
    activities: [...activitySeconds.entries()]
      .map(([id, activity]) => ({ id, ...activity }))
      .sort((left, right) => right.seconds - left.seconds),
  };
}

export function allocateSessionSpans(weights: number[], duration: number) {
  if (weights.length === 0 || duration <= 0) return weights.map(() => 0);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (total <= 0) return weights.map((_, index) => (index === 0 ? duration : 0));
  const spans = weights.map((weight) => Math.floor((duration * weight) / total));
  let remainder = duration - spans.reduce((sum, span) => sum + span, 0);
  for (let index = spans.length - 1; index >= 0 && remainder > 0; index -= 1) {
    if (weights[index] > 0) {
      spans[index] += remainder;
      remainder = 0;
    }
  }
  return spans;
}

function daySecondsFromSlices(
  input: BuildActivityInput,
  rangeStart: Date,
  rangeEnd: Date,
  days: string[],
) {
  const daySeconds = new Map(days.map((day) => [day, 0]));
  for (const slice of input.slices) {
    if (slice.boardId !== input.boardId) continue;
    for (const interval of slice.intervals) {
      const started = Date.parse(interval.startedAt);
      const ended = Date.parse(interval.endedAt ?? input.now.toISOString());
      if (!Number.isFinite(started) || !Number.isFinite(ended)) continue;
      const from = Math.max(started, rangeStart.getTime());
      const to = Math.min(ended, rangeEnd.getTime());
      if (to <= from) continue;
      splitOverlap(from, to, input.timeZone, (day, amount) => {
        if (!daySeconds.has(day)) return;
        daySeconds.set(day, (daySeconds.get(day) ?? 0) + amount);
      });
    }
  }
  return daySeconds;
}

function splitOverlap(
  from: number,
  to: number,
  timeZone: string,
  add: (day: string, seconds: number) => void,
) {
  let cursor = from;
  let total = 0;
  while (cursor < to) {
    const day = zonedDayKey(new Date(cursor), timeZone);
    const next = zonedBoundary(nextDay(day), timeZone, false).getTime();
    const sliceEnd = Math.min(next, to);
    if (sliceEnd <= cursor) break;
    const seconds = Math.floor((sliceEnd - cursor) / 1000);
    if (seconds > 0) add(day, seconds);
    total += seconds;
    cursor = sliceEnd;
  }
  return total;
}

function eachDay(from: string, to: string) {
  const days: string[] = [];
  let cursor = from;
  while (cursor <= to && days.length <= MAX_RANGE_DAYS) {
    days.push(cursor);
    cursor = nextDay(cursor);
  }
  return days;
}

function nextDay(day: string) {
  const [year, month, date] = day.split("-").map(Number);
  const utc = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, date ?? 1));
  utc.setUTCDate(utc.getUTCDate() + 1);
  return utc.toISOString().slice(0, 10);
}

function zonedDayKey(instant: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

function zonedBoundary(day: string, timeZone: string, end: boolean) {
  const [year, month, date] = day.split("-").map(Number);
  const utcGuess = Date.UTC(
    year ?? 0,
    (month ?? 1) - 1,
    date ?? 1,
    end ? 23 : 0,
    end ? 59 : 0,
    end ? 59 : 0,
    end ? 999 : 0,
  );
  const offset = timeZoneOffset(new Date(utcGuess), timeZone);
  const instant = new Date(utcGuess - offset);
  const corrected = timeZoneOffset(instant, timeZone);
  return corrected === offset ? instant : new Date(utcGuess - corrected);
}

function timeZoneOffset(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");
  const hour = read("hour") === 24 ? 0 : read("hour");
  const asUtc = Date.UTC(
    read("year"),
    read("month") - 1,
    read("day"),
    hour,
    read("minute"),
    read("second"),
  );
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

interface ActivitySlice {
  sessionId: string;
  boardId: string;
  boardName: string;
  areaId: string;
  areaName: string;
  isDefaultArea: boolean;
  intervals: ExecutionInterval[];
}

interface BuildActivityInput {
  slices: ActivitySlice[];
  from: string;
  to: string;
  timeZone: string;
  boardId: string | null;
  now: Date;
}
