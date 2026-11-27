import type { ReactNode } from "react";
import type { Counter } from "@repo/api/todex";

import { BoltIcon, FlameIcon } from "@components/icons";

import { countLabel, formatLocalDate } from "./counter-helpers";

/** The headline numbers of one Counter, beside its days. */
export function CounterStatTiles({ counter }: { counter: Counter }) {
  const { today, nextDate } = counter.progress;
  return (
    <dl className="grid grid-cols-3 gap-2">
      <Tile label="Total" icon={<BoltIcon size={12} />}>
        {countLabel(counter.stats.totalDays, "day")}
      </Tile>
      <Tile label="Streak" icon={<FlameIcon size={12} />}>
        {countLabel(counter.stats.streak, "day")}
      </Tile>
      {today ? (
        <Tile label="Today">
          {today.completed} / {today.target}
        </Tile>
      ) : (
        <Tile label="Next">{nextDate ? formatLocalDate(nextDate) : "—"}</Tile>
      )}
    </dl>
  );
}

function Tile({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white/[0.04] px-3 py-2">
      <dt className="flex items-center gap-1 text-xs text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 truncate text-base font-semibold tabular-nums">
        {children}
      </dd>
    </div>
  );
}
