"use client";

import { useState } from "react";
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from "@repo/ui";
import {
  defaultTaskRecurrence,
  formatTaskRecurrence,
  TASK_WEEKDAYS,
} from "@repo/api/todex";
import type { TaskRecurrence, TaskWeekday } from "@repo/api/todex";

import { DatePicker } from "./task-pickers";
import { isoToDateInput } from "./task-helpers";

export function TaskRecurrencePicker({
  recurrence,
  scheduleDate,
  dueDate,
  onChange,
}: TaskRecurrencePickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<TaskRecurrence | null>(recurrence);
  const label = recurrence ? formatTaskRecurrence(recurrence) : "None";

  function openPicker(nextOpen: boolean) {
    if (nextOpen) {
      setDraft(
        recurrence ??
          defaultTaskRecurrence({
            scheduleDate,
            dueDate,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }),
      );
    }
    setOpen(nextOpen);
  }

  return (
    <Popover open={open} onOpenChange={openPicker}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={label}
          className={cn(
            "inline-flex h-8 max-w-full items-center truncate bg-transparent text-left text-sm hover:text-foreground",
            recurrence ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {label}
        </button>
      </PopoverTrigger>
      {draft ? (
        <PopoverContent className="w-80 p-3" align="start">
          <RecurrenceDraft
            draft={draft}
            scheduleDate={scheduleDate}
            dueDate={dueDate}
            canRemove={recurrence != null}
            onDraft={setDraft}
            onApply={() => {
              onChange(recurrenceForSave(draft));
              setOpen(false);
            }}
            onRemove={() => {
              onChange(null);
              setOpen(false);
            }}
          />
        </PopoverContent>
      ) : null}
    </Popover>
  );
}

function RecurrenceDraft({
  draft,
  scheduleDate,
  dueDate,
  canRemove,
  onDraft,
  onApply,
  onRemove,
}: {
  draft: TaskRecurrence;
  scheduleDate: string | null;
  dueDate: string | null;
  canRemove: boolean;
  onDraft: (draft: TaskRecurrence) => void;
  onApply: () => void;
  onRemove: () => void;
}) {
  const untilValue = draft.end.type === "until" ? draft.end.until : "";
  const canApply = draft.end.type !== "until" || untilValue.length === 10;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium">Repeat</p>
      <label className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">Every</span>
        <span className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={99}
            value={draft.interval}
            aria-label="Repeat interval"
            className="h-8 w-16 rounded-md border border-border bg-transparent px-2 text-sm"
            onChange={(event) => {
              const interval = Number(event.target.value);
              if (!Number.isInteger(interval)) return;
              onDraft({
                ...draft,
                interval: Math.min(99, Math.max(1, interval)),
              });
            }}
          />
          <Select
            value={draft.frequency}
            onValueChange={(value) =>
              onDraft(withFrequency(draft, value as TaskRecurrence["frequency"]))
            }
          >
            <SelectTrigger className="h-8 w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {draft.interval === 1 ? option.singular : option.plural}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </span>
      </label>
      {draft.frequency === "weekly" ? (
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">On</span>
          <div className="flex gap-1">
            {TASK_WEEKDAYS.map((weekday) => {
              const selected = draft.weekdays?.includes(weekday) ?? false;
              return (
                <button
                  key={weekday}
                  type="button"
                  aria-pressed={selected}
                  aria-label={WEEKDAY_NAME[weekday]}
                  className={cn(
                    "h-7 w-7 rounded-full text-xs",
                    selected
                      ? "bg-foreground text-background"
                      : "border border-border text-muted-foreground",
                  )}
                  onClick={() => onDraft(toggleWeekday(draft, weekday))}
                >
                  {WEEKDAY_LETTER[weekday]}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      <label className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">Ends</span>
        <Select
          value={draft.end.type}
          onValueChange={(value) =>
            onDraft({
              ...draft,
              end: endFor(
                value as TaskRecurrence["end"]["type"],
                draft,
                scheduleDate,
                dueDate,
              ),
            })
          }
        >
          <SelectTrigger className="h-8 w-[9.5rem]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="never">Never</SelectItem>
            <SelectItem value="count">After count</SelectItem>
            <SelectItem value="until">On date</SelectItem>
          </SelectContent>
        </Select>
      </label>
      {draft.end.type === "count" ? (
        <label className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">Times</span>
          <input
            type="number"
            min={1}
            max={999}
            value={draft.end.count}
            aria-label="Occurrences left, including this one"
            className="h-8 w-20 rounded-md border border-border bg-transparent px-2 text-sm"
            onChange={(event) => {
              const count = Number(event.target.value);
              if (!Number.isInteger(count) || draft.end.type !== "count") return;
              onDraft({
                ...draft,
                end: {
                  type: "count",
                  count: Math.min(999, Math.max(1, count)),
                },
              });
            }}
          />
        </label>
      ) : null}
      {draft.end.type === "until" ? (
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">Until</span>
          <DatePicker
            appearance="plain"
            emptyLabel="Pick a date"
            value={untilValue}
            onChange={(next) => {
              if (!next || draft.end.type !== "until") return;
              onDraft({ ...draft, end: { type: "until", until: next } });
            }}
          />
        </div>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Completing the task keeps it done and creates the next one. The count
        includes this occurrence.
      </p>
      <div className="flex items-center justify-end gap-2">
        {canRemove ? (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            Remove
          </Button>
        ) : null}
        <Button type="button" size="sm" disabled={!canApply} onClick={onApply}>
          Save
        </Button>
      </div>
    </div>
  );
}

function recurrenceForSave(draft: TaskRecurrence): TaskRecurrence {
  if (draft.frequency === "weekly") return draft;
  return {
    frequency: draft.frequency,
    interval: draft.interval,
    timeZone: draft.timeZone,
    end: draft.end,
  };
}

function withFrequency(
  draft: TaskRecurrence,
  frequency: TaskRecurrence["frequency"],
): TaskRecurrence {
  if (frequency === "weekly") {
    return {
      ...draft,
      frequency,
      weekdays: draft.weekdays?.length ? draft.weekdays : ["MO"],
    };
  }
  return { ...draft, frequency };
}

function toggleWeekday(draft: TaskRecurrence, weekday: TaskWeekday): TaskRecurrence {
  const current = draft.weekdays ?? [];
  const next = current.includes(weekday)
    ? current.filter((item) => item !== weekday)
    : [...current, weekday];
  const weekdays = TASK_WEEKDAYS.filter((item) => next.includes(item));
  if (weekdays.length === 0) return draft;
  return { ...draft, frequency: "weekly", weekdays: [...weekdays] };
}

function endFor(
  type: TaskRecurrence["end"]["type"],
  draft: TaskRecurrence,
  scheduleDate: string | null,
  dueDate: string | null,
): TaskRecurrence["end"] {
  if (type === "never") return { type: "never" };
  if (type === "count") {
    return {
      type: "count",
      count: draft.end.type === "count" ? draft.end.count : 5,
    };
  }
  return {
    type: "until",
    until:
      draft.end.type === "until" ? draft.end.until : defaultUntil(scheduleDate, dueDate),
  };
}

function defaultUntil(scheduleDate: string | null, dueDate: string | null): string {
  const anchor = isoToDateInput(scheduleDate ?? dueDate);
  const date = anchor ? dateFromInput(anchor) : new Date();
  date.setDate(date.getDate() + 28);
  return dateInput(date);
}

function dateFromInput(value: string): Date {
  const [yearText, monthText, dayText] = value.split("-");
  return new Date(Number(yearText), Number(monthText) - 1, Number(dayText));
}

function dateInput(date: Date): string {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const FREQUENCY_OPTIONS: Array<{
  value: TaskRecurrence["frequency"];
  singular: string;
  plural: string;
}> = [
  { value: "daily", singular: "day", plural: "days" },
  { value: "weekly", singular: "week", plural: "weeks" },
  { value: "monthly", singular: "month", plural: "months" },
  { value: "yearly", singular: "year", plural: "years" },
];

const WEEKDAY_LETTER: Record<TaskWeekday, string> = {
  SU: "S",
  MO: "M",
  TU: "T",
  WE: "W",
  TH: "T",
  FR: "F",
  SA: "S",
};

const WEEKDAY_NAME: Record<TaskWeekday, string> = {
  SU: "Sunday",
  MO: "Monday",
  TU: "Tuesday",
  WE: "Wednesday",
  TH: "Thursday",
  FR: "Friday",
  SA: "Saturday",
};

interface TaskRecurrencePickerProps {
  recurrence: TaskRecurrence | null;
  scheduleDate: string | null;
  dueDate: string | null;
  onChange: (recurrence: TaskRecurrence | null) => void;
}
