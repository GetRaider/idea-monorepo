"use client";

import Link from "next/link";

import { CounterRow } from "./counter-row";
import { useCounterList } from "./use-counters";

/** Kept visually apart from Tasks so Counters are never mistaken for them. */
export function CountersTodayBlock() {
  const { data, isError } = useCounterList("active");
  const counters = (data ?? []).filter((counter) => counter.showInToday);

  if (isError) {
    return (
      <p className="mb-6 text-sm text-muted-foreground">
        Could not load counters.
      </p>
    );
  }
  if (counters.length === 0) return null;

  return (
    <section
      aria-labelledby="today-counters-heading"
      className="mb-6 shrink-0 rounded-xl border border-dashed border-border bg-white/[0.02]"
    >
      <div className="flex items-center justify-between gap-3 px-4 pt-3">
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
          All counters
        </Link>
      </div>
      <ul className="divide-y divide-border">
        {counters.map((counter) => (
          <CounterRow key={counter.id} counter={counter} showCompleteAction />
        ))}
      </ul>
    </section>
  );
}
