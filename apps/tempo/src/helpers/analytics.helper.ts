import type { FocusRecord, SavedSession } from "../shared/records.types";

export type HeatmapLevel = 0 | 1 | 2 | 3 | 4;

export interface HeatmapDay {
  dateKey: string;
  totalSeconds: number;
  level: HeatmapLevel;
  colorKey: string | null;
}

export interface HeatmapWeekColumn {
  weekStartKey: string;
  days: HeatmapDay[];
}

export interface AnalyticsPalette {
  hue: number;
  saturation: number;
}

export interface AnalyticsLegendItem extends AnalyticsPalette {
  colorKey: string;
  label: string;
  totalSeconds: number;
}

export const ANALYTICS_WEEK_COUNT = 40;
export const UNKNOWN_ANALYTICS_COLOR_KEY = "unknown";

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

export function getCompletedRecords(records: FocusRecord[]): FocusRecord[] {
  return records.filter((record) => record.endedAt !== null);
}

export function sumRecordSeconds(records: FocusRecord[]): number {
  return getCompletedRecords(records).reduce(
    (total, record) => total + record.accumulatedSeconds,
    0,
  );
}

export function getDailyFocusSeconds(
  records: FocusRecord[],
  referenceDate = new Date(),
): number {
  const dayStart = startOfLocalDay(referenceDate);
  const dayEnd = endOfLocalDay(referenceDate);
  return sumRecordSeconds(
    getCompletedRecords(records).filter((record) =>
      isTimestampInRange(record.startedAt, dayStart, dayEnd),
    ),
  );
}

export function getWeeklyFocusSeconds(
  records: FocusRecord[],
  referenceDate = new Date(),
): number {
  const weekStart = startOfLocalWeek(referenceDate);
  const weekEnd = endOfLocalWeek(referenceDate);
  return sumRecordSeconds(
    getCompletedRecords(records).filter((record) =>
      isTimestampInRange(record.startedAt, weekStart, weekEnd),
    ),
  );
}

export function getMonthlyFocusSeconds(
  records: FocusRecord[],
  referenceDate = new Date(),
): number {
  const monthStart = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    1,
  );
  const monthEnd = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );
  return sumRecordSeconds(
    getCompletedRecords(records).filter((record) =>
      isTimestampInRange(record.startedAt, monthStart, monthEnd),
    ),
  );
}

export function getTotalFocusSeconds(records: FocusRecord[]): number {
  return sumRecordSeconds(records);
}

export function getRecordColorKey(record: FocusRecord): string {
  if (record.kind === "backlog" && record.sessionId !== null) {
    return record.sessionId;
  }

  return UNKNOWN_ANALYTICS_COLOR_KEY;
}

export function getAnalyticsPalette(
  colorKey: string,
  sessionColorById?: ReadonlyMap<string, string>,
): AnalyticsPalette {
  if (colorKey === UNKNOWN_ANALYTICS_COLOR_KEY) {
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

export function buildAnalyticsLegend(
  records: FocusRecord[],
  sessions: SavedSession[],
): AnalyticsLegendItem[] {
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

  return [...totalsByColorKey.entries()]
    .map(([colorKey, totalSeconds]) => {
      const palette = getAnalyticsPalette(colorKey, sessionColorById);
      const sessionName = sessionNameById.get(colorKey);
      return {
        colorKey,
        label:
          colorKey === UNKNOWN_ANALYTICS_COLOR_KEY
            ? "Unknown"
            : (sessionName ?? "Regular session"),
        hue: palette.hue,
        saturation: palette.saturation,
        totalSeconds,
      };
    })
    .sort((left, right) => {
      if (left.colorKey === UNKNOWN_ANALYTICS_COLOR_KEY) {
        return 1;
      }
      if (right.colorKey === UNKNOWN_ANALYTICS_COLOR_KEY) {
        return -1;
      }
      return right.totalSeconds - left.totalSeconds;
    });
}

export function buildHeatmapGrid(
  records: FocusRecord[],
  weekCount = ANALYTICS_WEEK_COUNT,
  referenceDate = new Date(),
): HeatmapWeekColumn[] {
  const today = startOfLocalDay(referenceDate);
  const currentWeekStart = startOfLocalWeek(today);
  const completedRecords = getCompletedRecords(records);
  const columns: HeatmapWeekColumn[] = [];

  for (let weekOffset = weekCount - 1; weekOffset >= 0; weekOffset -= 1) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(currentWeekStart.getDate() - weekOffset * 7);
    const days: HeatmapDay[] = [];

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + dayIndex);
      const dateKey = formatDateKey(date);
      if (date > today) {
        days.push({ dateKey, totalSeconds: 0, level: 0, colorKey: null });
        continue;
      }

      const dayStart = startOfLocalDay(date);
      const dayEnd = endOfLocalDay(date);
      const dayRecords = completedRecords.filter((record) =>
        isTimestampInRange(record.startedAt, dayStart, dayEnd),
      );
      const totalSeconds = sumRecordSeconds(dayRecords);
      days.push({
        dateKey,
        totalSeconds,
        level: secondsToHeatmapLevel(totalSeconds),
        colorKey: getDominantColorKey(dayRecords),
      });
    }

    columns.push({
      weekStartKey: formatDateKey(weekStart),
      days,
    });
  }

  return columns;
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

function secondsToHeatmapLevel(totalSeconds: number): HeatmapLevel {
  if (totalSeconds <= 0) {
    return 0;
  }
  if (totalSeconds < 15 * 60) {
    return 1;
  }
  if (totalSeconds < 30 * 60) {
    return 2;
  }
  if (totalSeconds < 60 * 60) {
    return 3;
  }
  return 4;
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDominantColorKey(records: FocusRecord[]): string | null {
  const totalsByColorKey = new Map<string, number>();

  for (const record of getCompletedRecords(records)) {
    const colorKey = getRecordColorKey(record);
    totalsByColorKey.set(
      colorKey,
      (totalsByColorKey.get(colorKey) ?? 0) + record.accumulatedSeconds,
    );
  }

  let dominantColorKey: string | null = null;
  let dominantSeconds = 0;
  for (const [colorKey, totalSeconds] of totalsByColorKey) {
    if (totalSeconds > dominantSeconds) {
      dominantColorKey = colorKey;
      dominantSeconds = totalSeconds;
    }
  }

  return dominantColorKey;
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
