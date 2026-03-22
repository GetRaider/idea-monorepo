"use client";

import { cn } from "@/lib/utils";
import type { UiProps } from "@/lib/ui-props";

export function LoadingStackContainer({
  className,
  ref,
  ...props
}: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col items-center justify-center gap-4 p-10",
        className,
      )}
      {...props}
    />
  );
}

export function LoadingStackCaption({
  className,
  ref,
  ...props
}: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("text-center text-sm text-slate-400", className)}
      {...props}
    />
  );
}
