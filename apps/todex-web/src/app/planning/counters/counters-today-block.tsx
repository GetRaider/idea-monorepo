"use client";

import Link from "next/link";

import { useTasks } from "../tasks-provider";
import { localToday } from "./counter-helpers";
import { CounterRow } from "./counter-row";
import { useCounterList } from "./use-counters";
import { CounterWeekHeader } from "./week-header";

/** Kept visually apart from Tasks so Counters are never mistaken for them. */
export function CountersTodayBlock() {
  const {
    state: { boards },
  } = useTasks();
  const today = localToday();
  const { data, isError } = useCounterList("active", today);
  const counters = (data ?? []).filter((counter) => counter.showInToday);
  const days = counters[0]?.week;

  if (isError) {
    return (
      <p className="mb-6 text-sm text-muted-foreground">
        Could not load counters.
      </p>
    );
  }
  if (!days) return null;

  return (
    <section
      aria-labelledby="today-counters-heading"
      className="mb-6 flex shrink-0 flex-col gap-2 rounded-xl border border-dashed border-border p-2"
    >
      <CounterWeekHeader
        days={days}
        today={today}
        controls={
          <div className="flex items-baseline gap-3">
            <h2
              id="today-counters-heading"
              className="text-sm font-medium text-muted-foreground"
            >
              Counters
            </h2>
            <Link
              href="/planning/counters"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              All
            </Link>
          </div>
        }
      />
      <ul className="flex flex-col gap-2">
        {counters.map((counter) => (
          <CounterRow
            key={counter.id}
            counter={counter}
            color={
              boards.find((board) => board.id === counter.spaceId)?.color ??
              null
            }
          />
        ))}
      </ul>
    </section>
  );
}
