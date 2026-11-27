"use client";

import type { ReactNode } from "react";
import { Button, cn } from "@repo/ui";

import { ChevronIcon } from "@components/icons";

import { formatLocalDate, weekdayName } from "./counter-helpers";
import { CheckMark, ProgressRing } from "./day-circle";

export const DAY_COLUMNS = "grid min-w-0 flex-1 grid-cols-7";
/** Seven columns only as wide as their circles, as a Counter row shows them. */
export const COMPACT_DAY_COLUMNS =
  "grid w-[15.75rem] shrink-0 grid-cols-7 sm:w-[19.25rem]";

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
  selectedColumn,
  onSelect,
  before,
  after,
  className,
}: {
  days: readonly { date: string }[];
  today: string;
  ringShare?: (column: number) => number | null;
  selectedColumn?: number | null;
  /** Makes each date a button that picks that day. */
  onSelect?: (column: number) => void;
  before?: ReactNode;
  after?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border border-transparent px-3", className)}>
      <DayTrack before={before} after={after}>
        <ol className={DAY_COLUMNS}>
          {days.map((day, column) => {
            const content = (
              <>
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
              </>
            );
            return (
              <li
                key={day.date}
                aria-label={onSelect ? undefined : formatLocalDate(day.date)}
                className="flex justify-center text-xs text-muted-foreground"
              >
                {onSelect ? (
                  <button
                    type="button"
                    aria-label={formatLocalDate(day.date)}
                    aria-pressed={selectedColumn === column}
                    className={cn(
                      "flex w-full max-w-16 flex-col items-center gap-1 rounded-xl py-1 hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selectedColumn === column &&
                        "bg-white/[0.14] text-foreground hover:bg-white/[0.14]",
                    )}
                    onClick={() => onSelect(column)}
                  >
                    {content}
                  </button>
                ) : (
                  <span className="flex flex-col items-center gap-1">
                    {content}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </DayTrack>
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
