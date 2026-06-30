"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type CalendarPanelMonthHeaderActionsProps = {
  monthTitle: string;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
};

export function CalendarPanelMonthHeaderActions({
  monthTitle,
  onPreviousMonth,
  onNextMonth,
}: CalendarPanelMonthHeaderActionsProps) {
  return (
    <div className="flex shrink-0 items-center justify-end gap-1.5">
      <button
        type="button"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-0 bg-transparent text-zinc-400 hover:bg-white/[0.06] hover:text-text-primary"
        aria-label="Previous month"
        onClick={onPreviousMonth}
      >
        <ChevronLeft size={14} aria-hidden />
      </button>
      <span className="min-w-0 max-w-[5.5rem] truncate text-[10px] font-medium leading-tight text-zinc-400">
        {monthTitle}
      </span>
      <button
        type="button"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-0 bg-transparent text-zinc-400 hover:bg-white/[0.06] hover:text-text-primary"
        aria-label="Next month"
        onClick={onNextMonth}
      >
        <ChevronRight size={14} aria-hidden />
      </button>
    </div>
  );
}
