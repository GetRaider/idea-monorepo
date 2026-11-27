"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Spinner, cn } from "@repo/ui";
import type { Counter, CounterStatus } from "@repo/api/todex";

import { NewButton } from "@components/new-button";

import { CounterFormDialog } from "./counter-form-dialog";
import { CounterRow } from "./counter-row";
import {
  useCounterActions,
  useCounterList,
  useCreateCounter,
} from "./use-counters";

export default function CountersPage() {
  const router = useRouter();
  const [status, setStatus] = useState<CounterStatus>("active");
  const [isCreating, setIsCreating] = useState(false);
  const { data, isPending, isError } = useCounterList(status);
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
    if (data.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          {status === "active"
            ? "No counters yet. Add one to track how regularly you do something."
            : "No archived counters."}
        </p>
      );
    }
    return (
      <ul className="divide-y divide-border rounded-xl border border-border">
        {data.map((counter) => (
          <CounterRow
            key={counter.id}
            counter={counter}
            action={
              status === "archived" ? (
                <RestoreButton counter={counter} />
              ) : undefined
            }
          />
        ))}
      </ul>
    );
  }

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto px-6 pb-6 pt-3">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Counters</h1>
        <NewButton onClick={() => setIsCreating(true)} />
      </div>
      <div className="mb-4 flex gap-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.status}
            type="button"
            aria-pressed={status === tab.status}
            className={cn(
              "rounded-md px-3 py-2 text-sm",
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
