"use client";

import { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type CharCounterProps = HTMLAttributes<HTMLDivElement> & {
  $nearLimit: boolean;
};

export function CharCounter({
  className,
  $nearLimit,
  ...props
}: CharCounterProps) {
  return (
    <div
      className={cn(
        "-mt-4 mb-5 text-right text-xs",
        $nearLimit ? "text-red-500" : "text-text-tertiary",
        className,
      )}
      {...props}
    />
  );
}
