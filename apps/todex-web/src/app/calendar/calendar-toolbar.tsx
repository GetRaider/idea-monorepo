"use client";

import { useState, type ReactNode } from "react";
import { Checkbox, Popover, PopoverContent, PopoverTrigger, cn } from "@repo/ui";

import {
  ChevronIcon,
  PanelRightIcon,
  SlidersIcon,
} from "@components/icons";
import { NewButton } from "@components/new-button";

import { useCalendar } from "./calendar-provider";

const WEEK_LETTERS = ["M", "T", "W", "T", "F", "S", "S"] as const;

export function CalendarToolbar({
  rangeFrom,
  rangeTo,
  onPrevious,
  onToday,
  onNext,
  onNew,
}: {
  rangeFrom: string;
  rangeTo: string;
  onPrevious: () => void;
  onToday: () => void;
  onNext: () => void;
  onNew: () => void;
}) {
  const {
    state: { visibility, scheduleOpen },
    actions: { focusDay, setVisibility, setScheduleOpen },
  } = useCalendar();
  const [dateOpen, setDateOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const anchor = new Date(rangeFrom);
  const [pickerMonth, setPickerMonth] = useState(() => monthStart(anchor));

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
      <TodayMark onClick={onToday} />
      <Popover
        open={dateOpen}
        onOpenChange={(open) => {
          setDateOpen(open);
          if (open) setPickerMonth(monthStart(new Date(rangeFrom)));
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-sm font-medium hover:bg-accent"
          >
            {rangeTitle(rangeFrom, rangeTo)}
            <ChevronIcon
              size={14}
              className={cn(
                "text-muted-foreground transition-transform",
                dateOpen && "rotate-90",
              )}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-2">
          <MiniMonth
            month={pickerMonth}
            selected={anchor}
            onMonth={setPickerMonth}
            onSelect={(day) => {
              focusDay(day);
              setDateOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      <div className="ml-auto flex flex-wrap items-center gap-1.5">
        <ToolbarButton label="Previous" onClick={onPrevious}>
          <ChevronIcon size={14} className="rotate-180" />
        </ToolbarButton>
        <ToolbarButton label="Today" onClick={onToday}>
          Today
        </ToolbarButton>
        <ToolbarButton label="Next" onClick={onNext}>
          <ChevronIcon size={14} />
        </ToolbarButton>
        <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 text-sm"
              aria-expanded={filtersOpen}
            >
              <SlidersIcon size={14} />
              Filters
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-44 p-2">
            <ul className="flex flex-col gap-1">
              <FilterRow
                id="filter-events"
                label="Events"
                checked={visibility.events}
                onCheckedChange={(checked) => setVisibility({ events: checked })}
              />
              <FilterRow
                id="filter-tasks"
                label="Tasks"
                checked={visibility.tasks}
                onCheckedChange={(checked) => setVisibility({ tasks: checked })}
              />
            </ul>
          </PopoverContent>
        </Popover>
        <button
          type="button"
          aria-pressed={scheduleOpen}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-sm",
            scheduleOpen ? "bg-accent" : "bg-surface",
          )}
          onClick={() => setScheduleOpen(!scheduleOpen)}
        >
          <PanelRightIcon size={14} />
          Schedule
        </button>
        <NewButton onClick={onNew} />
      </div>
    </div>
  );
}

function TodayMark({ onClick }: { onClick: () => void }) {
  const today = new Date();
  const month = today
    .toLocaleDateString(undefined, { month: "short" })
    .toUpperCase();
  return (
    <button
      type="button"
      className="inline-flex h-8 w-8 flex-col items-center justify-center rounded-lg border border-border bg-surface leading-none"
      aria-label="Today"
      onClick={onClick}
    >
      <span className="text-[8px] font-semibold tracking-wide text-muted-foreground">
        {month}
      </span>
      <span className="text-sm font-semibold tabular-nums">{today.getDate()}</span>
    </button>
  );
}

function ToolbarButton({
  label,
  children,
  onClick,
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
}) {
  const iconOnly = label !== "Today";
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "inline-flex h-8 items-center justify-center rounded-lg border border-border bg-surface text-sm",
        iconOnly ? "w-8" : "px-2.5",
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function FilterRow({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <li className="flex items-center gap-2 rounded-md px-1 py-1">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <label htmlFor={id} className="text-sm">
        {label}
      </label>
    </li>
  );
}

function MiniMonth({
  month,
  selected,
  onMonth,
  onSelect,
}: {
  month: Date;
  selected: Date;
  onMonth: (month: Date) => void;
  onSelect: (day: Date) => void;
}) {
  const rows = monthGrid(month);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between px-1">
        <button
          type="button"
          className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-accent"
          aria-label="Previous month"
          onClick={() =>
            onMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
          }
        >
          <ChevronIcon size={14} className="rotate-180" />
        </button>
        <span className="text-xs font-medium">
          {month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </span>
        <button
          type="button"
          className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-accent"
          aria-label="Next month"
          onClick={() =>
            onMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
          }
        >
          <ChevronIcon size={14} />
        </button>
      </div>
      <div className="grid grid-cols-7">
        {WEEK_LETTERS.map((letter, index) => (
          <div
            key={`${letter}-${index}`}
            className="flex h-6 items-center justify-center text-[10px] text-muted-foreground"
          >
            {letter}
          </div>
        ))}
        {rows.flatMap((week) =>
          week.map(({ date, inMonth }) => {
            const active = sameDay(date, selected);
            return (
              <button
                key={date.toISOString()}
                type="button"
                className={cn(
                  "flex h-7 items-center justify-center rounded-md text-[11px] tabular-nums",
                  inMonth ? "text-foreground" : "text-muted-foreground/40",
                  active && "bg-foreground text-background",
                  !active && inMonth && "hover:bg-accent",
                )}
                onClick={() => onSelect(startOfDay(date))}
              >
                {date.getDate()}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}

function rangeTitle(from: string, to: string) {
  const start = new Date(from);
  const end = new Date(to);
  end.setDate(end.getDate() - 1);
  const startLabel = start.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const endLabel = end.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  return `${startLabel} – ${endLabel}, ${end.getFullYear()}`;
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function sameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function mondayBefore(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + offset);
  next.setHours(0, 0, 0, 0);
  return next;
}

function monthGrid(visibleMonth: Date) {
  const month = visibleMonth.getMonth();
  const cursor = mondayBefore(new Date(visibleMonth.getFullYear(), month, 1));
  const rows: { date: Date; inMonth: boolean }[][] = [];
  for (let rowIndex = 0; rowIndex < 6; rowIndex += 1) {
    const week: { date: Date; inMonth: boolean }[] = [];
    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      week.push({
        date: new Date(cursor),
        inMonth: cursor.getMonth() === month,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    rows.push(week);
  }
  return rows;
}
