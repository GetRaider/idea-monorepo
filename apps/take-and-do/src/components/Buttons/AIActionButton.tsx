"use client";

import { gradientActionButtonClass } from "@/lib/styles/animated-gradient";
import { cn } from "@/lib/styles/utils";
import type { UiProps } from "@/lib/styles/ui-props";

const sizeClasses = {
  default: "px-4 py-2",
  comfortable: "px-5 py-2.5",
} as const;

export function AIActionButton({
  className,
  type = "button",
  size = "default",
  inactive,
  disabled,
  ref,
  ...props
}: AIActionButtonProps) {
  const isDisabled = disabled ?? inactive;
  return (
    <button
      ref={ref}
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

interface AIActionButtonProps extends Omit<UiProps<"button">, "size"> {
  size?: keyof typeof sizeClasses;
  inactive?: boolean;
}
