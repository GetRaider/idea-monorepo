"use client";

import { type ReactNode } from "react";

import { cn } from "@/lib/styles/utils";
import type { UiProps } from "@/lib/styles/ui-props";

export type OptionToggleButtonSize = "default" | "compact";

const sizeClass: Record<OptionToggleButtonSize, string> = {
  default:
    "gap-2.5 px-4 py-3.5 text-sm [&_.option-toggle-icon-slot]:h-5 [&_.option-toggle-icon-slot]:w-5 [&_.option-toggle-icon-slot]:[&_img]:h-5 [&_.option-toggle-icon-slot]:[&_img]:w-5",
  compact:
    "gap-1.5 px-2 py-2 text-xs [&_.option-toggle-icon-slot]:h-3.5 [&_.option-toggle-icon-slot]:w-3.5 [&_.option-toggle-icon-slot]:[&_img]:h-3.5 [&_.option-toggle-icon-slot]:[&_img]:w-3.5",
};

type OptionToggleButtonProps = Omit<UiProps<"button">, "children"> & {
  isSelected?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
  size?: OptionToggleButtonSize;
};

export function OptionToggleButton({
  isSelected,
  icon,
  children,
  size = "default",
  className,
  type = "button",
  ref,
  ...props
}: OptionToggleButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "option-toggle flex cursor-pointer items-center justify-center rounded-lg border font-medium text-[#e0e0e0] transition-all duration-200",
        sizeClass[size],
        isSelected
          ? "border-[#7255c1] bg-[#2a2540] hover:border-[#7255c1] hover:bg-[#2a2540]"
          : "border-border-app bg-background-primary hover:border-[#3a3a3a] hover:bg-[#252525]",
        className,
      )}
      {...props}
    >
      {icon ? (
        <span className="option-toggle-icon-slot inline-flex shrink-0 items-center justify-center [&_svg]:h-full [&_svg]:w-full">
          {icon}
        </span>
      ) : null}
      {children}
    </button>
  );
}
