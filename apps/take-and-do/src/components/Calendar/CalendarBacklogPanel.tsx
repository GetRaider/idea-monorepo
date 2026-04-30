"use client";

import { useState } from "react";

import type {
  CalendarBacklogItem,
  CalendarEventKind,
} from "@/types/calendar.types";

import { kindColor, kindLabel } from "./calendar-event-mapper";
import { cn } from "@/lib/styles/utils";

interface CalendarBacklogPanelProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  items: CalendarBacklogItem[];
  onAddItem: (item: CalendarBacklogItem) => void;
  onRemoveItem: (id: string) => void;
}

export function CalendarBacklogPanel({
  containerRef,
  items,
  onAddItem,
  onRemoveItem,
}: CalendarBacklogPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<CalendarEventKind>("time_block");
  const [minutes, setMinutes] = useState(60);

  const resetForm = () => {
    setTitle("");
    setKind("time_block");
    setMinutes(60);
  };

  const handleAddTemplate = () => {
    const t = title.trim();
    if (!t || minutes <= 0) return;
    onAddItem({
      id: crypto.randomUUID(),
      kind,
      title: t,
      defaultDurationMinutes: minutes,
    });
    resetForm();
    setExpanded(false);
  };

  return (
    <aside className="flex w-full max-w-[280px] shrink-0 flex-col gap-4 rounded-xl border border-white/10 bg-background-primary/80 p-4 backdrop-blur-sm">
      <div>
        <h2 className="m-0 text-base font-semibold text-white">Backlog</h2>
        <p className="mt-1 text-xs leading-normal text-zinc-400">
          Drag a template onto the calendar to schedule it. Templates stay here
          for reuse.
        </p>
      </div>

      <div
        ref={containerRef as React.LegacyRef<HTMLDivElement>}
        className="flex min-h-0 flex-1 flex-col gap-2"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "calendar-backlog-draggable cursor-grab rounded-lg border border-white/10 bg-input-bg px-3 py-2.5 active:cursor-grabbing",
            )}
            data-backlog-id={item.id}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div
                  className="mb-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
                  style={{ backgroundColor: kindColor(item.kind) }}
                >
                  {kindLabel(item.kind)}
                </div>
                <div className="truncate text-sm font-medium text-white">
                  {item.title}
                </div>
                <div className="text-xs text-zinc-500">
                  {item.defaultDurationMinutes} min
                </div>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-md border-0 bg-transparent px-1.5 py-0.5 text-lg leading-none text-zinc-500 hover:bg-zinc-800 hover:text-white"
                title="Remove template"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onRemoveItem(item.id)}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 pt-3">
        <button
          type="button"
          className="w-full rounded-lg border border-white/15 bg-transparent py-2 text-sm font-medium text-zinc-300 hover:bg-white/5"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? "Close" : "New template"}
        </button>
        {expanded ? (
          <div className="mt-3 flex flex-col gap-3">
            <input
              className="w-full rounded-lg border border-white/15 bg-input-bg px-3 py-2 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <select
              className="w-full rounded-lg border border-white/15 bg-input-bg px-3 py-2 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              value={kind}
              onChange={(e) => setKind(e.target.value as CalendarEventKind)}
            >
              <option value="time_block">{kindLabel("time_block")}</option>
              <option value="mutual">{kindLabel("mutual")}</option>
              <option value="task_event">{kindLabel("task_event")}</option>
            </select>
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              Duration (minutes)
              <input
                type="number"
                min={5}
                step={5}
                className="w-full rounded-lg border border-white/15 bg-input-bg px-3 py-2 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                value={minutes}
                onChange={(e) => setMinutes(parseInt(e.target.value, 10) || 0)}
              />
            </label>
            <button
              type="button"
              className="rounded-lg border-0 bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
              onClick={handleAddTemplate}
            >
              Add to backlog
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
