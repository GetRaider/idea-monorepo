"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  cn,
} from "@repo/ui";
import { formatEstimation, parseEstimation, TaskPriority, TaskStatus } from "@repo/api/todex";
import type { Task } from "@repo/api/todex";

import { CalendarIcon, ClockIcon } from "@components/icons";

import { PRIORITY_DOT, StatusGlyph } from "./task-board.ui";
import {
  PRIORITY_LABEL,
  STATUS_LABEL,
  dateInputToLocalDayStartIso,
  formatScheduleLabel,
  isoToDateInput,
} from "./task-helpers";

export function StatusChip({
  status,
  onChange,
}: {
  status: Task["status"];
  onChange: (status: Task["status"]) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ChipButton aria-label={`Status ${STATUS_LABEL[status]}`}>
          <StatusGlyph status={status} />
          {STATUS_LABEL[status]}
        </ChipButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        <DropdownMenuRadioGroup
          value={status}
          onValueChange={(value) => onChange(value as Task["status"])}
        >
          {Object.values(TaskStatus).map((value) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <StatusGlyph status={value} />
              <span className="ml-2">{STATUS_LABEL[value]}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PriorityChip({
  priority,
  onChange,
}: {
  priority: Task["priority"];
  onChange: (priority: Task["priority"]) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ChipButton aria-label={`Priority ${PRIORITY_LABEL[priority]}`}>
          <span
            className={cn("h-2 w-2 rounded-full", PRIORITY_DOT[priority])}
          />
          {PRIORITY_LABEL[priority]}
        </ChipButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-36">
        <DropdownMenuRadioGroup
          value={priority}
          onValueChange={(value) => onChange(value as Task["priority"])}
        >
          {Object.values(TaskPriority).map((value) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <span
                className={cn("mr-2 h-2 w-2 rounded-full", PRIORITY_DOT[value])}
              />
              {PRIORITY_LABEL[value]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DateChip({
  value,
  emptyLabel,
  onChange,
}: {
  value: string | null;
  emptyLabel: string;
  onChange: (next: string | null) => void;
}) {
  const label = formatScheduleLabel(value) ?? emptyLabel;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <ChipButton isActive={!!value} aria-label={emptyLabel}>
          <CalendarIcon size={12} />
          {label}
        </ChipButton>
      </PopoverTrigger>
      <PopoverContent>
        <Input
          type="date"
          value={isoToDateInput(value)}
          onChange={(event) =>
            onChange(dateInputToLocalDayStartIso(event.target.value))
          }
        />
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 w-full"
            onClick={() => onChange(null)}
          >
            Clear
          </Button>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

export function EstimationChip({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (next: number | null) => void;
}) {
  const text = formatEstimation(value);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <ChipButton isActive={value != null} aria-label="Estimate">
          <ClockIcon size={12} />
          {text || "Estimate"}
        </ChipButton>
      </PopoverTrigger>
      <PopoverContent>
        <Input
          key={text}
          placeholder="1h, 30m, 2d"
          defaultValue={text}
          onBlur={(event) => {
            const nextText = event.target.value.trim();
            if (!nextText) {
              onChange(null);
              return;
            }
            const parsed = parseEstimation(nextText);
            if (parsed == null) return;
            onChange(parsed);
          }}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.currentTarget.blur();
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function ChipButton({
  isActive,
  className,
  children,
  ...props
}: ChipButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground",
        isActive && "text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

interface ChipButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
  children: ReactNode;
}
