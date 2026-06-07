"use client";

import { ListChecks, Timer, UsersRound } from "lucide-react";
import type { LucideProps } from "lucide-react";

import type { CalendarEventType } from "@/types/calendar.types";

const DEFAULT_KIND_ICON_STROKE = "#a1a1aa";

export interface CalendarKindIconProps {
  kind: CalendarEventType;
  size: number;
  /** Defaults to neutral zinc (event types are not color-coded). */
  color?: string;
  className?: string;
  "aria-hidden"?: boolean;
}

export function CalendarKindIcon({
  kind,
  size,
  color,
  className,
  "aria-hidden": ariaHidden = true,
}: CalendarKindIconProps) {
  const strokeColor = color ?? DEFAULT_KIND_ICON_STROKE;
  const common: LucideProps = {
    size,
    strokeWidth: size <= 11 ? 2 : 2.25,
    className,
    color: strokeColor,
    "aria-hidden": ariaHidden,
  };

  switch (kind) {
    case "timeBlock":
      return <Timer {...common} />;
    case "common":
      return <UsersRound {...common} />;
    case "task":
      return <ListChecks {...common} />;
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

/** Pixel size for icons inside calendar cells — small, left-aligned. */
export function calendarKindIconSizePx(
  durationMs: number,
  allDay: boolean,
): number {
  if (allDay) return 11;
  if (!Number.isFinite(durationMs) || durationMs <= 0) return 10;
  const minutes = durationMs / 60_000;
  return Math.round(Math.min(12, Math.max(9, 8 + minutes * 0.08)));
}
