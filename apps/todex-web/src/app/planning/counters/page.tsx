"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Spinner, cn } from "@repo/ui";
import type { Counter, CounterStatus } from "@repo/api/todex";

import { NewButton } from "@components/new-button";

import { CounterFormDialog } from "./counter-form-dialog";
import { dayShare } from "./counter-helpers";
import { CounterSections } from "./counter-sections";
import { useWeekWindow } from "./use-week-window";
import {
  useCounterActions,
  useCounterList,
  useCreateCounter,
} from "./use-counters";
import { BackToToday, CounterWeekHeader, WeekArrow } from "./week-header";

export default function CountersPage() {
  const router = useRouter();
  const [status, setStatus] = useState<CounterStatus>("active");
  const [isCreating, setIsCreating] = useState(false);
  const { weeksBack, setWeeksBack, today, until } = useWeekWindow();
  const { data, isPending, isError } = useCounterList(status, until);
  const createCounter = useCreateCounter((counterId) => {
    setIsCreating(false);
    router.push(`/planning/counters/${counterId}`);
  });

  function renderList() {
    if (isPending) return <Spinner className="flex-1" />;
    if (isError) {
      return (
        <p className="text-sm text-muted-foreground">
          Could not load counters.
        </p>
      );
    }
    const days = data[0]?.week;
    if (!days) {
      return (
        <p className="text-sm text-muted-foreground">
          {status === "active"
            ? "No counters yet. Add one to track how regularly you do something."
            : "No archived counters."}
        </p>
      );
    }
    if (status === "archived") {
      return (
        <CounterSections
          counters={data}
          renderAction={(counter) => <RestoreButton counter={counter} />}
        />
      );
    }
    return (
      <div className="flex flex-col gap-4">
        <CounterWeekHeader
          days={days}
          today={today}
          ringShare={(column) => dayShare(data, column)}
          before={
            <WeekArrow
              direction="earlier"
              weeksBack={weeksBack}
              onChange={setWeeksBack}
            />
          }
          after={
            <WeekArrow
              direction="later"
              weeksBack={weeksBack}
              onChange={setWeeksBack}
            />
          }
          aside={<BackToToday weeksBack={weeksBack} onChange={setWeeksBack} />}
          className="rounded-2xl border-border bg-white/[0.02] py-3"
        />
        <CounterSections counters={data} />
      </div>
    );
  }

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto px-6 pb-6 pt-3">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Counters</h1>
        <div className="flex items-center gap-4">
          <div role="group" aria-label="Counter status" className="flex gap-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.status}
                type="button"
                aria-pressed={status === tab.status}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm",
                  status === tab.status
                    ? "bg-surface text-foreground"
                    : "text-muted-foreground hover:bg-surface hover:text-foreground",
                )}
                onClick={() => setStatus(tab.status)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <NewButton onClick={() => setIsCreating(true)} />
        </div>
      </div>
      {renderList()}
      {isCreating ? (
        <CounterFormDialog
          isPending={createCounter.isPending}
          onClose={() => setIsCreating(false)}
          onSubmit={(values) =>
            createCounter.mutate({
              ...values,
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            })
          }
        />
      ) : null}
    </section>
  );
}

function RestoreButton({ counter }: { counter: Counter }) {
  const { setStatus, isPending } = useCounterActions(counter.id);
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={() => setStatus.mutate("active")}
    >
      Restore
    </Button>
  );
}

const STATUS_TABS = [
  { status: "active", label: "Active" },
  { status: "archived", label: "Archived" },
] as const;
