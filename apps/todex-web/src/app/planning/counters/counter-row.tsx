"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@repo/ui";
import { formatCounterRule } from "@repo/api/todex";
import type { Counter } from "@repo/api/todex";

import { BoltIcon, FlameIcon } from "@components/icons";

import { countLabel } from "./counter-helpers";
import { DayStrip } from "./day-strip";
import { COMPACT_DAY_COLUMNS } from "./week-header";

export function CounterRow({
  counter,
  color,
  action,
}: {
  counter: Counter;
  /** The space color; space-free Counters stay neutral. */
  color: string | null;
  /** Replaces the day strip, for archived Counters. */
  action?: ReactNode;
}) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-border bg-white/[0.02] px-3 py-3">
      <div className="flex min-w-0 flex-[1_1_12rem] items-center gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
            color
              ? "bg-[var(--counter-color)] text-black"
              : "bg-surface text-foreground",
          )}
          style={color ? { ["--counter-color" as string]: color } : undefined}
        >
          {counter.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <Link
            href={`/planning/counters/${counter.id}`}
            className="block truncate text-sm font-medium hover:underline"
            title={formatCounterRule(counter)}
          >
            {counter.name}
          </Link>
          <CounterStats counter={counter} />
        </div>
      </div>
      <div className="ml-auto">
        {action ?? (
          <DayStrip counter={counter} className={COMPACT_DAY_COLUMNS} />
        )}
      </div>
    </li>
  );
}

function CounterStats({ counter }: { counter: Counter }) {
  return (
    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs tabular-nums text-muted-foreground">
      <span className="flex items-center gap-1" title="Total completed days">
        <BoltIcon size={12} aria-label="Total" />
        {countLabel(counter.stats.totalDays, "day")}
      </span>
      <span className="flex items-center gap-1" title="Current streak">
        <FlameIcon size={12} aria-label="Streak" />
        {countLabel(counter.stats.streak, "day")}
      </span>
    </p>
  );
}
