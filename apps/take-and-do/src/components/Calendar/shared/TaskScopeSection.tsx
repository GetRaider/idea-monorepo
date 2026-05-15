"use client";

import { cn } from "@/lib/styles/utils";

import { CalendarTaskScopeSelector } from "./TaskScopeSelector";

interface CalendarEventTaskScopeSectionProps {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  className?: string;
}

export function CalendarEventTaskScopeSection({
  value,
  onChange,
  disabled = false,
  className,
}: CalendarEventTaskScopeSectionProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-white/[0.03] p-4",
        className,
      )}
    >
      <div className="mb-3 text-sm font-semibold text-white">Task scope</div>
      <CalendarTaskScopeSelector
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}
