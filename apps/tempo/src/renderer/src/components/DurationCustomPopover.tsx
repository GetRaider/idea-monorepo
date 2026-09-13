import { useState } from "react";

import {
  combineDurationHms,
  formatDurationHms,
  padDurationUnit,
  splitDurationHms,
} from "../../../helpers/duration-preset.helper";
import {
  TIMER_MAX_PLANNED_SECONDS,
  TIMER_MIN_PLANNED_SECONDS,
} from "../../../shared/records.types";
import { cn } from "../lib/cn";

import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

export function DurationCustomPopover({
  durationSeconds,
  selected,
  disabled,
  onApply,
}: DurationCustomPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const triggerLabel =
    selected && durationSeconds > 0 ? formatDurationHms(durationSeconds) : "Custom";

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open) {
          const parts = splitDurationHms(durationSeconds);
          setHours(parts.hours);
          setMinutes(parts.minutes);
          setSeconds(parts.seconds);
          setErrorMessage(null);
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "cursor-pointer rounded-lg border border-tempo-line bg-transparent px-[13px] py-[7px] text-[12.5px] font-medium text-tempo-muted transition-colors hover:border-tempo-line-2 hover:text-tempo-text disabled:cursor-not-allowed disabled:opacity-40",
            selected
              ? "border-tempo-accent bg-tempo-accent-wash text-tempo-text"
              : null,
          )}
        >
          {triggerLabel}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] border-solid border-tempo-accent">
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const totalSeconds = combineDurationHms(hours, minutes, seconds);
            if (
              totalSeconds < TIMER_MIN_PLANNED_SECONDS ||
              totalSeconds > TIMER_MAX_PLANNED_SECONDS
            ) {
              setErrorMessage("Enter 1–60 minutes");
              return;
            }
            onApply(totalSeconds);
            setIsOpen(false);
          }}
        >
          <div className="flex items-end justify-center gap-1 font-mono">
            <DurationUnitField
              id="custom-duration-hours"
              label="h"
              value={hours}
              max={1}
              onChange={(nextHours) => {
                setHours(nextHours);
                if (nextHours === 1) {
                  setMinutes(0);
                  setSeconds(0);
                }
                setErrorMessage(null);
              }}
            />
            <span className="pb-2 text-lg text-tempo-faint">:</span>
            <DurationUnitField
              id="custom-duration-minutes"
              label="m"
              value={minutes}
              max={hours === 1 ? 0 : 59}
              onChange={(nextMinutes) => {
                setMinutes(nextMinutes);
                setErrorMessage(null);
              }}
            />
            <span className="pb-2 text-lg text-tempo-faint">:</span>
            <DurationUnitField
              id="custom-duration-seconds"
              label="s"
              value={seconds}
              max={hours === 1 ? 0 : 59}
              onChange={(nextSeconds) => {
                setSeconds(nextSeconds);
                setErrorMessage(null);
              }}
            />
          </div>
          {errorMessage !== null ? (
            <p className="m-0 text-xs text-tempo-danger">{errorMessage}</p>
          ) : null}
          <Button type="submit" className="px-3 py-2 text-sm">
            Apply
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}

function DurationUnitField({
  id,
  label,
  value,
  max,
  onChange,
}: DurationUnitFieldProps) {
  return (
    <label className="flex flex-col items-center gap-1 text-[10px] uppercase tracking-wide text-tempo-muted">
      {label}
      <input
        id={id}
        inputMode="numeric"
        className="w-12 rounded-lg border border-tempo-line bg-tempo-panel px-1 py-2 text-center text-sm text-tempo-text"
        value={padDurationUnit(value)}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, "").slice(-2);
          const parsed = digits.length === 0 ? 0 : Number.parseInt(digits, 10);
          onChange(Math.min(max, parsed));
        }}
      />
    </label>
  );
}

interface DurationCustomPopoverProps {
  durationSeconds: number;
  selected: boolean;
  disabled: boolean;
  onApply: (seconds: number) => void;
}

interface DurationUnitFieldProps {
  id: string;
  label: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
}
