"use client";

import { Button } from "@repo/ui";
import type { CounterDetail, CounterOccurrence } from "@repo/api/todex";

import { CloseIcon } from "@components/icons";

import { CollapsibleSection } from "./collapsible-section";
import { formatLocalDate } from "./counter-helpers";
import { useCounterActions } from "./use-counters";

export function CounterHistory({ counter }: { counter: CounterDetail }) {
  const { remove } = useCounterActions(counter.id);

  return (
    <CollapsibleSection title="History" count={counter.history.length}>
      {counter.history.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing logged yet.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {counter.history.map((occurrence) => (
            <li
              key={occurrence.id}
              className="flex items-center gap-3 px-4 py-2 text-sm"
            >
              <span className="w-28 shrink-0 tabular-nums text-muted-foreground">
                {formatLocalDate(occurrence.date)}
              </span>
              <span className={STATUS_STYLE[occurrence.status]}>
                {STATUS_LABEL[occurrence.status]}
              </span>
              <span className="min-w-0 flex-1 truncate text-muted-foreground">
                {occurrenceNote(occurrence)}
              </span>
              {occurrence.deletable ? (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground"
                  aria-label={`Remove ${STATUS_LABEL[occurrence.status]} entry of ${formatLocalDate(occurrence.date)}`}
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(occurrence.id)}
                >
                  <CloseIcon size={14} />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </CollapsibleSection>
  );
}

function occurrenceNote(occurrence: CounterOccurrence): string {
  if (occurrence.skipReason) return occurrence.skipReason;
  if (occurrence.source === "task") {
    return `Task: ${occurrence.taskSummary ?? "no longer linked"}`;
  }
  if (occurrence.source === "system") return "Not done";
  return "Marked by hand";
}

const STATUS_LABEL: Record<CounterOccurrence["status"], string> = {
  completed: "Completed",
  skipped: "Skipped",
  failed: "Failed",
};

const STATUS_STYLE: Record<CounterOccurrence["status"], string> = {
  completed: "w-20 shrink-0",
  skipped: "w-20 shrink-0 text-amber-400",
  failed: "w-20 shrink-0 text-red-400",
};
