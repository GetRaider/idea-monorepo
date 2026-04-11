"use client";

import { cn } from "@/lib/styles/utils";
import type { UiProps } from "@/lib/styles/ui-props";

const sizeClasses = {
  sm: "gap-1.5 px-5 py-2.5 text-sm",
  md: "gap-2 px-7 py-3.5 text-base",
} as const;

const baseClass =
  "inline-flex shrink-0 items-center justify-center rounded-lg border-0 bg-[#7255c1] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#5a42a1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0";

export function PrimaryButton({
  className,
  size = "md",
  type = "button",
  ref,
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(baseClass, sizeClasses[size], className)}
      {...props}
    />
  );
}

interface PrimaryButtonProps extends Omit<UiProps<"button">, "size"> {
  size?: keyof typeof sizeClasses;
}
