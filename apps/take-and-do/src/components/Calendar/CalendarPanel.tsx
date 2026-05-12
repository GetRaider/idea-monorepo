"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Pencil,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";

import { InfoCircleIcon, PlusIcon, DotsVerticalIcon } from "@/components/Icons";
import { ConfirmDialog } from "@/components/Dialogs";
import { AppTooltip } from "@/components/Tooltip/AppTooltip";
import { cn } from "@/lib/styles/utils";
import type {
  CalendarBacklogEvent,
  CalendarEventType,
  CalendarKindColorMap,
  CalendarKindVisibility,
} from "@/types/calendar.types";

import { CalendarColorPickerPopover } from "./CalendarColorPickerPopover";
import { CalendarKindIcon } from "./CalendarKindIcon";
import {
  effectiveGoogleCalendarColor,
  effectiveKindColor,
} from "./calendar-colors";
import { kindLabel } from "./calendar-event-mapper";

const WEEK_LETTERS = ["M", "T", "W", "T", "F", "S", "S"] as const;

interface CalendarPanelProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  items: CalendarBacklogEvent[];
  onRequestNewTemplate: () => void;
  onEditTemplate: (item: CalendarBacklogEvent) => void;
  onRemoveItem: (id: string) => void;
  kindVisibility: CalendarKindVisibility;
  onKindVisibilityChange: (next: CalendarKindVisibility) => void;
  onPickCalendarDay: (date: Date) => void;
  showGoogleCalendar: boolean;
  onShowGoogleCalendarChange: (next: boolean) => void;
  googleCalendarLabel?: string | null;
  kindColors: CalendarKindColorMap | undefined;
  googleCalendarColor: string | undefined;
  onKindColorChange: (kind: CalendarEventType, color: string | null) => void;
  onGoogleCalendarColorChange: (color: string | null) => void;
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

