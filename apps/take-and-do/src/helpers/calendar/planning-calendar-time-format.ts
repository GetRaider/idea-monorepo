import type { CalendarEventType } from "@/types/calendar.types";

export function isPlanningCalendarEventKind(
  value: unknown,
): value is CalendarEventType {
  return value === "timeBlock" || value === "common" || value === "task";
}

export function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function formatNowHm(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** Matches slot-axis time style (12h compact, same as pill). */
export function formatGridClock(d: Date, use24h: boolean) {
  if (use24h) return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  const h24 = d.getHours();
  const m = pad2(d.getMinutes());
  const h12 = h24 % 12 || 12;
  const ap = h24 >= 12 ? "pm" : "am";
  return `${h12}:${m}${ap}`;
}

/** Same window as “start only” time subtitle — ~15m timed blocks are one shallow row in the grid. */
export const SHORT_TIMED_ONE_LINE_MS = 15 * 60 * 1000 + 250;

export function formatEventTimeSubtitle(
  start: Date,
  end: Date | null,
  use24h: boolean,
  durMs: number,
) {
  if (!end || Number.isNaN(end.getTime())) return "";
  const onlyStart = durMs > 0 && durMs <= SHORT_TIMED_ONE_LINE_MS;
  if (onlyStart) return formatGridClock(start, use24h);
  return `${formatGridClock(start, use24h)}–${formatGridClock(end, use24h)}`;
}
