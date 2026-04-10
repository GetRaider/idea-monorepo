"use client";

import { cn } from "@/lib/styles/utils";
import type { UiProps } from "@/lib/styles/ui-props";

export function SpinnerRing({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "h-10 w-10 shrink-0 animate-spin rounded-full border-4 border-[#2a2a2a] border-t-indigo-500",
        className,
      )}
      {...props}
    />
  );
}

export function Spinner({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("flex items-center justify-center p-10", className)}
      {...props}
    >
      <SpinnerRing />
    </div>
  );
}
