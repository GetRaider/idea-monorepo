"use client";

import type { DayHeaderContentArg } from "@fullcalendar/core";

import { cn } from "@/lib/styles/utils";

export function PlanningCalendarDayHeaderContent({
  date,
  isToday,
}: DayHeaderContentArg) {
  const num = date.getDate();
  const wd = date.toLocaleDateString(undefined, { weekday: "short" });
  return (
    <span
      className={cn(
        "tad-day-header-inner inline-flex items-center gap-0.5 tabular-nums",
        isToday && "tad-day-header-inner--today",
      )}
    >
      <span className="font-semibold text-zinc-100">{num}</span>
      <span className="text-zinc-400">{wd}</span>
    </span>
  );
}
