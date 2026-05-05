"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";

import { PlusIcon } from "@/components/Icons";
import { cn } from "@/lib/styles/utils";
import type {
  CalendarBacklogItem,
  CalendarEventKind,
  CalendarKindVisibility,
} from "@/types/calendar.types";

import { kindColor, kindLabel } from "./calendar-event-mapper";

const WEEK_LETTERS = ["M", "T", "W", "T", "F", "S", "S"] as const;

interface CalendarPanelProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  items: CalendarBacklogItem[];
  onRequestNewTemplate: () => void;
  onEditTemplate: (item: CalendarBacklogItem) => void;
  onRemoveItem: (id: string) => void;
  kindVisibility: CalendarKindVisibility;
  onKindVisibilityChange: (next: CalendarKindVisibility) => void;
  onPickCalendarDay: (date: Date) => void;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function mondayBefore(d: Date) {
  const x = new Date(d);
  const day = x.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + offset);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isoWeekNumber(anchor: Date) {
  const d = new Date(
    Date.UTC(anchor.getFullYear(), anchor.getMonth(), anchor.getDate()),
  );
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const y = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - y.getTime()) / 86400000 + 1) / 7);
}

function monthGrid(visibleMonth: Date) {
  const y = visibleMonth.getFullYear();
  const m = visibleMonth.getMonth();
  const first = new Date(y, m, 1);
  const gridStart = mondayBefore(first);
  const cells: { date: Date; inMonth: boolean }[] = [];
  const cur = new Date(gridStart);
  for (let i = 0; i < 42; i++) {
    cells.push({
      date: new Date(cur),
      inMonth: cur.getMonth() === m,
    });
    cur.setDate(cur.getDate() + 1);
  }
  const rows: (typeof cells)[] = [];
  for (let r = 0; r < 6; r++) {
    rows.push(cells.slice(r * 7, r * 7 + 7));
  }
  return rows;
}

const CALENDAR_ROWS: { kind: CalendarEventKind; label: string }[] = [
  { kind: "time_block", label: "Time blocks" },
  { kind: "general", label: "General" },
  { kind: "task_event", label: "Task windows" },
];

