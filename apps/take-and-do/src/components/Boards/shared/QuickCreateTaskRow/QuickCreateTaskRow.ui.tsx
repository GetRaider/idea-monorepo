"use client";

import {
  type FocusEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { CalendarIcon, CalendarMonthIcon, ClockIcon } from "@/components/Icons";
import { Dropdown } from "@/components/Dropdown";
import { TaskStatusGlyph } from "@/components/TaskStatusGlyph";
import {
  EstimationInput,
  EstimationLabel,
} from "@/components/TaskView/TaskMetadata/TaskMetadata.ui";
import {
  DropdownContainer,
  DropdownItem,
  PriorityIconSpan,
} from "@/components/TaskView/TaskView.ui";
import { tasksHelper } from "@/helpers/task.helper";
import { useClickOutside } from "@/hooks/ui/useClickOutside";
import { cn } from "@/lib/styles/utils";

import { TaskPriority, TaskStatus } from "../../KanbanBoard/types";

import type { QuickCreateTaskRowBoardOption } from "./QuickCreateTaskRow.types";

const PRIORITY_OPTIONS: TaskPriority[] = Object.values(TaskPriority);
const STATUS_OPTIONS: TaskStatus[] = Object.values(TaskStatus);

interface StatusChipProps {
  value: TaskStatus;
  onChange: (next: TaskStatus) => void;
  disabled?: boolean;
}

export function StatusChip({ value, onChange, disabled }: StatusChipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  useClickOutside(wrapperRef, isOpen, () => setIsOpen(false));

  return (
    <div ref={wrapperRef} className="relative">
      <ChipButton
        disabled={disabled}
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <TaskStatusGlyph
          status={value}
          size={14}
          className={cn(
            value === TaskStatus.IN_PROGRESS
              ? "text-amber-500"
              : value === TaskStatus.DONE
                ? "text-emerald-500"
                : "text-text-tertiary",
          )}
        />
        <span>{tasksHelper.status.getName(value)}</span>
      </ChipButton>
      <DropdownContainer isOpen={isOpen} className="left-0">
        {STATUS_OPTIONS.map((option) => (
          <DropdownItem
            key={option}
            aria-current={option === value ? "true" : undefined}
            className={
              option === value
                ? "border-l-2 border-l-white/35 bg-white/[0.07] pl-2 text-text-primary"
                : undefined
            }
            onClick={(event) => {
              event.preventDefault();
              setIsOpen(false);
              onChange(option);
            }}
          >
            <span aria-hidden className="mr-2 inline-flex w-4 justify-center">
              <TaskStatusGlyph status={option} size={14} />
            </span>
            {tasksHelper.status.getName(option)}
          </DropdownItem>
        ))}
      </DropdownContainer>
    </div>
  );
}

interface PriorityChipProps {
  value: TaskPriority;
  onChange: (next: TaskPriority) => void;
  disabled?: boolean;
}

export function PriorityChip({ value, onChange, disabled }: PriorityChipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  useClickOutside(wrapperRef, isOpen, () => setIsOpen(false));

  return (
    <div ref={wrapperRef} className="relative">
      <ChipButton
        disabled={disabled}
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <span className="flex h-3.5 w-3.5 items-center justify-center text-sm leading-none">
          {tasksHelper.priority.getIconLabel(value)}
        </span>
        <span>{tasksHelper.priority.getName(value)}</span>
      </ChipButton>
      <DropdownContainer isOpen={isOpen} className="left-0">
        {PRIORITY_OPTIONS.map((option) => (
          <DropdownItem
            key={option}
            aria-current={option === value ? "true" : undefined}
            className={
              option === value
                ? "border-l-2 border-l-white/35 bg-white/[0.07] pl-2 text-text-primary"
                : undefined
            }
            onClick={(event) => {
              event.preventDefault();
              setIsOpen(false);
              onChange(option);
            }}
          >
            <PriorityIconSpan>
              {tasksHelper.priority.getIconLabel(option)}
            </PriorityIconSpan>
            {tasksHelper.priority.getName(option)}
          </DropdownItem>
        ))}
      </DropdownContainer>
    </div>
  );
}

interface ScheduleChipProps {
  value: Date | undefined;
  onChange: (next: Date | undefined) => void;
  disabled?: boolean;
}

export function ScheduleChip({ value, onChange, disabled }: ScheduleChipProps) {
  const [isEditing, setIsEditing] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  useClickOutside(wrapperRef, isEditing, () => setIsEditing(false));

  const inputValue = useMemo(
    () => (value ? toDateInputValue(value) : ""),
    [value],
  );

  if (isEditing) {
    return (
      <div ref={wrapperRef} className="relative">
        <input
          type="date"
          autoFocus
          value={inputValue}
          onChange={(event) => {
            const next = event.target.value
              ? parseDateInputValue(event.target.value)
              : undefined;
            onChange(next);
          }}
          onBlur={() => setIsEditing(false)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              setIsEditing(false);
            }
            if (event.key === "Escape") {
              event.preventDefault();
              setIsEditing(false);
            }
          }}
          className="rounded-full border border-input-border bg-input-bg px-2 py-1 text-xs text-text-primary outline-none focus-visible:border-input-border-hover"
        />
      </div>
    );
  }

  return (
    <ChipButton
      disabled={disabled}
      onClick={() => setIsEditing(true)}
      isActive={!!value}
    >
      <CalendarIcon size={12} />
      <span>
        {value
          ? tasksHelper.date.formatForSchedule(value) || "Schedule"
          : "Schedule"}
      </span>
      {value ? (
        <button
          type="button"
          aria-label="Clear schedule"
          onClick={(event) => {
            event.stopPropagation();
            onChange(undefined);
          }}
          className="ml-1 inline-flex h-3.5 w-3.5 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-text-tertiary transition-colors hover:bg-white/[0.07] hover:text-text-primary"
        >
          ×
        </button>
      ) : null}
    </ChipButton>
  );
}

