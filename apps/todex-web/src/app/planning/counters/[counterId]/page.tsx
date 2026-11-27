"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button, Spinner, Switch } from "@repo/ui";
import { formatCounterRule } from "@repo/api/todex";
import type { CounterDetail } from "@repo/api/todex";

import { CounterFormDialog } from "../counter-form-dialog";
import { formatLocalDate } from "../counter-helpers";
import { CounterHistory } from "../counter-history";
import { CounterLinks } from "../counter-links";
import { CounterStats } from "../counter-row";
import { DayStrip } from "../day-strip";
import { useWeekWindow } from "../use-week-window";
import { useCounter, useCounterActions } from "../use-counters";
import { CounterWeekHeader, WeekControls } from "../week-header";

export default function CounterPage() {
  const { counterId } = useParams<{ counterId: string }>();
  const week = useWeekWindow();
  const { data, isPending, isError } = useCounter(counterId, week.until);

  if (isPending) return <Spinner className="flex-1" />;
  if (isError) {
    return (
      <p className="px-6 py-3 text-sm text-muted-foreground">
        Could not load this counter.{" "}
        <Link href="/planning/counters" className="underline">
          Back to counters
        </Link>
      </p>
    );
  }
  return <CounterCard counter={data} week={week} />;
}

function CounterCard({
  counter,
  week,
}: {
  counter: CounterDetail;
  week: ReturnType<typeof useWeekWindow>;
}) {
  const { update, setStatus, isPending } = useCounterActions(counter.id);
  const [isEditing, setIsEditing] = useState(false);
  const isArchived = counter.status === "archived";

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-8 overflow-auto px-6 pb-6 pt-3">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="flex min-w-0 items-center gap-3 text-2xl font-semibold tracking-tight">
            <Link
              href="/planning/counters"
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              Counters
            </Link>
            <span className="shrink-0 text-muted-foreground">›</span>
            <span className="truncate">{counter.name}</span>
          </h1>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={isPending}
              onClick={() =>
                setStatus.mutate(isArchived ? "active" : "archived")
              }
            >
              {isArchived ? "Restore" : "Archive"}
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {formatCounterRule(counter)} · {counter.timeZone}
          {isArchived ? " · Archived" : null}
        </p>
        {counter.pendingChange ? (
          <p className="text-sm text-amber-400">
            {counter.pendingChange.effectiveDate
              ? `From ${formatLocalDate(counter.pendingChange.effectiveDate)}: `
              : "After restore: "}
            {formatCounterRule(counter.pendingChange)}
          </p>
        ) : null}
        <label className="flex w-fit items-center gap-3 text-sm">
          <Switch
            checked={counter.showInToday}
            disabled={update.isPending}
            onCheckedChange={(showInToday) => update.mutate({ showInToday })}
            aria-label="Show in Today"
          />
          Show in Today
        </label>
      </header>
      <div className="flex flex-col gap-2">
        <CounterWeekHeader
          days={counter.week}
          today={week.today}
          controls={
            <WeekControls
              weeksBack={week.weeksBack}
              onChange={week.setWeeksBack}
            />
          }
        />
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white/[0.02] px-4 py-3">
          <div className="min-w-0 flex-1">
            <CounterStats counter={counter} />
          </div>
          <DayStrip counter={counter} />
        </div>
      </div>
      <CounterLinks counter={counter} />
      <CounterHistory counter={counter} />
      {isEditing ? (
        <CounterFormDialog
          counter={counter}
          isPending={update.isPending}
          onClose={() => setIsEditing(false)}
          onSubmit={(values) =>
            update.mutate(values, { onSuccess: () => setIsEditing(false) })
          }
        />
      ) : null}
    </section>
  );
}
