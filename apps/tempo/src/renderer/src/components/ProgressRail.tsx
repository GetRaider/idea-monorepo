import type { CSSProperties } from "react";

import { formatDurationLabel } from "../../../helpers/analytics.helper";
import { cn } from "../lib/cn";

export function ProgressRail({
  elapsedSeconds,
  targetSeconds,
  leftLabel,
  rightLabel,
  done = false,
}: ProgressRailProps) {
  const progress =
    targetSeconds > 0 ? Math.min(1, elapsedSeconds / targetSeconds) : 0;
  const progressStyle = {
    "--rail-progress": `${progress * 100}%`,
  } as CSSProperties;

  return (
    <div className="z-[1] w-[min(440px,86vw)]">
      <div className="mb-2.5 flex justify-between text-xs tracking-[0.01em] text-tempo-muted">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
      <div className="relative h-[3px] rounded-[3px] bg-tempo-line" style={progressStyle}>
        <div
          className={cn(
            "absolute left-0 top-0 h-full w-[var(--rail-progress)] rounded-[3px] bg-tempo-accent transition-[width] duration-150 ease-linear",
            done ? "bg-tempo-live" : null,
          )}
        />
        <div className="absolute left-[var(--rail-progress)] top-1/2 h-[11px] w-[11px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-tempo-text shadow-[0_0_0_4px_var(--tempo-bg)] transition-[left] duration-150 ease-linear" />
      </div>
    </div>
  );
}

export function formatGoalLabel(totalSeconds: number): string {
  if (totalSeconds <= 0) {
    return "no goal";
  }

  const leftoverSeconds = totalSeconds % 60;
  if (leftoverSeconds === 0) {
    return `goal · ${formatDurationLabel(totalSeconds)}`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  if (minutes > 0) {
    return `goal · ${minutes}m ${leftoverSeconds}s`;
  }

  return `goal · ${leftoverSeconds}s`;
}

interface ProgressRailProps {
  elapsedSeconds: number;
  targetSeconds: number;
  leftLabel: string;
  rightLabel: string;
  done?: boolean;
}
