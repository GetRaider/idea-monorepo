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
export function DayStrip({
  counter,
  selectedDate,
  className = DAY_COLUMNS,
}: {
  counter: Counter;
  selectedDate?: string;
  /** Column layout; the days spread over the available width by default. */
  className?: string;
}) {
  const { setDay, isPending } = useCounterActions(counter.id);
  const [skipDate, setSkipDate] = useState<string | null>(null);

  return (
    <>
      <ol className={className} aria-label={`Days of ${counter.name}`}>
        {counter.week.map((day) => (
          <li
            key={day.date}
            className={cn(
              "flex justify-center rounded-full",
              day.date === selectedDate &&
                "bg-white/[0.14] ring-2 ring-inset ring-white/60",
            )}
          >
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
  const hint = day.loggable
    ? `Click to ${action.toLowerCase()} · Right-click to fail or skip`
    : unavailableHint(day);

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
                  "group flex size-9 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:size-11",
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
          {hint ? <p className="text-neutral-400">{hint}</p> : null}
        </TooltipContent>
      </Tooltip>
      <ContextMenuContent onCloseAutoFocus={openSkipAfterClose}>
        <ContextMenuItem
          disabled={isPending || !day.loggable}
          onSelect={() => onChange({ status: "failed" })}
        >
          Fail
        </ContextMenuItem>
        <ContextMenuItem
          disabled={isPending || !day.loggable}
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

/** Why an untouched day cannot be marked, when that is worth saying. */
function unavailableHint(day: CounterDay): string | null {
  return day.tracked && day.occurrences.length === 0 ? "Not yet" : null;
}

interface DayButtonProps {
  day: CounterDay;
  isPending: boolean;
  onChange: (change: SetCounterDayBody) => void;
  onSkip: () => void;
}
