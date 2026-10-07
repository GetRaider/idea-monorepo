"use client";

import { useRef, useState } from "react";
import {
  Button,
  Calendar,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  cn,
} from "@repo/ui";

import { CalendarIcon, ClockIcon } from "@components/icons";

const ESTIMATE_PRESETS = ["15m", "30m", "1h", "2h", "4h", "1d"] as const;

export function DatePicker({
  emptyLabel,
  value,
  onChange,
  appearance = "chip",
  disabled,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = dateInputToDate(value);

  return (
    <Popover open={open} onOpenChange={(next) => setOpen(disabled ? false : next)}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            appearance === "chip"
              ? "inline-flex items-center gap-1.5 rounded-full border border-border bg-transparent px-2.5 py-1 text-xs hover:text-foreground"
              : "inline-flex h-8 items-center gap-2 bg-transparent text-sm hover:text-foreground",
            value ? "text-foreground" : "text-muted-foreground",
            disabled && "opacity-40",
          )}
        >
          {appearance === "chip" ? <CalendarIcon size={12} /> : null}
          {selected ? formatDay(selected) : emptyLabel}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            onChange(date ? dateToDateInput(date) : "");
            setOpen(false);
          }}
        />
        {value ? (
          <div className="border-t border-border p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              Clear
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

export function EstimatePicker({
  value,
  onChange,
  onCommit,
  appearance = "chip",
}: EstimatePickerProps) {
  const [open, setOpen] = useState(false);
  const valueRef = useRef(value);
  valueRef.current = value;

  function apply(next: string) {
    valueRef.current = next;
    onChange(next);
    onCommit?.(next);
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) onCommit?.(valueRef.current);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            appearance === "chip"
              ? "inline-flex items-center gap-1.5 rounded-full border border-border bg-transparent px-2.5 py-1 text-xs hover:text-foreground"
              : "inline-flex h-8 items-center bg-transparent text-sm hover:text-foreground",
            value.trim() ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {appearance === "chip" ? <ClockIcon size={12} /> : null}
          {value.trim() || "Estimate"}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="start">
        <div className="grid grid-cols-3 gap-1">
          {ESTIMATE_PRESETS.map((preset) => (
            <Button
              key={preset}
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-8",
                value.trim() === preset && "bg-accent text-accent-foreground",
              )}
              onClick={() => apply(preset)}
            >
              {preset}
            </Button>
          ))}
        </div>
        <Input
          aria-label="Estimate"
          value={value}
          placeholder="1h 30m"
          className="mt-2 h-8"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              apply(valueRef.current);
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function dateInputToDate(value: string): Date | undefined {
  if (!value) return undefined;
  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

function dateToDateInput(date: Date): string {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDay(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface DatePickerProps {
  emptyLabel: string;
  value: string;
  onChange: (value: string) => void;
  appearance?: "chip" | "plain";
  disabled?: boolean;
}

interface EstimatePickerProps {
  value: string;
  onChange: (value: string) => void;
  onCommit?: (value: string) => void;
  appearance?: "chip" | "plain";
}
