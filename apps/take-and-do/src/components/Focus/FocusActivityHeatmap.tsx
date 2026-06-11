"use client";

import { useMemo } from "react";

import { AppTooltip } from "@/components/Tooltip/AppTooltip";
import { useFocusSessionContext } from "@/contexts/FocusSessionContext";
import {
  buildFocusHeatmapGrid,
  focusHeatmapLevelClassName,
} from "@/helpers/focus/focus-heatmap.helper";
import { formatFocusDurationLabel } from "@/helpers/focus/focus-session.helper";
import { cn } from "@/lib/styles/utils";

import type { FocusSessionRecord } from "@/types/focus.types";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export function FocusActivityHeatmap({
  embedded = false,
  weekCount = 12,
  sessionsOverride,
}: FocusActivityHeatmapProps) {
  const { sessions: contextSessions } = useFocusSessionContext();
  const sessions = sessionsOverride ?? contextSessions;
  const columns = useMemo(
    () => buildFocusHeatmapGrid(sessions, weekCount),
    [sessions, weekCount],
  );

  const cellClassName = embedded
    ? "h-2.5 w-2.5 rounded-[2px]"
    : "h-3 w-3 rounded-[3px]";
  const gapClassName = embedded ? "gap-1" : "gap-1.5";

  return (
    <div className={cn("flex flex-col", embedded ? "gap-2" : "gap-3")}>
      {embedded ? (
        <p className="m-0 text-xs font-medium text-text-secondary">HeatMap</p>
      ) : null}

      <div
        className={cn(
          embedded
            ? "rounded-lg border border-white/10 bg-[#0a0a0a] p-2.5"
            : "rounded-xl border border-white/10 bg-[#0a0a0a] p-4",
        )}
      >
        <div className={cn("flex overflow-x-auto pb-0.5", gapClassName)}>
          <div className={cn("flex shrink-0 flex-col", gapClassName, "pt-0.5")}>
            {DAY_LABELS.map((label, index) => (
              <span
                key={`${label}-${index}`}
                className={cn(
                  "flex items-center justify-center text-[9px] leading-none text-text-tertiary",
                  embedded ? "h-2.5 w-2.5" : "h-3 w-3",
                )}
              >
                {index % 2 === 0 ? label : ""}
              </span>
            ))}
          </div>

          <div className={cn("flex min-w-0", gapClassName)}>
            {columns.map((column) => (
              <div
                key={column.weekStartKey}
                className={cn("flex flex-col", gapClassName)}
              >
                {column.days.map((day) => (
                  <AppTooltip
                    key={day.dateKey}
                    content={`${day.dateKey}: ${formatFocusDurationLabel(day.totalSeconds)} focus`}
                  >
                    <span
                      className={cn(
                        "block shrink-0",
                        cellClassName,
                        focusHeatmapLevelClassName(day.level),
                      )}
                      aria-label={`${day.dateKey}: ${formatFocusDurationLabel(day.totalSeconds)} focus`}
                    />
                  </AppTooltip>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface FocusActivityHeatmapProps {
  embedded?: boolean;
  weekCount?: number;
  sessionsOverride?: FocusSessionRecord[];
}
