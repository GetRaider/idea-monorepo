"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { formatCounterRule } from "@repo/api/todex";
import type { Counter } from "@repo/api/todex";

import { CounterTracker } from "./counter-tracker";

export function CounterRow({
  counter,
  showCompleteAction = false,
  action,
}: {
  counter: Counter;
  showCompleteAction?: boolean;
  action?: ReactNode;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
      <div className="min-w-[12rem] flex-1">
        <Link
          href={`/planning/counters/${counter.id}`}
          className="block truncate text-sm font-medium hover:underline"
        >
          {counter.name}
        </Link>
        <p className="text-xs text-muted-foreground">
          {formatCounterRule(counter)}
        </p>
      </div>
      {action ?? (
        <CounterTracker
          counter={counter}
          showCompleteAction={showCompleteAction}
        />
      )}
    </li>
  );
}
