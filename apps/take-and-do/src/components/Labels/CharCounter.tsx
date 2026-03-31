"use client";

import { HTMLAttributes } from "react";

import { cn } from "@/lib/styles/utils";

type CharCounterProps = HTMLAttributes<HTMLDivElement> & {
  isNearLimit: boolean;
};

export function CharCounter({
  className,
  isNearLimit,
  ...props
}: CharCounterProps) {
  return (
    <div
      className={cn(
        "-mt-4 mb-5 text-right text-xs",
        isNearLimit ? "text-red-500" : "text-text-tertiary",
        className,
      )}
      {...props}
    />
  );
}
