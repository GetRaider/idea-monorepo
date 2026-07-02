"use client";

import { LayoutGrid } from "lucide-react";

import { cn } from "@/lib/styles/utils";
import type {
  CalendarEventType,
  CalendarKindVisibility,
} from "@/types/calendar.types";

import { CalendarKindIcon } from "../../shared/KindIcon";
import {
  CALENDAR_KIND_ROWS,
  CAL_PANEL_BODY_GUTTER,
} from "./calendar-panel.constants";

type CalendarPanelEventTypesBodyProps = {
  kindVisibility: CalendarKindVisibility;
  allKindsOn: boolean;
  onKindVisibilityChange: (next: CalendarKindVisibility) => void;
  onToggleKind: (kind: CalendarEventType) => void;
};

export function CalendarPanelEventTypesBody({
  kindVisibility,
  allKindsOn,
  onKindVisibilityChange,
  onToggleKind,
}: CalendarPanelEventTypesBodyProps) {
  return (
    <ul className={cn("space-y-2", CAL_PANEL_BODY_GUTTER)}>
      <li className="flex items-center gap-2">
        <input
          id="cal-all"
          type="checkbox"
          checked={allKindsOn}
          onChange={(event) => {
            const checked = event.target.checked;
            onKindVisibilityChange({
              timeBlock: checked,
              common: checked,
              task: checked,
            });
          }}
          className="h-4 w-4 cursor-pointer rounded border border-white/25 bg-input-bg/80 accent-zinc-200"
        />
        <label
          htmlFor="cal-all"
          className="flex min-w-0 cursor-pointer items-center gap-2 truncate text-sm text-zinc-200"
        >
          <LayoutGrid
            size={16}
            className="shrink-0 text-zinc-400"
            strokeWidth={2}
            aria-hidden
          />
          All
        </label>
      </li>
      {CALENDAR_KIND_ROWS.map(({ kind, label }) => (
        <li
          key={kind}
          className="flex items-center gap-2 rounded-lg py-0.5 pr-0.5"
        >
          <input
            id={`cal-${kind}`}
            type="checkbox"
            checked={kindVisibility[kind]}
            onChange={() => onToggleKind(kind)}
            className="h-4 w-4 shrink-0 cursor-pointer rounded border border-white/25 bg-input-bg/80 accent-zinc-200"
          />
          <label
            htmlFor={`cal-${kind}`}
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm text-zinc-200"
          >
            <CalendarKindIcon kind={kind} size={16} aria-hidden />
            <span className="truncate">{label}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}
