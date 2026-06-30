"use client";

import { cn } from "@/lib/styles/utils";

import {
  CAL_PANEL_BODY_GUTTER,
  WEEK_LETTERS,
} from "./calendar-panel.constants";
import {
  isoWeekNumber,
  sameDay,
  startOfDay,
} from "./calendar-panel-month.helpers";

type CalendarPanelMonthBodyProps = {
  rows: { date: Date; inMonth: boolean }[][];
  selectedDay: Date;
  onSelectDay: (day: Date) => void;
  onPickCalendarDay: (day: Date) => void;
};

export function CalendarPanelMonthBody({
  rows,
  selectedDay,
  onSelectDay,
  onPickCalendarDay,
}: CalendarPanelMonthBodyProps) {
  return (
    <div className={CAL_PANEL_BODY_GUTTER}>
      <div className="flex max-w-[268px] gap-0 overflow-hidden rounded-lg border border-white/[0.08] bg-black/20">
        <div className="flex w-6 shrink-0 flex-col border-r border-white/[0.06] bg-white/[0.03] py-1">
          <div className="h-6 shrink-0" aria-hidden />
          {rows.map((week, weekIndex) => (
            <div
              key={weekIndex}
              className="flex h-7 items-center justify-center text-[10px] font-medium tabular-nums text-zinc-500"
            >
              {isoWeekNumber(week[0].date)}
            </div>
          ))}
        </div>
        <div className="min-w-0 flex-1 py-1 pr-1">
          <div className="grid grid-cols-7 gap-0 px-1">
            {WEEK_LETTERS.map((letter, index) => (
              <div
                key={`${letter}-${index}`}
                className="flex h-6 items-center justify-center text-[10px] font-semibold text-zinc-500"
              >
                {letter}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0 px-1">
            {rows.flatMap((week) =>
              week.map(({ date, inMonth }) => {
                const selected = sameDay(date, selectedDay);
                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    className={cn(
                      "flex h-7 items-center justify-center rounded-md text-[11px] font-medium tabular-nums transition-colors",
                      !inMonth && "text-zinc-600",
                      inMonth &&
                        !selected &&
                        "text-zinc-200 hover:bg-white/[0.08]",
                      selected &&
                        "bg-zinc-600 text-text-primary shadow-sm hover:bg-zinc-500",
                    )}
                    onClick={() => {
                      const day = startOfDay(date);
                      onSelectDay(day);
                      onPickCalendarDay(day);
                    }}
                  >
                    {date.getDate()}
                  </button>
                );
              }),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
