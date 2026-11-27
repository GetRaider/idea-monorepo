"use client";

import { useState } from "react";
import { Button } from "@repo/ui";
import type { Counter } from "@repo/api/todex";

import { isSkipCovered, progressLabel } from "./counter-helpers";
import { DayIndicators } from "./day-indicators";
import { SkipDialog } from "./skip-dialog";
import { useCounterActions } from "./use-counters";

/** Week indicators, progress and the logging actions for one Counter. */
export function CounterTracker({
  counter,
  showCompleteAction = false,
}: {
  counter: Counter;
  showCompleteAction?: boolean;
}) {
  const { log, remove, isPending } = useCounterActions(counter.id);
  const [skipDate, setSkipDate] = useState<string | null>(null);
  const isOpen = counter.period?.isOpen ?? false;
  const isFilled =
    counter.period != null && counter.period.completed >= counter.target;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <DayIndicators
        counter={counter}
        isPending={isPending}
        onComplete={(date) => log.mutate({ status: "completed", date })}
        onSkip={setSkipDate}
        onRemove={(occurrenceId) => remove.mutate(occurrenceId)}
      />
      <p
        className={
          isFilled
            ? "min-w-[8.5rem] text-sm font-medium tabular-nums"
            : "min-w-[8.5rem] text-sm tabular-nums text-muted-foreground"
        }
      >
        {progressLabel(counter)}
        {isFilled ? " ✓" : null}
      </p>
      {counter.status === "active" ? (
        <div className="flex gap-1">
          {showCompleteAction ? (
            <Button
              size="sm"
              variant="soft"
              disabled={!isOpen || isPending}
              aria-label={`Add completed to ${counter.name}`}
              onClick={() => log.mutate({ status: "completed" })}
            >
              + Completed
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="ghost"
            disabled={!isOpen || isPending || isSkipCovered(counter)}
            aria-label={`Skip ${counter.name} today`}
            onClick={() => setSkipDate(counter.today)}
          >
            Skip
          </Button>
        </div>
      ) : null}
      {skipDate ? (
        <SkipDialog
          counterName={counter.name}
          date={skipDate}
          isPending={log.isPending}
          onClose={() => setSkipDate(null)}
          onSkip={(skipReason) =>
            log.mutate(
              { status: "skipped", date: skipDate, skipReason },
              { onSuccess: () => setSkipDate(null) },
            )
          }
        />
      ) : null}
    </div>
  );
}
