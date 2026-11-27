"use client";

import { useRef } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from "@repo/ui";
import type { Counter, CounterDay } from "@repo/api/todex";

import { dayLabel, isSkipCovered } from "./counter-helpers";

const WEEKDAY_INITIALS = ["M", "T", "W", "T", "F", "S", "S"] as const;

export function DayIndicators({
  counter,
  isPending,
  onComplete,
  onSkip,
  onRemove,
}: DayIndicatorsProps) {
  const skipCovered = isSkipCovered(counter);
  const skipAfterClose = useRef<string | null>(null);

  // The skip dialog opens once the menu is gone, or the menu takes focus back.
  function openSkipAfterClose(event: Event) {
    const date = skipAfterClose.current;
    if (!date) return;
    skipAfterClose.current = null;
    event.preventDefault();
    onSkip(date);
  }

  return (
    <ol className="flex gap-1" aria-label="This week">
      {counter.week.map((day, index) => {
        const mark = markFor(day);
        const removable = day.occurrences.filter((item) => item.deletable);
        const button = (
          <button
            type="button"
            aria-label={
              day.loggable ? `${dayLabel(day)}. Add completed` : dayLabel(day)
            }
            aria-disabled={!day.loggable || isPending}
            className={cn(
              "flex flex-col items-center gap-1 rounded-md px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              day.loggable ? "hover:bg-surface" : "cursor-default opacity-60",
              day.date === counter.today && "bg-surface",
            )}
            onClick={() => {
              if (day.loggable && !isPending) onComplete(day.date);
            }}
          >
            <span className="text-[10px] text-muted-foreground">
              {WEEKDAY_INITIALS[index]}
            </span>
            <span
              aria-hidden="true"
              className={cn(
                "flex size-5 items-center justify-center rounded-full border text-[10px] leading-none",
                MARK_STYLE[mark],
              )}
            >
              {MARK_GLYPH[mark]}
            </span>
            {/* A completed day still shows that something was skipped or failed. */}
            <span
              aria-hidden="true"
              className={cn("size-1 rounded-full", secondaryDot(day))}
            />
          </button>
        );
        return (
          <li key={day.date}>
            <ContextMenu>
              <Tooltip>
                <ContextMenuTrigger asChild disabled={!day.loggable}>
                  <span className="block">
                    <TooltipTrigger asChild>{button}</TooltipTrigger>
                  </span>
                </ContextMenuTrigger>
                <TooltipContent>
                  <p>{dayLabel(day)}</p>
                  {day.loggable ? (
                    <p className="text-neutral-400">
                      Click to add · Right-click for more
                    </p>
                  ) : null}
                </TooltipContent>
              </Tooltip>
              <ContextMenuContent onCloseAutoFocus={openSkipAfterClose}>
                <ContextMenuItem
                  disabled={isPending}
                  onSelect={() => onComplete(day.date)}
                >
                  Add completed
                </ContextMenuItem>
                <ContextMenuItem
                  disabled={isPending || skipCovered}
                  onSelect={() => {
                    skipAfterClose.current = day.date;
                  }}
                >
                  Skip…
                </ContextMenuItem>
                {removable.length > 0 ? <ContextMenuSeparator /> : null}
                {removable.map((occurrence) => (
                  <ContextMenuItem
                    key={occurrence.id}
                    className="text-destructive"
                    disabled={isPending}
                    onSelect={() => onRemove(occurrence.id)}
                  >
                    {occurrence.status === "skipped"
                      ? "Remove skip"
                      : "Remove completion"}
                  </ContextMenuItem>
                ))}
              </ContextMenuContent>
            </ContextMenu>
          </li>
        );
      })}
    </ol>
  );
}

function markFor(day: CounterDay): Mark {
  if (day.fill !== "empty") return day.fill;
  if (day.skipped > 0) return "skipped";
  if (day.failed > 0) return "failed";
  return "empty";
}

function secondaryDot(day: CounterDay): string {
  if (day.fill === "empty") return "bg-transparent";
  if (day.failed > 0) return "bg-red-400";
  if (day.skipped > 0) return "bg-amber-400";
  return "bg-transparent";
}

const MARK_STYLE: Record<Mark, string> = {
  filled: "border-foreground bg-foreground",
  partial:
    "border-foreground bg-[linear-gradient(to_top,var(--foreground)_50%,transparent_50%)]",
  skipped: "border-dashed border-amber-400 text-amber-400",
  failed: "border-red-400/70 text-red-400",
  empty: "border-muted-foreground/40",
};

const MARK_GLYPH: Record<Mark, string | null> = {
  filled: null,
  partial: null,
  skipped: "–",
  failed: "✕",
  empty: null,
};

type Mark = "filled" | "partial" | "skipped" | "failed" | "empty";

interface DayIndicatorsProps {
  counter: Counter;
  isPending: boolean;
  onComplete: (date: string) => void;
  onSkip: (date: string) => void;
  onRemove: (occurrenceId: string) => void;
}
