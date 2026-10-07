export function wallTimeToUtc(input: {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  second?: number;
  timeZone: string;
}): Date {
  const hour = input.hour ?? 0;
  const minute = input.minute ?? 0;
  const second = input.second ?? 0;
  let utc = Date.UTC(input.year, input.month - 1, input.day, hour, minute, second);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const offset = timeZoneOffsetMs(new Date(utc), input.timeZone);
    const next =
      Date.UTC(input.year, input.month - 1, input.day, hour, minute, second) -
      offset;
    if (next === utc) break;
    utc = next;
  }
  return new Date(utc);
}

export function formatWallParts(
  instant: Date,
  timeZone: string,
): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  let hour = Number(read("hour"));
  if (hour === 24) hour = 0;
  return {
    year: Number(read("year")),
    month: Number(read("month")),
    day: Number(read("day")),
    hour,
    minute: Number(read("minute")),
    second: Number(read("second")),
  };
}

export function formatWallDate(instant: Date, timeZone: string): string {
  const parts = formatWallParts(instant, timeZone);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

export function formatWallDateTime(instant: Date, timeZone: string): string {
  const parts = formatWallParts(instant, timeZone);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)}`;
}

export function addDaysToDate(date: string, days: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return date;
  const next = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + days),
  );
  return next.toISOString().slice(0, 10);
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function timeZoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = formatWallParts(instant, timeZone);
  const wallAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return wallAsUtc - instant.getTime();
}
