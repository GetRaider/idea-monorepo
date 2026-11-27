"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@repo/ui";
import { formatCounterRule } from "@repo/api/todex";
import type { Counter } from "@repo/api/todex";

import { BoltIcon, FlameIcon } from "@components/icons";

import { countLabel, progressLabel } from "./counter-helpers";
import { DayStrip } from "./day-strip";
import { DayTrack } from "./week-header";

export function CounterRow({
  counter,
  color,
  action,
}: {
  counter: Counter;
  /** The space color; space-free Counters stay neutral. */
  color: string | null;
  /** Shown instead of the day strip, for archived Counters. */
  action?: ReactNode;
}) {
  return (
    <li className="flex flex-col gap-2 rounded-2xl border border-border bg-white/[0.02] px-3 py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span
            aria-hidden="true"
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
              color
                ? "bg-[var(--counter-color)] text-black"
                : "bg-surface text-foreground",
            )}
            style={color ? { ["--counter-color" as string]: color } : undefined}
          >
            {counter.name.charAt(0).toUpperCase()}
          </span>
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
            <Link
              href={`/planning/counters/${counter.id}`}
              className="max-w-full truncate text-sm font-medium hover:underline"
            >
              {counter.name}
            </Link>
            <p className="text-xs text-muted-foreground">
              {formatCounterRule(counter)}
            </p>
          </div>
        </div>
        <CounterStats counter={counter} />
        {action}
      </div>
      {action ? null : (
        <DayTrack>
          <DayStrip counter={counter} />
        </DayTrack>
      )}
    </li>
  );
}

function CounterStats({ counter }: { counter: Counter }) {
  return (
    <p className="flex flex-wrap items-center gap-x-3 text-xs tabular-nums text-muted-foreground">
      <span className="flex items-center gap-1" title="Total completed days">
        <BoltIcon size={12} aria-label="Total" />
        {countLabel(counter.stats.totalDays, "day")}
      </span>
      <span className="flex items-center gap-1" title="Current streak">
        <FlameIcon size={12} aria-label="Streak" />
        {countLabel(counter.stats.streak, "day")}
      </span>
      <span>{progressLabel(counter)}</span>
    </p>
  );
}
