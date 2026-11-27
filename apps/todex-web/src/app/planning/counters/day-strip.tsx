"use client";

import { useRef, useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from "@repo/ui";
import type { Counter, CounterDay, SetCounterDayBody } from "@repo/api/todex";

import { dayClickChange, dayLabel } from "./counter-helpers";
import { DayCircle } from "./day-circle";
import { SkipDialog } from "./skip-dialog";
import { useCounterActions } from "./use-counters";
import { DAY_COLUMNS } from "./week-header";

/** Seven days of one Counter: click completes, the context menu does the rest. */
export function DayStrip({ counter }: { counter: Counter }) {
  const { setDay, isPending } = useCounterActions(counter.id);
  const [skipDate, setSkipDate] = useState<string | null>(null);

  return (
    <>
      <ol className={DAY_COLUMNS} aria-label={`Days of ${counter.name}`}>
        {counter.week.map((day) => (
          <li key={day.date} className="flex justify-center">
            <DayButton
              day={day}
              isPending={isPending}
              onChange={(change) => setDay.mutate({ date: day.date, change })}
              onSkip={() => setSkipDate(day.date)}
            />
          </li>
        ))}
      </ol>
      {skipDate ? (
        <SkipDialog
          counterName={counter.name}
          date={skipDate}
          isPending={setDay.isPending}
          onClose={() => setSkipDate(null)}
          onSkip={(skipReason) =>
            setDay.mutate(
              { date: skipDate, change: { status: "skipped", skipReason } },
              { onSuccess: () => setSkipDate(null) },
            )
          }
        />
      ) : null}
    </>
  );
}

function DayButton({ day, isPending, onChange, onSkip }: DayButtonProps) {
  const skipAfterClose = useRef(false);
  const click = dayClickChange(day);
  const hasMarks = day.occurrences.some(
    (occurrence) => occurrence.source !== "system",
  );
  const action = click?.status === "empty" ? "Clear" : "Complete";

  // The skip dialog opens once the menu is gone, or the menu takes focus back.
  function openSkipAfterClose(event: Event) {
    if (!skipAfterClose.current) return;
    skipAfterClose.current = false;
    event.preventDefault();
    onSkip();
  }

  return (
    <ContextMenu>
      <Tooltip>
        <ContextMenuTrigger asChild disabled={!day.loggable}>
          <span className="flex">
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={
                  click ? `${dayLabel(day)}. ${action}` : dayLabel(day)
                }
                aria-disabled={!click || isPending}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  click ? "hover:bg-surface" : "cursor-default",
                )}
                onClick={() => {
                  if (click && !isPending) onChange(click);
                }}
              >
                <DayCircle day={day} />
              </button>
            </TooltipTrigger>
          </span>
        </ContextMenuTrigger>
        <TooltipContent>
          <p>{dayLabel(day)}</p>
          {day.loggable ? (
            <p className="text-neutral-400">
              {click
                ? `Click to ${action.toLowerCase()}`
                : "Target already covered"}
              {day.canMark ? " · Right-click to fail or skip" : null}
            </p>
          ) : null}
        </TooltipContent>
      </Tooltip>
      <ContextMenuContent onCloseAutoFocus={openSkipAfterClose}>
        <ContextMenuItem
          disabled={isPending || !day.canMark}
          onSelect={() => onChange({ status: "failed" })}
        >
          Fail
        </ContextMenuItem>
        <ContextMenuItem
          disabled={isPending || !day.canMark}
          onSelect={() => {
            skipAfterClose.current = true;
          }}
        >
          Skip…
        </ContextMenuItem>
        {hasMarks ? (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              disabled={isPending}
              onSelect={() => onChange({ status: "empty" })}
            >
              Clear
            </ContextMenuItem>
          </>
        ) : null}
      </ContextMenuContent>
    </ContextMenu>
  );
}

interface DayButtonProps {
  day: CounterDay;
  isPending: boolean;
  onChange: (change: SetCounterDayBody) => void;
  onSkip: () => void;
}
