"use client";

import { gradientActionButtonClass } from "@/lib/styles/animated-gradient";
import { cn } from "@/lib/styles/utils";
import type { UiProps } from "@/lib/styles/ui-props";

const sizeClasses = {
  /** Dense controls for dashboard module headers (Productivity / Timeline). */
  compact: "min-h-8 px-3 py-1.5 text-xs leading-none",
  default: "min-h-10 px-5 py-2.5 text-sm leading-none",
  comfortable: "min-h-11 px-6 py-3 text-sm leading-none",
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
        "relative inline-flex items-center justify-center gap-1 overflow-hidden rounded-md border-0 font-semibold text-text-primary transition-colors duration-200",
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
