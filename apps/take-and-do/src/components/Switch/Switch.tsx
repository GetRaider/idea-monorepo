"use client";

import { cn } from "@/lib/utils";

const SIZE_STYLES = {
  sm: {
    track: "h-5 w-10 min-w-[2.5rem]",
    thumb: "h-4 w-4",
    thumbTop: "top-0.5",
    thumbChecked: "left-[22px]",
    thumbUnchecked: "left-[2px]",
  },
  md: {
    track: "h-7 w-12 min-w-[3rem]",
    thumb: "h-6 w-6",
    thumbTop: "top-0.5",
    thumbChecked: "left-[26px]",
    thumbUnchecked: "left-[2px]",
  },
  lg: {
    track: "h-9 w-16 min-w-[4rem]",
    thumb: "h-7 w-7",
    thumbTop: "top-0.5",
    thumbChecked: "left-[34px]",
    thumbUnchecked: "left-[2px]",
  },
} as const;

export function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  size = "md",
  id,
  "aria-labelledby": ariaLabelledBy,
  className,
}: SwitchProps) {
  const dimensions = SIZE_STYLES[size];

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={ariaLabelledBy}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative shrink-0 rounded-full border-0 transition-colors duration-200",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
        "disabled:opacity-50",
        dimensions.track,
        checked ? "bg-brand-primary" : "bg-[#6b6b6b]",
        className,
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute rounded-full bg-[#e0e0e0] shadow transition-[left] duration-200",
          dimensions.thumb,
          dimensions.thumbTop,
          checked ? dimensions.thumbChecked : dimensions.thumbUnchecked,
        )}
      />
    </button>
  );
}

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  id?: string;
  "aria-labelledby"?: string;
  className?: string;
}
