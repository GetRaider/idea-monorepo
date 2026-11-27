"use client";

import Link from "next/link";
import { addDaysToDate } from "@repo/api/todex";

import { useTasks } from "../tasks-provider";
import { localToday } from "./counter-helpers";
import { CounterRow } from "./counter-row";
import { useCounterList } from "./use-counters";
import { COMPACT_DAY_COLUMNS, DayDates } from "./week-header";

/**
 * The Counters scheduled for one day, in Today or Tomorrow. Kept visually apart
 * from Tasks so the two are never mistaken for each other.
 */
export function CountersScheduleBlock({
  schedule,
}: {
  schedule: "today" | "tomorrow";
}) {
  const {
    state: { boards },
  } = useTasks();
  const today = localToday();
  const date = schedule === "today" ? today : addDaysToDate(today, 1);
  const { data, isError } = useCounterList("active", date);
  // The strip ends on the block's own day.
  const counters = (data ?? []).filter(
    (counter) => counter.showInToday && counter.week[6]?.tracked,
  );
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
      aria-labelledby="schedule-counters-heading"
      className="mb-6 flex shrink-0 flex-col gap-2 rounded-2xl border border-dashed border-border p-2"
    >
      <div className="flex items-baseline justify-between gap-3 px-3 pt-1">
        <h2
          id="schedule-counters-heading"
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
      {/* The border and padding match the rows', which keeps dates aligned. */}
      <div className="flex justify-end border border-transparent px-3">
        <DayDates days={days} today={today} className={COMPACT_DAY_COLUMNS} />
      </div>
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
