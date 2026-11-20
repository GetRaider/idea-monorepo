import type { ExecutionActivity, ExecutionInterval } from "@repo/api/todex";

const MAX_RANGE_DAYS = 366;

export function buildExecutionActivity(input: BuildActivityInput): ExecutionActivity {
  const days = eachDay(input.from, input.to);
  if (days.length === 0 || days.length > MAX_RANGE_DAYS) throw new Error("Invalid range");

  const rangeStart = zonedBoundary(input.from, input.timeZone, false).getTime();
  const rangeEnd = zonedBoundary(input.to, input.timeZone, true).getTime();
  const now = input.now.getTime();
  const daySeconds = new Map(days.map((day) => [day, 0]));
  const filteredDaySeconds = new Map(days.map((day) => [day, 0]));
  const sessionSeconds = new Map<string, number>();
  const activitySeconds = new Map<string, { label: string; seconds: number }>();
  const boards = new Map<string, string>();
  const bySession = new Map<string, BuildActivityInput["slices"]>();

  for (const slice of input.slices) {
    const group = bySession.get(slice.sessionId) ?? [];
    group.push(slice);
    bySession.set(slice.sessionId, group);
  }

  for (const [sessionId, slices] of bySession) {
    const primary = slices[0];
    if (!primary) continue;
    const spans = mergeSpans(
      slices.flatMap((slice) => clippedSpans(slice.intervals, rangeStart, rangeEnd, now)),
    );
    if (spans.length === 0) continue;

    boards.set(primary.spaceId, primary.spaceName);
    let uniqueSeconds = 0;
    for (const span of spans) {
      uniqueSeconds += splitOverlap(span.start, span.end, input.timeZone, (day, seconds) => {
        if (!daySeconds.has(day)) return;
        daySeconds.set(day, (daySeconds.get(day) ?? 0) + seconds);
        if (!input.spaceId || input.spaceId === primary.spaceId) {
          filteredDaySeconds.set(day, (filteredDaySeconds.get(day) ?? 0) + seconds);
        }
      });
    }
    if (uniqueSeconds === 0 || (input.spaceId && input.spaceId !== primary.spaceId)) continue;
    sessionSeconds.set(sessionId, uniqueSeconds);

    // Attribute session wall time across task areas proportionally, without
    // counting concurrent work multiple times in analytics.
    const weights = slices.map((slice) =>
      clippedSpans(slice.intervals, rangeStart, rangeEnd, now).reduce(
        (sum, span) => sum + Math.floor((span.end - span.start) / 1000),
        0,
      ),
    );
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let assigned = 0;
    slices.forEach((slice, index) => {
      const seconds = index === slices.length - 1
        ? uniqueSeconds - assigned
        : Math.floor(uniqueSeconds * (weights[index] ?? 0) / Math.max(1, totalWeight));
      assigned += seconds;
      if (seconds <= 0) return;
      const section = slice.isDefaultSection ? null : slice.sectionName;
      const id = section ? `${slice.spaceId}:${slice.sectionId}` : slice.spaceId;
      const label = section ? `${slice.spaceName} · ${section}` : slice.spaceName;
      const current = activitySeconds.get(id);
      activitySeconds.set(id, { label, seconds: (current?.seconds ?? 0) + seconds });
    });
  }

  const executionSeconds = [...filteredDaySeconds.values()].reduce(
    (total, seconds) => total + seconds,
    0,
  );
  const sessionTotals = [...sessionSeconds.values()];
  const activeDays = [...filteredDaySeconds.values()].filter((seconds) => seconds > 0).length;

  return {
    executionSeconds,
    sessionCount: sessionTotals.length,
    dailyAverageSeconds: Math.round(executionSeconds / days.length),
    averageSessionSeconds: sessionTotals.length === 0
      ? 0
      : Math.round(executionSeconds / sessionTotals.length),
    longestSessionSeconds: sessionTotals.reduce((longest, seconds) => Math.max(longest, seconds), 0),
    activeDays,
    rangeDays: days.length,
    days: days.map((date) => ({ date, seconds: filteredDaySeconds.get(date) ?? 0 })),
    spaces: [...boards.entries()].map(([id, name]) => ({ id, name }))
      .sort((left, right) => left.name.localeCompare(right.name)),
    activities: [...activitySeconds.entries()].map(([id, activity]) => ({ id, ...activity }))
      .sort((left, right) => right.seconds - left.seconds),
  };
}

function clippedSpans(intervals: ExecutionInterval[], from: number, to: number, now: number) {
  return intervals.flatMap((interval) => {
    const start = Math.max(from, Date.parse(interval.startedAt));
    const end = Math.min(to, interval.endedAt == null ? now : Date.parse(interval.endedAt));
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return [];
    return [{ start, end }];
  });
}

function mergeSpans(spans: Array<{ start: number; end: number }>) {
  const sorted = [...spans].sort((left, right) => left.start - right.start);
  const merged: Array<{ start: number; end: number }> = [];
  for (const span of sorted) {
    const previous = merged[merged.length - 1];
    if (previous && span.start <= previous.end) previous.end = Math.max(previous.end, span.end);
    else merged.push({ ...span });
  }
  return merged;
}

export function allocateSessionSpans(weights: number[], duration: number) {
  if (weights.length === 0 || duration <= 0) return weights.map(() => 0);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (total <= 0)
    return weights.map((_, index) => (index === 0 ? duration : 0));
  const spans = weights.map((weight) =>
    Math.floor((duration * weight) / total),
  );
  let remainder = duration - spans.reduce((sum, span) => sum + span, 0);
  for (let index = spans.length - 1; index >= 0 && remainder > 0; index -= 1) {
    if (weights[index] > 0) {
      spans[index] += remainder;
      remainder = 0;
    }
  }
  return spans;
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
  spaceId: string;
  spaceName: string;
  sectionId: string;
  sectionName: string;
  isDefaultSection: boolean;
  intervals: ExecutionInterval[];
}

interface BuildActivityInput {
  slices: ActivitySlice[];
  from: string;
  to: string;
  timeZone: string;
  spaceId: string | null;
  now: Date;
}
