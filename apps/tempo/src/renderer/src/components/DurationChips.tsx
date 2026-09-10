import { cn } from "../lib/cn";

import type { TimerMode } from "../../../shared/records.types";

export const STOPWATCH_DURATION_CHIPS = [10, 30, 50] as const;
export const TIMER_DURATION_CHIPS = [15, 25, 45] as const;

export function DurationChips({
  mode,
  durationMinutes,
  disabled,
  onChange,
}: DurationChipsProps) {
  const chips =
    mode === "timer" ? TIMER_DURATION_CHIPS : STOPWATCH_DURATION_CHIPS;

  return (
    <div className="z-[1] flex gap-1.5">
      {chips.map((minutes) => (
        <button
          key={minutes}
          type="button"
          disabled={disabled}
          className={cn(
            "rounded-lg border border-tempo-line bg-transparent px-[13px] py-[7px] text-[12.5px] font-medium text-tempo-muted transition-colors hover:border-tempo-line-2 hover:text-tempo-text disabled:opacity-40",
            durationMinutes === minutes
              ? "border-tempo-accent bg-tempo-accent-wash text-tempo-text"
              : null,
          )}
          onClick={() => onChange(minutes)}
        >
          {minutes}m
        </button>
      ))}
    </div>
  );
}

interface DurationChipsProps {
  mode: TimerMode;
  durationMinutes: number;
  disabled: boolean;
  onChange: (minutes: number) => void;
}
