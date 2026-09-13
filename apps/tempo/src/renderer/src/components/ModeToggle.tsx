import { cn } from "../lib/cn";

import type { TimerMode } from "../../../shared/records.types";

export function ModeToggle({ mode, disabled, onChange }: ModeToggleProps) {
  return (
    <div className="z-[1] flex gap-1" role="group" aria-label="Timer mode">
      <ModeButton
        pressed={mode === "stopwatch"}
        disabled={disabled}
        onClick={() => onChange("stopwatch")}
      >
        Stopwatch
      </ModeButton>
      <ModeButton
        pressed={mode === "timer"}
        disabled={disabled}
        onClick={() => onChange("timer")}
      >
        Timer
      </ModeButton>
    </div>
  );
}

function ModeButton({
  pressed,
  disabled,
  onClick,
  children,
}: ModeButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={disabled}
      className={cn(
        "cursor-pointer rounded-[20px] border border-transparent bg-transparent px-3.5 py-1.5 text-[13px] font-medium text-tempo-faint transition-colors hover:text-tempo-muted disabled:cursor-not-allowed disabled:opacity-40",
        pressed ? "border-tempo-line bg-tempo-panel text-tempo-text" : null,
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

interface ModeToggleProps {
  mode: TimerMode;
  disabled: boolean;
  onChange: (mode: TimerMode) => void;
}

interface ModeButtonProps {
  pressed: boolean;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}
