import {
  isFocusSessionRecord,
  resolveFocusSessionColor,
  startOfLocalDay,
  startOfLocalWeek,
} from "@/helpers/focus/focus-session.helper";

import type { FocusSessionRecord } from "@/types/focus.types";

export type FocusHeatmapLevel = 0 | 1 | 2 | 3 | 4;

export interface FocusHeatmapDaySegment {
  color: string;
  seconds: number;
}

export interface FocusHeatmapDay {
  dateKey: string;
  totalSeconds: number;
  level: FocusHeatmapLevel;
  segments: FocusHeatmapDaySegment[];
}

export interface FocusHeatmapWeekColumn {
  weekStartKey: string;
  days: FocusHeatmapDay[];
}

const DEFAULT_WEEK_COUNT = 18;
export const FOCUS_ANALYTICS_WEEK_COUNT = 14;

export const FOCUS_HEATMAP_CELL_BORDER_CLASS = "border border-white/20";
export const FOCUS_HEATMAP_EMPTY_CELL_CLASS = "bg-white/[0.12]";

export function buildFocusHeatmapGrid(
  sessions: FocusSessionRecord[],
  weekCount = DEFAULT_WEEK_COUNT,
  sessionNameFilter: string | null = null,
): FocusHeatmapWeekColumn[] {
  const today = startOfLocalDay(new Date());
  const currentWeekStart = startOfLocalWeek(today);
  const columns: FocusHeatmapWeekColumn[] = [];

  for (let weekOffset = weekCount - 1; weekOffset >= 0; weekOffset -= 1) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(currentWeekStart.getDate() - weekOffset * 7);

    const days: FocusHeatmapDay[] = [];
    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + dayIndex);
      if (date > today) {
        days.push({
          dateKey: formatDateKey(date),
          totalSeconds: 0,
          level: 0,
          segments: [],
        });
        continue;
      }

      const dateKey = formatDateKey(date);
      const segments = buildDaySegments(sessions, dateKey, sessionNameFilter);
      const totalSeconds = segments.reduce(
        (total, segment) => total + segment.seconds,
        0,
      );
      days.push({
        dateKey,
        totalSeconds,
        level: secondsToHeatmapLevel(totalSeconds),
        segments,
      });
    }

    columns.push({
      weekStartKey: formatDateKey(weekStart),
      days,
    });
  }

  return columns;
}

export function focusHeatmapSegmentOpacity(level: FocusHeatmapLevel): number {
  switch (level) {
    case 4:
      return 1;
    case 3:
      return 0.82;
    case 2:
      return 0.64;
    case 1:
      return 0.46;
    default:
      return 0;
  }
}

function buildDaySegments(
  sessions: FocusSessionRecord[],
  dateKey: string,
  sessionNameFilter: string | null,
): FocusHeatmapDaySegment[] {
  const totalsByColor = new Map<string, number>();

  for (const session of sessions) {
    if (!isFocusSessionRecord(session)) continue;
    const sessionName = session.name.trim();
    if (sessionNameFilter && sessionName !== sessionNameFilter) continue;
    if (formatDateKey(new Date(session.endedAt)) !== dateKey) continue;

    const color = resolveFocusSessionColor(session);
    totalsByColor.set(
      color,
      (totalsByColor.get(color) ?? 0) + session.actualDurationSeconds,
    );
  }

  return [...totalsByColor.entries()]
    .map(([color, seconds]) => ({ color, seconds }))
    .sort((left, right) => right.seconds - left.seconds);
}

function secondsToHeatmapLevel(totalSeconds: number): FocusHeatmapLevel {
  if (totalSeconds <= 0) return 0;
  if (totalSeconds < 15 * 60) return 1;
  if (totalSeconds < 30 * 60) return 2;
  if (totalSeconds < 60 * 60) return 3;
  return 4;
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
