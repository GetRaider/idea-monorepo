import { isFocusSessionRecord } from "@/helpers/focus/focus-session.helper";

import type { FocusSessionRecord } from "@/types/focus.types";

export type FocusHeatmapLevel = 0 | 1 | 2 | 3 | 4;

export interface FocusHeatmapDay {
  dateKey: string;
  totalSeconds: number;
  level: FocusHeatmapLevel;
}

export interface FocusHeatmapWeekColumn {
  weekStartKey: string;
  days: FocusHeatmapDay[];
}

const DEFAULT_WEEK_COUNT = 18;

export function buildFocusHeatmapGrid(
  sessions: FocusSessionRecord[],
  weekCount = DEFAULT_WEEK_COUNT,
): FocusHeatmapWeekColumn[] {
  const totalsByDate = aggregateFocusSecondsByDate(sessions);
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
        });
        continue;
      }

      const dateKey = formatDateKey(date);
      const totalSeconds = totalsByDate.get(dateKey) ?? 0;
      days.push({
        dateKey,
        totalSeconds,
        level: secondsToHeatmapLevel(totalSeconds),
      });
    }

    columns.push({
      weekStartKey: formatDateKey(weekStart),
      days,
    });
  }

  return columns;
}

function aggregateFocusSecondsByDate(
  sessions: FocusSessionRecord[],
): Map<string, number> {
  const totals = new Map<string, number>();

  for (const session of sessions) {
    if (!isFocusSessionRecord(session)) continue;
    const dateKey = formatDateKey(new Date(session.endedAt));
    totals.set(
      dateKey,
      (totals.get(dateKey) ?? 0) + session.actualDurationSeconds,
    );
  }

  return totals;
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

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfLocalWeek(date: Date): Date {
  const day = date.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const start = new Date(date);
  start.setDate(date.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function focusHeatmapLevelClassName(level: FocusHeatmapLevel): string {
  switch (level) {
    case 4:
      return "bg-violet-400";
    case 3:
      return "bg-violet-500/80";
    case 2:
      return "bg-violet-600/55";
    case 1:
      return "bg-violet-700/35";
    default:
      return "bg-white/[0.06]";
  }
}
