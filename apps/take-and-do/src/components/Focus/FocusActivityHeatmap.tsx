"use client";

import { useMemo } from "react";

import { AppTooltip } from "@/components/Tooltip/AppTooltip";
import { useFocusSessionContext } from "@/contexts/FocusSessionContext";
import {
  FOCUS_HEATMAP_CELL_BORDER_CLASS,
  FOCUS_HEATMAP_EMPTY_CELL_CLASS,
  buildFocusHeatmapGrid,
  focusHeatmapSegmentOpacity,
} from "@/helpers/focus/focus-heatmap.helper";
import { formatFocusDurationLabel } from "@/helpers/focus/focus-session.helper";
import { cn } from "@/lib/styles/utils";

import type { FocusHeatmapDay } from "@/helpers/focus/focus-heatmap.helper";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export function FocusActivityHeatmap({
  embedded = false,
  size = "default",
  weekCount = 12,
  sessionNameFilter = null,
}: FocusActivityHeatmapProps) {
  const { sessions } = useFocusSessionContext();
  const columns = useMemo(
    () => buildFocusHeatmapGrid(sessions, weekCount, sessionNameFilter),
    [sessions, sessionNameFilter, weekCount],
  );

  const isAnalytics = size === "analytics";
  const cellClassName = isAnalytics
    ? "h-3 w-3 rounded-[2px]"
    : embedded
      ? "h-2.5 w-2.5 rounded-[2px]"
      : "h-3 w-3 rounded-[3px]";
  const gapClassName = isAnalytics
    ? "gap-[3px]"
    : embedded
      ? "gap-[3px]"
      : "gap-1";
  const labelCellClassName = isAnalytics
    ? "h-3 w-3"
    : embedded
      ? "h-2.5 w-2.5"
      : "h-3 w-3";
  const columnSplitIndex = isAnalytics ? Math.floor(columns.length / 2) : null;

  return (
    <div
      className={cn(
        "flex flex-col",
        isAnalytics ? "h-full gap-2" : embedded ? "gap-1.5" : "gap-3",
      )}
    >
      {embedded && !isAnalytics ? (
        <p className="m-0 text-xs font-medium text-text-secondary">HeatMap</p>
      ) : null}

      <div
        className={cn(
          "rounded-lg border border-white/10 bg-white/[0.03]",
          isAnalytics ? "flex h-full items-center p-4" : "w-fit",
          embedded && !isAnalytics ? "p-2" : !isAnalytics ? "p-4" : null,
        )}
      >
        <div className={cn("flex w-fit", gapClassName)}>
          <div className={cn("flex shrink-0 flex-col", gapClassName, "pt-px")}>
            {DAY_LABELS.map((label, index) => (
              <span
                key={`${label}-${index}`}
                className={cn(
                  "flex items-center justify-center leading-none text-text-tertiary",
                  isAnalytics ? "text-[9px]" : "text-[8px]",
                  labelCellClassName,
                )}
              >
                {index % 2 === 0 ? label : ""}
              </span>
            ))}
          </div>

          <div className={cn("flex w-fit", gapClassName)}>
            {columns.map((column, columnIndex) => (
              <div key={column.weekStartKey} className="flex">
                {columnSplitIndex !== null &&
                columnIndex === columnSplitIndex ? (
                  <div className="w-2 shrink-0" aria-hidden />
                ) : null}
                <div className={cn("flex flex-col", gapClassName)}>
                  {column.days.map((day) => (
                    <AppTooltip
                      key={day.dateKey}
                      content={`${day.dateKey}: ${formatFocusDurationLabel(day.totalSeconds)} focus`}
                    >
                      <FocusHeatmapCell
                        day={day}
                        cellClassName={cellClassName}
                      />
                    </AppTooltip>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FocusHeatmapCell({
  day,
  cellClassName,
}: {
  day: FocusHeatmapDay;
  cellClassName: string;
}) {
  const baseClassName = cn(
    "block shrink-0",
    cellClassName,
    FOCUS_HEATMAP_CELL_BORDER_CLASS,
  );

  if (day.totalSeconds <= 0 || day.segments.length === 0) {
    return (
      <span
        className={cn(baseClassName, FOCUS_HEATMAP_EMPTY_CELL_CLASS)}
        aria-label={`${day.dateKey}: no focus`}
      />
    );
  }

  const opacity = focusHeatmapSegmentOpacity(day.level);

  if (day.segments.length === 1) {
    const segment = day.segments[0];
    return (
      <span
        className={baseClassName}
        style={{ backgroundColor: segment.color, opacity }}
        aria-label={`${day.dateKey}: ${formatFocusDurationLabel(day.totalSeconds)} focus`}
      />
    );
  }

  return (
    <span
      className={cn(
        "flex shrink-0 overflow-hidden",
        cellClassName,
        FOCUS_HEATMAP_CELL_BORDER_CLASS,
      )}
      aria-label={`${day.dateKey}: ${formatFocusDurationLabel(day.totalSeconds)} focus`}
    >
      {day.segments.map((segment) => (
        <span
          key={`${day.dateKey}-${segment.color}`}
          style={{
            flex: segment.seconds,
            backgroundColor: segment.color,
            opacity,
          }}
        />
      ))}
    </span>
  );
}

type FocusHeatmapSize = "default" | "analytics";

interface FocusActivityHeatmapProps {
  embedded?: boolean;
  size?: FocusHeatmapSize;
  weekCount?: number;
  sessionNameFilter?: string | null;
}
