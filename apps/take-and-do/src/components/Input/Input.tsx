"use client";

import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type InputProps = ComponentProps<"input">;

export function Input({
  className,
  maxLength = 64,
  ref,
  ...props
}: InputProps) {
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
