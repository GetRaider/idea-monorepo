"use client";

import { cn } from "@/lib/styles/utils";

export function TasksMainWorkArea({
  children,
  contentClassName,
}: {
  children: React.ReactNode;
  contentClassName?: string;
}) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        className={cn(
          "take-and-do-calendar calendar-surface flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl",
        )}
      >
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain",
            contentClassName,
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
