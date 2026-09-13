import {
  DURATION_PRESET_MINUTES,
  formatDurationChipLabel,
  isPresetDurationSeconds,
} from "../../../helpers/duration-preset.helper";
import { cn } from "../lib/cn";

import { DurationCustomPopover } from "./DurationCustomPopover";

export function DurationChips({
  durationSeconds,
  disabled,
  onChange,
}: DurationChipsProps) {
  const isCustomSelected =
    durationSeconds > 0 && !isPresetDurationSeconds(durationSeconds);

  return (
    <div className="z-[1] flex flex-wrap items-center justify-center gap-1.5">
      {DURATION_PRESET_MINUTES.map((minutes) => (
        <button
          key={minutes}
          type="button"
          disabled={disabled}
          className={cn(
            "cursor-pointer rounded-lg border border-tempo-line bg-transparent px-[13px] py-[7px] text-[12.5px] font-medium text-tempo-muted transition-colors hover:border-tempo-line-2 hover:text-tempo-text disabled:cursor-not-allowed disabled:opacity-40",
            durationSeconds === minutes * 60
              ? "border-tempo-accent bg-tempo-accent-wash text-tempo-text"
              : null,
          )}
          onClick={() => onChange(minutes * 60)}
        >
          {formatDurationChipLabel(minutes)}
        </button>
      ))}
      <DurationCustomPopover
        durationSeconds={durationSeconds}
        selected={isCustomSelected}
        disabled={disabled}
        onApply={onChange}
      />
    </div>
  );
}

interface DurationChipsProps {
  durationSeconds: number;
  disabled: boolean;
  onChange: (seconds: number) => void;
}
