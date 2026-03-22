"use client";

import { cn } from "@/lib/utils";
import type { UiProps } from "@/lib/ui-props";

export function Input({
  className,
  maxLength = 64,
  ref,
  ...props
}: UiProps<"input">) {
  return (
    <input
      ref={ref}
      maxLength={maxLength}
      className={cn(
        "w-full rounded-md border border-input-border bg-input-bg px-3 py-2.5 text-sm text-white outline-none transition-[border-color] duration-200 placeholder:text-text-tertiary focus:border-accent-primary",
        className,
      )}
      {...props}
    />
  );
}
