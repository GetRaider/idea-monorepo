"use client";

import type { ComponentProps } from "react";

import { gradientActionButtonClass } from "../../lib/animated-gradient";
import { cn } from "../../lib/cn";

const sizeClasses = {
  default: "px-4 py-2",
  comfortable: "px-5 py-2.5",
} as const;

type AIGradientButtonProps = ComponentProps<"button"> & {
  size?: keyof typeof sizeClasses;
  inactive?: boolean;
};

export function AIGradientButton({
  className,
  type = "button",
  size = "default",
  inactive,
  disabled,
  ...props
}: AIGradientButtonProps) {
  const isDisabled = disabled ?? inactive;
  return (
    <button
      type={type}
      disabled={isDisabled}
      className={cn(
        gradientActionButtonClass,
        "relative inline-flex items-center justify-center gap-1.5 overflow-hidden rounded-md border-0 text-sm font-semibold text-white transition-colors duration-200",
        "enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-60",
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}
