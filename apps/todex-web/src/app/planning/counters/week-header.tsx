"use client";

import type { ReactNode } from "react";
import { Button, cn } from "@repo/ui";

import { ChevronIcon } from "@components/icons";

import { formatLocalDate, weekdayName } from "./counter-helpers";
import { CheckMark, ProgressRing } from "./day-circle";

/**
 * The date header and every Counter row share these, so the day columns line up:
 * days take the wider left side, details the right.
 */
export const COUNTER_LINE = "flex flex-wrap items-center gap-x-4 gap-y-2";
export const DAYS_AREA = "min-w-0 flex-[5_1_22rem]";
export const DETAILS_AREA = "min-w-0 flex-[3_1_12rem]";
export const DAY_COLUMNS = "grid min-w-0 flex-1 grid-cols-7";

/** Seven day columns between two narrow slots for the week arrows. */
export function DayTrack({
  before,
  after,
  children,
}: {
  before?: ReactNode;
  after?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex w-8 shrink-0 justify-center">{before}</div>
      {children}
      <div className="flex w-8 shrink-0 justify-center">{after}</div>
    </div>
  );
}

export function CounterWeekHeader({
  days,
  today,
  ringShare,
  before,
  after,
  aside,
}: {
  days: readonly { date: string }[];
  today: string;
  ringShare?: (column: number) => number | null;
  before?: ReactNode;
  after?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    // The side border and padding match the rows', which keeps columns aligned.
    <div className={cn(COUNTER_LINE, "border-x border-transparent px-3")}>
      <div className={DAYS_AREA}>
        <DayTrack before={before} after={after}>
          <ol className={DAY_COLUMNS}>
            {days.map((day, column) => (
              <li
                key={day.date}
                aria-label={formatLocalDate(day.date)}
                className="flex flex-col items-center gap-1 text-xs text-muted-foreground"
              >
                <span>{weekdayName(day.date)}</span>
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full tabular-nums",
                    day.date === today &&
                      "bg-foreground font-semibold text-background",
                  )}
                >
                  {Number(day.date.slice(8))}
                </span>
                {ringShare ? <DayRing share={ringShare(column)} /> : null}
              </li>
            ))}
          </ol>
        </DayTrack>
      </div>
      <div className={cn(DETAILS_AREA, "flex justify-end")}>{aside}</div>
    </div>
  );
}

export function WeekArrow({
  direction,
  weeksBack,
  onChange,
}: {
  direction: "earlier" | "later";
  weeksBack: number;
  onChange: (weeksBack: number) => void;
}) {
  const isEarlier = direction === "earlier";
  return (
    <Button
      size="icon"
      variant="ghost"
      className="h-8 w-8 text-muted-foreground"
      aria-label={isEarlier ? "Earlier days" : "Later days"}
      disabled={!isEarlier && weeksBack === 0}
      onClick={() => onChange(weeksBack + (isEarlier ? 1 : -1))}
    >
      <ChevronIcon size={16} className={cn(isEarlier && "rotate-180")} />
    </Button>
  );
}

/** Offered only while an earlier week is on screen. */
export function BackToToday({
  weeksBack,
  onChange,
}: {
  weeksBack: number;
  onChange: (weeksBack: number) => void;
}) {
  if (weeksBack === 0) return null;
  return (
    <Button size="sm" variant="ghost" onClick={() => onChange(0)}>
      Back to today
    </Button>
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
        share === null
          ? "Nothing scheduled"
          : `${Math.round(share * 100)}% done`
      }
      className={cn("flex", share === null && "opacity-40")}
    >
      <ProgressRing share={share ?? 0} />
    </span>
  );
}
