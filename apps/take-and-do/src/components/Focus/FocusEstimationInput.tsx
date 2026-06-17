"use client";

import { useCallback, useEffect, useState } from "react";

import { Input } from "@/components/Input";
import {
  formatEstimationInput,
  parseEstimationInput,
} from "@/helpers/focus/focus-session.helper";
import { cn } from "@/lib/styles/utils";

export function FocusEstimationInput({
  durationMinutes,
  disabled = false,
  onChange,
  className,
  size = "default",
}: FocusEstimationInputProps) {
  const [inputValue, setInputValue] = useState(
    durationMinutes !== null ? formatEstimationInput(durationMinutes) : "",
  );

  useEffect(() => {
    if (durationMinutes !== null) {
      setInputValue(formatEstimationInput(durationMinutes));
      return;
    }
    setInputValue("");
  }, [durationMinutes]);

  const commitValue = useCallback(
    (rawValue: string) => {
      const parsed = parseEstimationInput(rawValue);
      if (parsed === null) {
        onChange(null);
        return;
      }
      onChange(parsed);
      setInputValue(formatEstimationInput(parsed));
    },
    [onChange],
  );

  const isLarge = size === "large";

  return (
    <div
      className={cn("flex flex-col", isLarge ? "gap-2" : "gap-1", className)}
    >
      <label
        htmlFor="focus-estimation"
        className={cn(
          "m-0 font-medium text-text-secondary",
          isLarge ? "text-sm" : "text-xs",
        )}
      >
        Estimation
      </label>
      <Input
        id="focus-estimation"
        value={inputValue}
        disabled={disabled}
        placeholder="25m"
        onChange={(event) => {
          setInputValue(event.target.value);
          const parsed = parseEstimationInput(event.target.value);
          if (parsed !== null) onChange(parsed);
        }}
        onBlur={() => commitValue(inputValue)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commitValue(inputValue);
          }
        }}
        className={cn(
          "w-full tabular-nums",
          isLarge ? "min-w-[9rem] py-3 text-base" : "max-w-[7rem]",
        )}
      />
    </div>
  );
}

type FocusEstimationInputSize = "default" | "large";

interface FocusEstimationInputProps {
  durationMinutes: number | null;
  disabled?: boolean;
  onChange: (minutes: number | null) => void;
  className?: string;
  size?: FocusEstimationInputSize;
}
