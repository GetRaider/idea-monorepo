"use client";

import type { ReactNode } from "react";
import { Button, cn } from "@repo/ui";

import { ChevronIcon } from "@components/icons";

import { formatLocalDate, weekdayName } from "./counter-helpers";
import { CheckMark, ProgressRing } from "./day-circle";

/** Shared by the date header and every row so the columns line up. */
export const DAY_COLUMNS =
  "grid w-[15.75rem] shrink-0 grid-cols-7 xl:w-[19.25rem]";

export function CounterWeekHeader({
  days,
  today,
  ringShare,
  controls,
}: {
  days: readonly { date: string }[];
  today: string;
  ringShare?: (column: number) => number | null;
  controls?: ReactNode;
}) {
  return (
    // The side border matches the rows' so the columns stay aligned.
    <div className="flex items-end justify-between gap-3 border-x border-transparent px-4">
      <div className="min-w-0 flex-1">{controls}</div>
      <ol className={DAY_COLUMNS}>
        {days.map((day, column) => (
          <li
            key={day.date}
            aria-label={formatLocalDate(day.date)}
            className={cn(
              "flex flex-col items-center gap-1 text-xs",
              day.date === today
                ? "font-semibold text-foreground"
                : "text-muted-foreground",
            )}
          >
            <span>{weekdayName(day.date)}</span>
            <span className="tabular-nums">{Number(day.date.slice(8))}</span>
            {ringShare ? <DayRing share={ringShare(column)} /> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function WeekControls({
  weeksBack,
  onChange,
}: {
  weeksBack: number;
  onChange: (weeksBack: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-muted-foreground"
        aria-label="Earlier days"
        onClick={() => onChange(weeksBack + 1)}
      >
        <ChevronIcon size={14} className="rotate-180" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-muted-foreground"
        aria-label="Later days"
        disabled={weeksBack === 0}
        onClick={() => onChange(weeksBack - 1)}
      >
        <ChevronIcon size={14} />
      </Button>
      {weeksBack > 0 ? (
        <Button size="sm" variant="ghost" onClick={() => onChange(0)}>
          Today
        </Button>
      ) : null}
    </div>
  );
}

function DayRing({ share }: { share: number | null }) {
  if (share === 1) {
    return (
      <span
        role="img"
        aria-label="All done"
        className="flex size-5 items-center justify-center rounded-full bg-foreground text-background"
      >
        <CheckMark />
      </span>
    );
  }
  return (
    <span
      role="img"
      aria-label={
        share === null ? "Nothing tracked" : `${Math.round(share * 100)}% done`
      }
      className={cn(share === null && "opacity-40")}
    >
      <ProgressRing share={share ?? 0} />
    </span>
  );
}