const CALENDAR_ROWS: { kind: CalendarEventType; label: string }[] = [
  { kind: "timeBlock", label: "Time blocks" },
  { kind: "common", label: "Common" },
  { kind: "task", label: "Task windows" },
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
  showGoogleCalendar,
  onShowGoogleCalendarChange,
  googleCalendarLabel,
  kindColors,
  googleCalendarColor,
  onKindColorChange,
  onGoogleCalendarColorChange,
}: CalendarPanelProps) {
  const [monthOpen, setMonthOpen] = useState(true);
  const [pickerMonth, setPickerMonth] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()));
  const [calendarsOpen, setCalendarsOpen] = useState(true);
  const [eventTypesOpen, setEventTypesOpen] = useState(true);
  const [backlogOpen, setBacklogOpen] = useState(true);
  const [confirmRemove, setConfirmRemove] =
    useState<CalendarBacklogEvent | null>(null);

  const rows = useMemo(() => monthGrid(pickerMonth), [pickerMonth]);

  const allKindsOn =
    kindVisibility.timeBlock && kindVisibility.common && kindVisibility.task;

  const monthTitle = pickerMonth.toLocaleDateString(undefined, {
    month: "long",
  });

  const toggleKind = (kind: CalendarEventType) => {
    onKindVisibilityChange({
      ...kindVisibility,
      [kind]: !kindVisibility[kind],
    });
  };

  return (
    <aside
      className="calendar-surface flex min-h-0 w-full max-w-[260px] shrink-0 flex-col gap-4 overflow-y-auto rounded-xl border border-white/10 bg-background-primary/85 p-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-md max-[900px]:max-w-none"
      style={{ scrollbarGutter: "stable" }}
    >
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
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg border-0 bg-transparent px-2 py-2 text-left transition-colors hover:bg-white/[0.06]"
          onClick={() => setMonthOpen((o) => !o)}
          aria-expanded={monthOpen}
        >
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-sm font-semibold text-white">Month</span>
            <AppTooltip content="Pick a day to jump the main calendar.">
              <span className="inline-flex">
                <InfoCircleIcon size={16} className="text-zinc-500" />
              </span>
            </AppTooltip>
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-start gap-1.5 pl-1">
            <button
              type="button"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-0 bg-transparent text-zinc-400 hover:bg-white/[0.06] hover:text-white"
              aria-label="Previous month"
              onClick={(e) => {
                e.stopPropagation();
                setPickerMonth(
                  (d) => new Date(d.getFullYear(), d.getMonth() - 1, 1),
                );
              }}
            >
              <ChevronLeft size={14} aria-hidden />
            </button>
            <span className="min-w-0 max-w-[5.5rem] truncate text-[10px] font-medium leading-tight text-zinc-400">
              {monthTitle}
            </span>
            <button
              type="button"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-0 bg-transparent text-zinc-400 hover:bg-white/[0.06] hover:text-white"
              aria-label="Next month"
              onClick={(e) => {
                e.stopPropagation();
                setPickerMonth(
                  (d) => new Date(d.getFullYear(), d.getMonth() + 1, 1),
                );
              }}
            >
              <ChevronRight size={14} aria-hidden />
            </button>
          </div>
          <ChevronDown
            size={18}
            className={cn(
              "ml-auto shrink-0 text-zinc-500 transition-transform",
              monthOpen ? "rotate-0" : "-rotate-90",
            )}
            aria-hidden
          />
        </button>

        {monthOpen ? (
          <>
            <div className="mx-auto flex max-w-[268px] gap-0 overflow-hidden rounded-lg border border-white/[0.08] bg-black/20">
              <div className="flex w-6 shrink-0 flex-col border-r border-white/[0.06] bg-white/[0.03] py-1">
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
          </>
        ) : null}
      </section>

      <section className="border-t border-white/[0.08] pt-3">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 rounded-lg border-0 bg-transparent px-2 py-2 text-left transition-colors hover:bg-white/[0.06]"
          onClick={() => setCalendarsOpen((o) => !o)}
          aria-expanded={calendarsOpen}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">Calendars</span>
            <AppTooltip content="Show or hide external calendars.">
              <span className="inline-flex">
                <InfoCircleIcon size={16} className="text-zinc-500" />
              </span>
            </AppTooltip>
          </div>
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
            <li className="group/calPanelGcal flex items-center gap-1 rounded-lg py-0.5 pl-1 pr-0.5 transition-colors hover:bg-white/[0.04]">
              <input
                id="cal-google"
                type="checkbox"
                checked={showGoogleCalendar}
                onChange={(e) => onShowGoogleCalendarChange(e.target.checked)}
                className="h-4 w-4 shrink-0 rounded border-white/20 bg-transparent accent-[#4285F4]"
              />
              <label
                htmlFor="cal-google"
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm text-zinc-200"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-sm"
                  style={{
                    backgroundColor:
                      effectiveGoogleCalendarColor(googleCalendarColor),
                  }}
                  aria-hidden
                />
                <span className="truncate">
                  {googleCalendarLabel
                    ? `${googleCalendarLabel}`
                    : "Google Calendar"}
                </span>
              </label>
              <div
                className={cn(
                  "inline-flex shrink-0 items-center justify-center text-zinc-500 opacity-0 transition-opacity duration-150",
                  "group-hover/calPanelGcal:opacity-100",
                )}
              >
                <CalendarColorPickerPopover
                  selectedHex={effectiveGoogleCalendarColor(
                    googleCalendarColor,
                  )}
                  onSelect={(hex) => onGoogleCalendarColorChange(hex)}
                  onResetToDefault={() => onGoogleCalendarColorChange(null)}
                  trigger={<DotsVerticalIcon size={14} />}
                />
              </div>
            </li>
          </ul>
        ) : null}
      </section>

      <section className="border-t border-white/[0.08] pt-3">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 rounded-lg border-0 bg-transparent px-2 py-2 text-left transition-colors hover:bg-white/[0.06]"
          onClick={() => setEventTypesOpen((o) => !o)}
          aria-expanded={eventTypesOpen}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">
              Event Types
            </span>
            <AppTooltip content="Filter which event types show on the calendar.">
              <span className="inline-flex">
                <InfoCircleIcon size={16} className="text-zinc-500" />
              </span>
            </AppTooltip>
          </div>
          <ChevronDown
            size={18}
            className={cn(
              "shrink-0 text-zinc-500 transition-transform",
              eventTypesOpen ? "rotate-0" : "-rotate-90",
            )}
            aria-hidden
          />
        </button>

        {eventTypesOpen ? (
          <ul className="mt-2 space-y-2">
            <li className="flex items-center gap-2.5">
              <input
                id="cal-all"
                type="checkbox"
                checked={allKindsOn}
                onChange={(e) => {
                  const on = e.target.checked;
                  onKindVisibilityChange({
                    timeBlock: on,
                    common: on,
                    task: on,
                  });
                }}
                className="h-4 w-4 rounded border-white/20 bg-transparent accent-[#7255c1]"
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
            {CALENDAR_ROWS.map(({ kind, label }) => (
              <li
                key={kind}
                className="group/calPanelKind flex items-center gap-1 rounded-lg py-0.5 pl-1 pr-0.5 transition-colors hover:bg-white/[0.04]"
              >
                <input
                  id={`cal-${kind}`}
                  type="checkbox"
                  checked={kindVisibility[kind]}
                  onChange={() => toggleKind(kind)}
                  className="h-4 w-4 shrink-0 rounded border-white/20 bg-transparent"
                  style={{
                    accentColor: effectiveKindColor(kind, kindColors),
                  }}
                />
                <label
                  htmlFor={`cal-${kind}`}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm text-zinc-200"
                >
                  <CalendarKindIcon kind={kind} size={16} aria-hidden />
                  <span className="truncate">{label}</span>
                </label>
                <div
                  className={cn(
                    "inline-flex shrink-0 items-center justify-center text-zinc-500 opacity-0 transition-opacity duration-150",
                    "group-hover/calPanelKind:opacity-100",
                  )}
                >
                  <CalendarColorPickerPopover
                    selectedHex={effectiveKindColor(kind, kindColors)}
                    onSelect={(hex) => onKindColorChange(kind, hex)}
                    onResetToDefault={() => onKindColorChange(kind, null)}
                    trigger={<DotsVerticalIcon size={14} />}
                  />
                </div>
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
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">
              Events Backlog
            </span>
            <AppTooltip content="Reusable backlog events you can drag onto the calendar">
              <span className="inline-flex">
                <InfoCircleIcon size={16} className="text-zinc-500" />
              </span>
            </AppTooltip>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRequestNewTemplate();
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg border-0 bg-transparent text-zinc-400 hover:bg-white/[0.06] hover:text-white"
              aria-label="Add backlog template"
              title="Add backlog template"
            >
              <PlusIcon size={16} aria-hidden />
            </button>
            <ChevronDown
              size={18}
              className={cn(
                "shrink-0 text-zinc-500 transition-transform",
                backlogOpen ? "rotate-0" : "-rotate-90",
              )}
              aria-hidden
            />
          </div>
        </button>

        {backlogOpen ? (
          <div className="mt-2 space-y-2">
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
                        className="mb-0.5 inline-flex h-6 w-6 items-center justify-center rounded"
                        style={{
                          backgroundColor: effectiveKindColor(
                            item.type,
                            kindColors,
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
                      <div className="truncate text-sm font-medium text-white">
                        {item.title}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {item.durationMinutes} min
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
                        onClick={() => setConfirmRemove(item)}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {confirmRemove ? (
        <ConfirmDialog
          title="Remove from backlog?"
          description={`This will permanently delete "${confirmRemove.title}" from the Events Backlog. This action cannot be undone.`}
          confirmLabel="Remove"
          onConfirm={() => onRemoveItem(confirmRemove.id)}
          onClose={() => setConfirmRemove(null)}
        />
      ) : null}
    </aside>
  );
}