interface DueDateChipProps {
  value: Date | undefined;
  onChange: (next: Date | undefined) => void;
  disabled?: boolean;
}

export function DueDateChip({ value, onChange, disabled }: DueDateChipProps) {
  const [isEditing, setIsEditing] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  useClickOutside(wrapperRef, isEditing, () => setIsEditing(false));

  const inputValue = useMemo(
    () => (value ? toDateInputValue(value) : ""),
    [value],
  );

  if (isEditing) {
    return (
      <div ref={wrapperRef} className="relative">
        <input
          type="date"
          autoFocus
          value={inputValue}
          onChange={(event) => {
            onChange(
              event.target.value
                ? parseDateInputValue(event.target.value)
                : undefined,
            );
          }}
          onBlur={() => setIsEditing(false)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === "Escape") {
              event.preventDefault();
              setIsEditing(false);
            }
          }}
          className="rounded-full border border-input-border bg-input-bg px-2 py-1 text-xs text-text-primary outline-none focus-visible:border-input-border-hover"
        />
      </div>
    );
  }

  return (
    <ChipButton
      disabled={disabled}
      onClick={() => setIsEditing(true)}
      isActive={!!value}
    >
      <CalendarMonthIcon size={12} />
      <span>
        {value ? tasksHelper.date.formatForDisplay(value) : "Due date"}
      </span>
      {value ? (
        <button
          type="button"
          aria-label="Clear due date"
          onClick={(event) => {
            event.stopPropagation();
            onChange(undefined);
          }}
          className="ml-1 inline-flex h-3.5 w-3.5 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-text-tertiary transition-colors hover:bg-white/[0.07] hover:text-text-primary"
        >
          ×
        </button>
      ) : null}
    </ChipButton>
  );
}

interface EstimationChipProps {
  value: number | undefined;
  onChange: (next: number | undefined) => void;
  disabled?: boolean;
}

