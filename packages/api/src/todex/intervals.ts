import type { ExecutionInterval } from "./execution.ts";

export function sumIntervalSeconds(
  intervals: ExecutionInterval[],
  now: Date,
) {
  let total = 0;
  for (const interval of intervals) {
    const start = Date.parse(interval.startedAt);
    const end =
      interval.endedAt == null ? now.getTime() : Date.parse(interval.endedAt);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) continue;
    total += Math.floor((end - start) / 1000);
  }
  return total;
}

export function closeOpenIntervals(
  intervals: ExecutionInterval[],
  endedAt: Date,
): ExecutionInterval[] {
  const iso = endedAt.toISOString();
  return intervals.map((interval) =>
    interval.endedAt == null ? { ...interval, endedAt: iso } : interval,
  );
}

export function hasOpenInterval(intervals: ExecutionInterval[]) {
  return intervals.some((interval) => interval.endedAt == null);
}
