"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Spinner, cn } from "@repo/ui";
import type { Counter, CounterStatus } from "@repo/api/todex";

import { NewButton } from "@components/new-button";

import { CounterFormDialog } from "./counter-form-dialog";
import { dayShare, formatLocalDate } from "./counter-helpers";
import { CounterSections } from "./counter-sections";
import { SectionNameDialog } from "./section-name-dialog";
import { useWeekWindow } from "./use-week-window";
import {
  useCounterActions,
  useCounterList,
  useCounterSections,
  useCreateCounter,
  useSectionActions,
} from "./use-counters";
import { BackToToday, CounterWeekHeader, WeekArrow } from "./week-header";

export default function CountersPage() {
  const router = useRouter();
  const [status, setStatus] = useState<CounterStatus>("active");
  const [isCreating, setIsCreating] = useState(false);
  const { weeksBack, setWeeksBack, today, until } = useWeekWindow();
  // A column of the week, so the choice stays put while browsing weeks.
  const [selectedColumn, setSelectedColumn] = useState<number | null>(null);
  const { data, isPending, isError } = useCounterList(status, until);
  const sectionsQuery = useCounterSections();
  const sectionActions = useSectionActions();
  const [isAddingSection, setIsAddingSection] = useState(false);
  const createCounter = useCreateCounter((counterId) => {
    setIsCreating(false);
    router.push(`/planning/counters/${counterId}`);
  });

  function renderList() {
    if (isPending || sectionsQuery.isPending) {
      return <Spinner className="flex-1" />;
    }
    if (isError || sectionsQuery.isError) {
      return (
        <p className="text-sm text-muted-foreground">
          Could not load counters.
        </p>
      );
    }
    const sections = sectionsQuery.data;
    const days = data[0]?.week;
    // Empty sections are still worth showing on the active list.
    if (!days && (status === "archived" || sections.length === 0)) {
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
          sections={sections}
          renderAction={(counter) => <RestoreButton counter={counter} />}
        />
      );
    }
    const selectedDate =
      selectedColumn === null ? undefined : days?.[selectedColumn]?.date;
    const hasScheduled =
      selectedColumn === null ||
      data.some((counter) => counter.week[selectedColumn]?.tracked);
    return (
      <div className="flex flex-col gap-4">
        {days ? (
          <CounterWeekHeader
            days={days}
            today={today}
            ringShare={(column) => dayShare(data, column)}
            selectedColumn={selectedColumn}
            onSelect={(column) =>
              setSelectedColumn(column === selectedColumn ? null : column)
            }
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
            className="rounded-2xl border-border bg-white/[0.02] py-3"
          />
        ) : null}
        {selectedDate ? (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <p aria-live="polite" className="text-muted-foreground">
              {hasScheduled ? "Scheduled on" : "Nothing is scheduled on"}{" "}
              {formatLocalDate(selectedDate)}
            </p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedColumn(null)}
            >
              Show all
            </Button>
          </div>
        ) : null}
        <CounterSections
          counters={data}
          sections={sections}
          selectedColumn={days ? selectedColumn : null}
        />
      </div>
    );
  }

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto px-6 pb-6 pt-3">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Counters</h1>
        <div className="flex flex-wrap items-center gap-4">
          {status === "active" ? (
            <BackToToday
              weeksBack={weeksBack}
              onChange={(next) => {
                setWeeksBack(next);
                setSelectedColumn(null);
              }}
            />
          ) : null}
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
          {status === "active" ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAddingSection(true)}
            >
              New section
            </Button>
          ) : null}
          <NewButton onClick={() => setIsCreating(true)} />
        </div>
      </div>
      {renderList()}
      {isAddingSection ? (
        <SectionNameDialog
          isPending={sectionActions.create.isPending}
          onClose={() => setIsAddingSection(false)}
          onSubmit={(name) =>
            sectionActions.create.mutate(name, {
              onSuccess: () => setIsAddingSection(false),
            })
          }
        />
      ) : null}
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
