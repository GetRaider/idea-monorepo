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
      aria-disabled={disabled}
      aria-labelledby={ariaLabelledBy}
      disabled={disabled}
      onClick={() => {
        if (!disabled) onCheckedChange(!checked);
      }}
      className={cn(
        "relative shrink-0 rounded-full border-0 transition-[color,background-color,box-shadow,filter] duration-200",
        "outline-none focus:outline-none active:outline-none",
        "focus:ring-0 focus:ring-offset-0",
        "focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:focus-visible:ring-0 disabled:focus-visible:ring-offset-0",
        dimensions.track,
        disabled
          ? [
              "cursor-not-allowed",
              checked
                ? "bg-brand-primary/35 ring-1 ring-inset ring-white/15"
                : "bg-[#2c2c32] ring-1 ring-inset ring-border-app",
            ]
          : [
              "cursor-pointer",
              checked
                ? [
                    "bg-brand-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] hover:brightness-110 active:brightness-95",
                    "ring-1 ring-inset ring-white/30",
                  ]
                : [
                    "bg-[#4b4b55] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-[#56565f] active:bg-[#42424a]",
                    "ring-1 ring-inset ring-white/35",
                  ],
            ],
        className,
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute rounded-full transition-[left,background-color,box-shadow] duration-200",
          dimensions.thumb,
          dimensions.thumbTop,
          checked ? dimensions.thumbChecked : dimensions.thumbUnchecked,
          disabled
            ? checked
              ? "bg-[#b0b0b8] shadow-none"
              : "bg-[#6b6b74] shadow-none"
            : checked
              ? "bg-white shadow-sm"
              : "bg-white shadow-[0_1px_3px_rgba(0,0,0,0.35)]",
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
