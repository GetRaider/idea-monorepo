import type { FocusRecord, SavedSession } from "../shared/records.types";

export const NO_ACTIVITY_COLOR_KEY = "no-activity";

const WEEKDAY_LABELS = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
] as const;

export function formatDurationLabel(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${safeSeconds}s`;
}

export function parseDateInputValue(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (match === null) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

export function resolveAnalyticsPeriod(
  preset: AnalyticsPeriodPreset,
  referenceDate = new Date(),
  customRange: AnalyticsCustomRange | null = null,
): AnalyticsPeriod | null {
  if (preset === "today") {
    const start = startOfLocalDay(referenceDate);
    const end = endOfLocalDay(referenceDate);
    return {
      start,
      end,
      calendarDayCount: 1,
      bucketKind: "hour",
    };
  }

  if (preset === "week") {
    const start = startOfLocalWeek(referenceDate);
    const end = endOfLocalWeek(referenceDate);
    return {
      start,
      end,
      calendarDayCount: 7,
      bucketKind: "day",
    };
  }

  if (preset === "month") {
    const start = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      1,
    );
    const end = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
    return {
      start,
      end,
      calendarDayCount: end.getDate(),
      bucketKind: "day",
    };
  }

  if (customRange === null) {
    return null;
  }

  const customStart = parseDateInputValue(customRange.startDate);
  const customEnd = parseDateInputValue(customRange.endDate);
  if (customStart === null || customEnd === null) {
    return null;
  }

  const start = startOfLocalDay(customStart);
  const end = endOfLocalDay(customEnd);
  if (start > end) {
    return null;
  }

  const calendarDayCount = countInclusiveCalendarDays(start, end);
  const bucketKind =
    calendarDayCount <= 1 ? "hour" : calendarDayCount <= 31 ? "day" : "week";

  return {
    start,
    end,
    calendarDayCount,
    bucketKind,
  };
}

export function getCompletedRecords(records: FocusRecord[]): FocusRecord[] {
  return records.filter((record) => record.endedAt !== null);
}

export function sumRecordSeconds(records: FocusRecord[]): number {
  return getCompletedRecords(records).reduce(
    (total, record) => total + record.accumulatedSeconds,
    0,
  );
}

export function getAnalyticsDataset(
  records: FocusRecord[],
  period: AnalyticsPeriod | null,
  activityId: string | null,
): FocusRecord[] {
  if (period === null) {
    return [];
  }

  const inRange = getCompletedRecords(records).filter((record) =>
    isTimestampInRange(record.startedAt, period.start, period.end),
  );

  if (activityId === null || activityId === "") {
    return inRange;
  }

  return inRange.filter(
    (record) => record.kind === "backlog" && record.sessionId === activityId,
  );
}

export function buildAnalyticsMetrics(
  records: FocusRecord[],
  calendarDayCount: number,
): AnalyticsMetrics {
  const completedRecords = getCompletedRecords(records);
  const totalSeconds = sumRecordSeconds(completedRecords);
  const sessionCount = completedRecords.length;
  const longestSessionSeconds = completedRecords.reduce(
    (longest, record) => Math.max(longest, record.accumulatedSeconds),
    0,
  );
  const activeDayKeys = new Set<string>();
  for (const record of completedRecords) {
    activeDayKeys.add(formatDateKey(new Date(record.startedAt)));
  }

  return {
    totalSeconds,
    sessionCount,
    dailyAverageSeconds:
      calendarDayCount <= 0 ? 0 : totalSeconds / calendarDayCount,
    averageSessionSeconds: sessionCount === 0 ? 0 : totalSeconds / sessionCount,
    longestSessionSeconds,
    activeDayCount: activeDayKeys.size,
    calendarDayCount: Math.max(0, calendarDayCount),
  };
}

export function buildTimeByDay(
  records: FocusRecord[],
  period: AnalyticsPeriod,
): TimeByDayBucket[] {
  const buckets = createTimeByDayBuckets(period);
  const bucketByKey = new Map(
    buckets.map((bucket) => [bucket.key, bucket] as const),
  );

  for (const record of getCompletedRecords(records)) {
    const startedAt = new Date(record.startedAt);
    if (Number.isNaN(startedAt.getTime())) {
      continue;
    }

    const key = getBucketKey(startedAt, period.bucketKind);
    const bucket = bucketByKey.get(key);
    if (bucket === undefined) {
      continue;
    }

    bucket.totalSeconds += record.accumulatedSeconds;
  }

  return buckets;
}

export function buildTimeByActivity(
  records: FocusRecord[],
  sessions: SavedSession[],
): ActivityBreakdownItem[] {
  const sessionNameById = new Map(
    sessions.map((session) => [session.id, session.name]),
  );
  const sessionColorById = new Map(
    sessions.map((session) => [session.id, session.color]),
  );
  const totalsByColorKey = new Map<string, number>();

  for (const record of getCompletedRecords(records)) {
    const colorKey = getRecordColorKey(record);
    totalsByColorKey.set(
      colorKey,
      (totalsByColorKey.get(colorKey) ?? 0) + record.accumulatedSeconds,
    );
  }

  const grandTotal = [...totalsByColorKey.values()].reduce(
    (total, seconds) => total + seconds,
    0,
  );
  if (grandTotal <= 0) {
    return [];
  }

  return [...totalsByColorKey.entries()]
    .map(([colorKey, totalSeconds]) => {
      const palette = getAnalyticsPalette(colorKey, sessionColorById);
      const sessionName = sessionNameById.get(colorKey);
      return {
        colorKey,
        label:
          colorKey === NO_ACTIVITY_COLOR_KEY
            ? "No Activity"
            : (sessionName ?? "Activity"),
        hue: palette.hue,
        saturation: palette.saturation,
        totalSeconds,
        percent: Math.round((totalSeconds / grandTotal) * 100),
      };
    })
    .sort((left, right) => {
      if (left.colorKey === NO_ACTIVITY_COLOR_KEY) {
        return 1;
      }
      if (right.colorKey === NO_ACTIVITY_COLOR_KEY) {
        return -1;
      }
      return right.totalSeconds - left.totalSeconds;
    });
}

export function getRecordColorKey(record: FocusRecord): string {
  if (record.kind === "backlog" && record.sessionId !== null) {
    return record.sessionId;
  }

  return NO_ACTIVITY_COLOR_KEY;
}

export function getAnalyticsPalette(
  colorKey: string,
  sessionColorById?: ReadonlyMap<string, string>,
): AnalyticsPalette {
  if (colorKey === NO_ACTIVITY_COLOR_KEY) {
    return { hue: 258, saturation: 16 };
  }

  const sessionColor = sessionColorById?.get(colorKey);
  if (sessionColor !== undefined) {
    return hexToPalette(sessionColor);
  }

  return {
    hue: hashStringToHue(colorKey),
    saturation: 72,
  };
}

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfLocalWeek(date: Date): Date {
  const day = date.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const start = new Date(date);
  start.setDate(date.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function createTimeByDayBuckets(period: AnalyticsPeriod): TimeByDayBucket[] {
  if (period.bucketKind === "hour") {
    return createHourBuckets();
  }

  if (period.bucketKind === "week") {
    return createWeekBuckets(period.start, period.end);
  }

  return createDayBuckets(period.start, period.end, period.calendarDayCount);
}

function createHourBuckets(): TimeByDayBucket[] {
  const buckets: TimeByDayBucket[] = [];
  for (let hour = 0; hour < 24; hour += 1) {
    const label = `${String(hour).padStart(2, "0")}:00`;
    buckets.push({ key: label, label, totalSeconds: 0 });
  }
  return buckets;
}

function createDayBuckets(
  start: Date,
  end: Date,
  calendarDayCount: number,
): TimeByDayBucket[] {
  const buckets: TimeByDayBucket[] = [];
  const cursor = startOfLocalDay(start);
  const last = startOfLocalDay(end);
  const useWeekdayLabels = calendarDayCount <= 7;

  while (cursor.getTime() <= last.getTime()) {
    buckets.push({
      key: formatDateKey(cursor),
      label: useWeekdayLabels
        ? weekdayLabel(cursor)
        : formatNumericDate(cursor),
      totalSeconds: 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return buckets;
}

function createWeekBuckets(start: Date, end: Date): TimeByDayBucket[] {
  const buckets: TimeByDayBucket[] = [];
  const cursor = startOfLocalWeek(start);
  const last = startOfLocalDay(end);

  while (cursor.getTime() <= last.getTime()) {
    buckets.push({
      key: formatDateKey(cursor),
      label: formatNumericDate(cursor),
      totalSeconds: 0,
    });
    cursor.setDate(cursor.getDate() + 7);
  }

  return buckets;
}

function getBucketKey(
  startedAt: Date,
  bucketKind: AnalyticsBucketKind,
): string {
  if (bucketKind === "hour") {
    return `${String(startedAt.getHours()).padStart(2, "0")}:00`;
  }

  if (bucketKind === "week") {
    return formatDateKey(startOfLocalWeek(startedAt));
  }

  return formatDateKey(startedAt);
}

function weekdayLabel(date: Date): string {
  const day = date.getDay();
  const mondayIndex = day === 0 ? 6 : day - 1;
  return WEEKDAY_LABELS[mondayIndex] ?? "";
}

function formatNumericDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function countInclusiveCalendarDays(start: Date, end: Date): number {
  const cursor = startOfLocalDay(start);
  const last = startOfLocalDay(end);
  let count = 0;
  while (cursor.getTime() <= last.getTime()) {
    count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

function endOfLocalDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );
}

function endOfLocalWeek(date: Date): Date {
  const start = startOfLocalWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function isTimestampInRange(iso: string, start: Date, end: Date): boolean {
  const timestamp = new Date(iso);
  return timestamp >= start && timestamp <= end;
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function hashStringToHue(value: string): number {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return hash % 360;
}

function hexToPalette(hex: string): AnalyticsPalette {
  const normalizedHex = hex.replace("#", "");
  if (normalizedHex.length !== 6) {
    return { hue: hashStringToHue(hex), saturation: 72 };
  }

  const red = Number.parseInt(normalizedHex.slice(0, 2), 16) / 255;
  const green = Number.parseInt(normalizedHex.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(normalizedHex.slice(4, 6), 16) / 255;
  const maxChannel = Math.max(red, green, blue);
  const minChannel = Math.min(red, green, blue);
  const lightness = (maxChannel + minChannel) / 2;
  const delta = maxChannel - minChannel;

  if (delta === 0) {
    return { hue: 0, saturation: 0 };
  }

  const saturation =
    lightness > 0.5
      ? delta / (2 - maxChannel - minChannel)
      : delta / (maxChannel + minChannel);
  let hue = 0;

  if (maxChannel === red) {
    hue = (green - blue) / delta + (green < blue ? 6 : 0);
  } else if (maxChannel === green) {
    hue = (blue - red) / delta + 2;
  } else {
    hue = (red - green) / delta + 4;
  }

  return {
    hue: Math.round(hue * 60),
    saturation: Math.round(saturation * 100),
  };
}

export type AnalyticsPeriodPreset = "today" | "week" | "month" | "custom";

export type AnalyticsBucketKind = "hour" | "day" | "week";

export interface AnalyticsCustomRange {
  startDate: string;
  endDate: string;
}

export interface AnalyticsPeriod {
  start: Date;
  end: Date;
  calendarDayCount: number;
  bucketKind: AnalyticsBucketKind;
}

export interface AnalyticsMetrics {
  totalSeconds: number;
  sessionCount: number;
  dailyAverageSeconds: number;
  averageSessionSeconds: number;
  longestSessionSeconds: number;
  activeDayCount: number;
  calendarDayCount: number;
}

export interface TimeByDayBucket {
  key: string;
  label: string;
  totalSeconds: number;
}

export interface AnalyticsPalette {
  hue: number;
  saturation: number;
}

export interface ActivityBreakdownItem extends AnalyticsPalette {
  colorKey: string;
  label: string;
  totalSeconds: number;
  percent: number;
}
