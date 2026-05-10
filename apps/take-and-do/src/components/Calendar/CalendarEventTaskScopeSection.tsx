"use client";

import { cn } from "@/lib/styles/utils";

import { CalendarTaskScopeSelector } from "./CalendarTaskScopeSelector";

export function CalendarEventTaskScopeSection({
  value,
  onChange,
  disabled = false,
  className,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-white/[0.03] p-4",
        className,
      )}
    >
      <div className="mb-2 text-sm font-semibold text-white">Task Scope</div>
      <CalendarTaskScopeSelector
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}