export function EstimationChip({
  value,
  onChange,
  disabled,
}: EstimationChipProps) {
  const [isEditing, setIsEditing] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const parsed = useMemo(
    () => (value != null ? tasksHelper.estimation.parse(value) : null),
    [value],
  );
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);

  useEffect(() => {
    if (!isEditing) return;
    setDays(parsed?.days ?? 0);
    setHours(parsed?.hours ?? 0);
    setMinutes(parsed?.minutes ?? 0);
  }, [isEditing, parsed]);

  const save = useCallback(() => {
    const totalHours = tasksHelper.estimation.toTotalHours(
      days,
      hours,
      minutes,
    );
    onChange(totalHours > 0 ? totalHours : undefined);
    setIsEditing(false);
  }, [days, hours, minutes, onChange]);

  useClickOutside(wrapperRef, isEditing, () => {
    save();
  });

  const handleBlur = useCallback(
    (event: FocusEvent) => {
      const relatedTarget = event.relatedTarget as HTMLElement | null;
      if (relatedTarget && wrapperRef.current?.contains(relatedTarget)) return;
      save();
    },
    [save],
  );

  if (isEditing) {
    return (
      <div
        ref={wrapperRef}
        className="flex shrink-0 items-center gap-0.5 rounded-full border border-input-border bg-input-bg px-2 py-1 text-xs text-text-primary outline-none focus-within:border-input-border-hover"
      >
        <EstimationInput
          type="number"
          value={days || ""}
          onChange={(e) => setDays(parseInt(e.target.value) || 0)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              save();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              setIsEditing(false);
            }
          }}
          placeholder="0"
          min="0"
          className="w-6 px-0 py-0 text-[12px]"
        />
        <EstimationLabel>d</EstimationLabel>
        <EstimationInput
          type="number"
          value={hours || ""}
          onChange={(e) => setHours(parseInt(e.target.value) || 0)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              save();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              setIsEditing(false);
            }
          }}
          placeholder="0"
          min="0"
          max="23"
          autoFocus
          className="w-6 px-0 py-0 text-[12px]"
        />
        <EstimationLabel>h</EstimationLabel>
        <EstimationInput
          type="number"
          value={minutes || ""}
          onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              save();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              setIsEditing(false);
            }
          }}
          placeholder="0"
          min="0"
          max="59"
          className="w-7 px-0 py-0 text-[12px]"
        />
        <EstimationLabel>m</EstimationLabel>
      </div>
    );
  }

  return (
    <ChipButton
      disabled={disabled}
      onClick={() => setIsEditing(true)}
      isActive={value != null}
    >
      <ClockIcon size={12} />
      <span>
        {value != null ? tasksHelper.estimation.format(value) : "Estimate"}
      </span>
      {value != null ? (
        <button
          type="button"
          aria-label="Clear estimation"
          onClick={(event) => {
            event.stopPropagation();
            onChange(undefined);
          }}
          className="ml-1 inline-flex h-3.5 w-3.5 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-text-tertiary transition-colors hover:bg-white/[0.07] hover:text-text-primary"
        >
          ×
        </button>
      ) : null}
    </ChipButton>
  );
}

interface BoardChipProps {
  options: QuickCreateTaskRowBoardOption[];
  value: string | undefined;
  onChange: (next: string) => void;
  disabled?: boolean;
}

export function BoardChip({
  options,
  value,
  onChange,
  disabled,
}: BoardChipProps) {
  const dropdownOptions = useMemo(
    () =>
      options.map((option) => ({
        value: option.id,
        label: option.emoji ? `${option.emoji} ${option.name}` : option.name,
      })),
    [options],
  );

  return (
    <Dropdown<string>
      options={dropdownOptions}
      value={value}
      onChange={onChange}
      disabled={disabled}
      menuMinWidth={180}
      trigger={
        <ChipButton as="span" disabled={disabled}>
          <span aria-hidden>📋</span>
          <span>
            {options.find((option) => option.id === value)?.name ?? "Board"}
          </span>
        </ChipButton>
      }
    />
  );
}

type ChipButtonProps = {
  disabled?: boolean;
  isActive?: boolean;
  onClick?: () => void;
  children: ReactNode;
  as?: "button" | "span";
  "aria-haspopup"?: "menu";
  "aria-expanded"?: boolean;
};

function ChipButton({
  disabled,
  isActive,
  onClick,
  children,
  as = "button",
  ...aria
}: ChipButtonProps) {
  const className = cn(
    "inline-flex items-center gap-1.5 rounded-full border border-input-border bg-input-bg px-2.5 py-1 text-xs text-text-secondary transition-colors hover:border-input-border-hover hover:text-text-primary",
    isActive && "text-text-primary",
    disabled && "cursor-not-allowed opacity-60 hover:border-input-border",
  );
  if (as === "span") {
    return (
      <span className={className} {...aria}>
        {children}
      </span>
    );
  }
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(className, !disabled && "cursor-pointer")}
      {...aria}
    >
      {children}
    </button>
  );
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateInputValue(value: string): Date | undefined {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return date;
}
