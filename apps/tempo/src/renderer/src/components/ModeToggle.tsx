import { ToggleButton, ToggleRow } from "./ModeToggle.styles";

import type { TimerMode } from "../../../shared/records.types";

export function ModeToggle({ mode, disabled, onChange }: ModeToggleProps) {
  return (
    <ToggleRow>
      <ToggleButton
        type="button"
        $active={mode === "stopwatch"}
        disabled={disabled}
        onClick={() => onChange("stopwatch")}
      >
        Stopwatch
      </ToggleButton>
      <ToggleButton
        type="button"
        $active={mode === "timer"}
        disabled={disabled}
        onClick={() => onChange("timer")}
      >
        Timer
      </ToggleButton>
    </ToggleRow>
  );
}

interface ModeToggleProps {
  mode: TimerMode;
  disabled: boolean;
  onChange: (mode: TimerMode) => void;
}
