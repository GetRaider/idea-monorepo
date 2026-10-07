"use client";

import { Label } from "@repo/ui";

import { DatePicker } from "../tasks/task-pickers";
import {
  combineLocalDateAndTime,
  dateInputToLocalDayStartIso,
  isoToDateInput,
  isoToLocalTimeInput,
} from "../tasks/task-helpers";

export function CalendarWhenFields({
  allDay,
  start,
  end,
  disabled,
  onStart,
  onEnd,
}: {
  allDay: boolean;
  start: string;
  end: string;
  disabled?: boolean;
  onStart: (iso: string) => void;
  onEnd: (iso: string) => void;
}) {
  return (
    <>
      <WhenField
        label="Starts"
        allDay={allDay}
        iso={start}
        disabled={disabled}
        onChange={onStart}
      />
      <WhenField
        label="Ends"
        allDay={allDay}
        iso={end}
        disabled={disabled}
        onChange={onEnd}
      />
    </>
  );
}

function WhenField({
  label,
  allDay,
  iso,
  disabled,
  onChange,
}: {
  label: string;
  allDay: boolean;
  iso: string;
  disabled?: boolean;
  onChange: (iso: string) => void;
}) {
  const date = isoToDateInput(iso);
  const time = isoToLocalTimeInput(iso) || "09:00";

  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <DatePicker
          appearance="plain"
          emptyLabel="Date"
          value={date}
          disabled={disabled}
          onChange={(next) => {
            if (!next) return;
            const resolved = allDay
              ? dateInputToLocalDayStartIso(next)
              : combineLocalDateAndTime(next, time);
            if (resolved) onChange(resolved);
          }}
        />
        {allDay ? null : (
          <input
            type="time"
            aria-label={`${label} time`}
            value={time}
            disabled={disabled || !date}
            className="bg-transparent text-sm text-foreground disabled:opacity-40"
            onChange={(event) => {
              const resolved = combineLocalDateAndTime(date, event.target.value);
              if (resolved) onChange(resolved);
            }}
          />
        )}
      </div>
    </div>
  );
}