export function CalendarPanel({
  containerRef,
  items,
  onRequestNewTemplate,
  onEditTemplate,
  onRemoveItem,
  kindVisibility,
  onKindVisibilityChange,
  onPickCalendarDay,
}: CalendarPanelProps) {
  const [pickerMonth, setPickerMonth] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()));
  const [calendarsOpen, setCalendarsOpen] = useState(true);
  const [backlogOpen, setBacklogOpen] = useState(true);

  const rows = useMemo(() => monthGrid(pickerMonth), [pickerMonth]);

  const allKindsOn =
    kindVisibility.time_block &&
    kindVisibility.general &&
    kindVisibility.task_event;

  const monthTitle = pickerMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const toggleKind = (kind: CalendarEventKind) => {
    onKindVisibilityChange({
      ...kindVisibility,
      [kind]: !kindVisibility[kind],
    });
  };

  return (
    <aside className="calendar-surface flex min-h-0 w-full max-w-[300px] shrink-0 flex-col gap-5 overflow-y-auto rounded-xl border border-white/10 bg-background-primary/85 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-md max-[900px]:max-w-none">
      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          aria-hidden
        />
        <input
          type="search"
          className="w-full rounded-xl border border-white/10 bg-input-bg/80 py-2.5 pl-10 pr-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-500 focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          placeholder="Search events & people"
          aria-label="Search events & people"
        />
      </div>

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="m-0 text-sm font-semibold text-white">{monthTitle}</h2>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg border-0 bg-transparent text-zinc-400 hover:bg-white/[0.06] hover:text-white"
              aria-label="Previous month"
              onClick={() =>
                setPickerMonth(
                  (d) => new Date(d.getFullYear(), d.getMonth() - 1, 1),
                )
              }
            >
              <ChevronLeft size={18} aria-hidden />
            </button>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg border-0 bg-transparent text-zinc-400 hover:bg-white/[0.06] hover:text-white"
              aria-label="Next month"
              onClick={() =>
                setPickerMonth(
                  (d) => new Date(d.getFullYear(), d.getMonth() + 1, 1),
                )
              }
            >
              <ChevronRight size={18} aria-hidden />
            </button>
          </div>
        </div>

        <div className="flex gap-0 overflow-hidden rounded-lg border border-white/[0.08] bg-black/20">
          <div className="flex w-7 shrink-0 flex-col border-r border-white/[0.06] bg-white/[0.03] py-1">
            <div className="h-6 shrink-0" aria-hidden />
            {rows.map((week, ri) => (
              <div
                key={ri}
                className="flex h-7 items-center justify-center text-[10px] font-medium tabular-nums text-zinc-500"
              >
                {isoWeekNumber(week[0].date)}
              </div>
            ))}
          </div>
          <div className="min-w-0 flex-1 py-1 pr-1">
            <div className="grid grid-cols-7 gap-0 px-1">
              {WEEK_LETTERS.map((l, i) => (
                <div
                  key={`${l}-${i}`}
                  className="flex h-6 items-center justify-center text-[10px] font-semibold text-zinc-500"
                >
                  {l}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0 px-1">
              {rows.flatMap((week) =>
                week.map(({ date, inMonth }) => {
                  const sel = sameDay(date, selectedDay);
                  return (
                    <button
                      key={date.toISOString()}
                      type="button"
                      className={cn(
                        "flex h-7 items-center justify-center rounded-md text-[11px] font-medium tabular-nums transition-colors",
                        !inMonth && "text-zinc-600",
                        inMonth &&
                          !sel &&
                          "text-zinc-200 hover:bg-white/[0.08]",
                        sel &&
                          "bg-[#7255c1] text-white shadow-sm hover:bg-[#6346b0]",
                      )}
                      onClick={() => {
                        const d = startOfDay(date);
                        setSelectedDay(d);
                        setPickerMonth(
                          new Date(d.getFullYear(), d.getMonth(), 1),
                        );
                        onPickCalendarDay(d);
                      }}
                    >
                      {date.getDate()}
                    </button>
                  );
                }),
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.08] pt-3">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 rounded-lg border-0 bg-transparent px-2 py-2 text-left transition-colors hover:bg-white/[0.06]"
          onClick={() => setCalendarsOpen((o) => !o)}
          aria-expanded={calendarsOpen}
        >
          <span className="text-sm font-semibold text-white">Calendars</span>
          <ChevronDown
            size={18}
            className={cn(
              "shrink-0 text-zinc-500 transition-transform",
              calendarsOpen ? "rotate-0" : "-rotate-90",
            )}
            aria-hidden
          />
        </button>
        {calendarsOpen ? (
          <ul className="mt-2 space-y-2">
            <li className="flex items-center gap-2.5">
              <input
                id="cal-all"
                type="checkbox"
                checked={allKindsOn}
                onChange={(e) => {
                  const on = e.target.checked;
                  onKindVisibilityChange({
                    time_block: on,
                    general: on,
                    task_event: on,
                  });
                }}
                className="h-4 w-4 rounded border-white/20 bg-transparent accent-[#7255c1]"
              />
              <label
                htmlFor="cal-all"
                className="truncate text-sm text-zinc-200"
              >
                All
              </label>
            </li>
            {CALENDAR_ROWS.map(({ kind, label }) => (
              <li key={kind} className="flex items-center gap-2.5 pl-1">
                <input
                  id={`cal-${kind}`}
                  type="checkbox"
                  checked={kindVisibility[kind]}
                  onChange={() => toggleKind(kind)}
                  className="h-4 w-4 rounded border-white/20 bg-transparent"
                  style={{ accentColor: kindColor(kind) }}
                />
                <label
                  htmlFor={`cal-${kind}`}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm text-zinc-200"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-sm"
                    style={{ backgroundColor: kindColor(kind) }}
                    aria-hidden
                  />
                  <span className="truncate">{label}</span>
                </label>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="border-t border-white/[0.08] pt-3">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 rounded-lg border-0 bg-transparent px-2 py-2 text-left transition-colors hover:bg-white/[0.06]"
          onClick={() => setBacklogOpen((o) => !o)}
          aria-expanded={backlogOpen}
        >
          <span className="text-sm font-semibold text-white">
            Events Backlog
          </span>
          <ChevronDown
            size={18}
            className={cn(
              "shrink-0 text-zinc-500 transition-transform",
              backlogOpen ? "rotate-0" : "-rotate-90",
            )}
            aria-hidden
          />
        </button>

        {backlogOpen ? (
          <div className="mt-2 space-y-2">
            <p className="m-0 px-2 text-xs leading-relaxed text-zinc-500">
              Reusable templates — drag onto the calendar.
            </p>
            <div
              ref={containerRef as React.LegacyRef<HTMLDivElement>}
              className="flex max-h-[220px] min-h-[100px] flex-col gap-2 overflow-y-auto px-2"
            >
              {items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "calendar-backlog-draggable group cursor-grab rounded-lg border border-white/10 bg-input-bg/90 px-3 py-2.5 transition-colors hover:border-white/18 active:cursor-grabbing",
                  )}
                  data-backlog-id={item.id}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      className="min-w-0 flex-1 cursor-grab text-left"
                    >
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
                    </button>
                    <div className="flex shrink-0 flex-col gap-0.5">
                      <button
                        type="button"
                        className="rounded-md border-0 bg-transparent p-1 text-zinc-400 opacity-80 transition-all hover:bg-zinc-800 hover:text-white group-hover:opacity-100"
                        title="Edit template"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => onEditTemplate(item)}
                      >
                        <Pencil size={14} aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="rounded-md border-0 bg-transparent px-1 py-0.5 text-lg leading-none text-zinc-500 hover:bg-zinc-800 hover:text-white"
                        title="Remove template"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => onRemoveItem(item.id)}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-2">
              <button
                type="button"
                onClick={onRequestNewTemplate}
                className={cn(
                  "quick-create-appear group flex w-full cursor-pointer items-center gap-2 rounded-lg border border-dashed border-input-border bg-transparent px-4 py-3 text-left text-sm text-text-tertiary transition-colors duration-200 hover:border-focus-ring hover:bg-focus-ring/[0.06] hover:text-focus-ring focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
                )}
              >
                <PlusIcon
                  size={16}
                  className="text-text-tertiary transition-colors group-hover:text-focus-ring"
                />
                <span>Add backlog template</span>
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </aside>
  );
}
