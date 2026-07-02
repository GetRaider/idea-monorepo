"use client";

import { Pencil } from "lucide-react";

import { cn } from "@/lib/styles/utils";
import { effectiveInternalCalendarColor } from "@/helpers/calendar/calendar-colors";
import { kindLabel } from "@/helpers/calendar/calendar-event-mapper";
import type { CalendarBacklogEvent } from "@/types/calendar.types";

import { CalendarKindIcon } from "../../shared/KindIcon";
import { CAL_PANEL_BODY_GUTTER } from "./calendar-panel.constants";

type CalendarPanelBacklogBodyProps = {
  items: CalendarBacklogEvent[];
  internalCalendarColor: string | undefined;
  onEditTemplate: (item: CalendarBacklogEvent) => void;
  onRequestRemove: (item: CalendarBacklogEvent) => void;
};

export function CalendarPanelBacklogBody({
  items,
  internalCalendarColor,
  onEditTemplate,
  onRequestRemove,
}: CalendarPanelBacklogBodyProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-2">
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto",
          CAL_PANEL_BODY_GUTTER,
        )}
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="calendar-backlog-draggable group cursor-grab rounded-lg border border-white/10 bg-input-bg/90 px-3 py-2.5 transition-colors hover:border-white/18 active:cursor-grabbing"
            data-backlog-id={item.id}
          >
            <div className="flex items-start justify-between gap-2">
              <button
                type="button"
                className="min-w-0 flex-1 cursor-grab text-left"
              >
                <div
                  className="mb-0.5 inline-flex h-6 w-6 items-center justify-center rounded"
                  style={{
                    backgroundColor: effectiveInternalCalendarColor(
                      internalCalendarColor,
                    ),
                  }}
                  title={kindLabel(item.type)}
                  aria-label={kindLabel(item.type)}
                >
                  <CalendarKindIcon
                    kind={item.type}
                    size={14}
                    color="#fafafa"
                  />
                </div>
                <div className="truncate text-sm font-medium text-text-primary">
                  {item.title}
                </div>
                <div className="text-xs text-zinc-500">
                  {item.durationMinutes} min
                </div>
              </button>
              <div className="flex shrink-0 flex-col gap-0.5">
                <button
                  type="button"
                  className="rounded-md border-0 bg-transparent p-1 text-zinc-400 opacity-80 transition-all hover:bg-zinc-800 hover:text-text-primary group-hover:opacity-100"
                  title="Edit template"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => onEditTemplate(item)}
                >
                  <Pencil size={14} aria-hidden />
                </button>
                <button
                  type="button"
                  className="rounded-md border-0 bg-transparent px-1 py-0.5 text-lg leading-none text-zinc-500 hover:bg-zinc-800 hover:text-text-primary"
                  title="Remove event"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => onRequestRemove(item)}
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
