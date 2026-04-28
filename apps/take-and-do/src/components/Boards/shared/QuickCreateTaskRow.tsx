"use client";

import {
  type FocusEvent,
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  CalendarIcon,
  CalendarMonthIcon,
  ClockIcon,
  PlusIcon,
} from "@/components/Icons";
import { Dropdown } from "@/components/Dropdown";
import { tasksHelper } from "@/helpers/task.helper";
import { useClickOutside } from "@/hooks/ui/useClickOutside";
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
import { cn } from "@/lib/styles/utils";

import { TaskPriority, TaskStatus } from "../KanbanBoard/types";

const PRIORITY_OPTIONS: TaskPriority[] = Object.values(TaskPriority);
const STATUS_OPTIONS: TaskStatus[] = Object.values(TaskStatus);

const QUICK_CREATE_DRAFT_VERSION = 1 as const;

type QuickCreateStoredDraft = {
  v: typeof QUICK_CREATE_DRAFT_VERSION;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  scheduleDateISO?: string;
  dueDateISO?: string;
  estimation?: number;
  selectedBoardId?: string;
};

function sameCalendarDay(a: Date | undefined, b: Date | undefined): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export interface QuickCreateTaskInput {
  summary: string;
  priority: TaskPriority;
  status: TaskStatus;
  scheduleDate?: Date;
  dueDate?: Date;
  estimation?: number;
  taskBoardId: string;
}

export interface QuickCreateTaskRowBoardOption {
  id: string;
  name: string;
  emoji?: string | null;
}

export interface QuickCreateTaskRowProps {
  /** Submit handler — should resolve once the create has been persisted. */
  onCreate: (input: QuickCreateTaskInput) => Promise<void> | void;
  /** Status the new task lands in. Defaults to TaskStatus.TODO. */
  defaultStatus?: TaskStatus;
  defaultPriority?: TaskPriority;
  defaultScheduleDate?: Date;
  /**
   * Single-board mode: the board id used for every created task.
   * Multi-board mode: leave undefined and pass `boardOptions` instead.
   */
  taskBoardId?: string;
  /** When provided, a board picker chip is shown next to priority/schedule. */
  boardOptions?: QuickCreateTaskRowBoardOption[];
  /** Default selected board for multi-board mode. */
  defaultBoardId?: string;
  /** Label for the collapsed row. Defaults to "Create a new task". */
  triggerLabel?: string;
  className?: string;
}

export function QuickCreateTaskRow({
  onCreate,
  defaultStatus = TaskStatus.TODO,
  defaultPriority = TaskPriority.MEDIUM,
  defaultScheduleDate,
  taskBoardId,
  boardOptions,
  defaultBoardId,
  triggerLabel = "Create a new task",
  className,
}: QuickCreateTaskRowProps) {
  const isMultiBoard = !!boardOptions && boardOptions.length > 0;
  const draftStorageKey = useMemo(
    () =>
      `take-and-do:quick-create-draft:${isMultiBoard ? "multi" : (taskBoardId ?? "unknown")}`,
    [isMultiBoard, taskBoardId],
  );

  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>(defaultPriority);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(
    defaultScheduleDate,
  );
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [estimation, setEstimation] = useState<number | undefined>(undefined);
  const [selectedBoardId, setSelectedBoardId] = useState<string | undefined>(
    defaultBoardId ?? boardOptions?.[0]?.id ?? taskBoardId,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const setContainerRef = useCallback((node: HTMLElement | null) => {
    containerRef.current = node;
  }, []);

  useEffect(() => {
    setSelectedBoardId(defaultBoardId ?? boardOptions?.[0]?.id ?? taskBoardId);
  }, [defaultBoardId, boardOptions, taskBoardId]);

  useEffect(() => {
    setScheduleDate(defaultScheduleDate);
  }, [defaultScheduleDate]);

  const reset = useCallback(
    (options?: { removeStoredDraft?: boolean }) => {
      const removeStoredDraft = options?.removeStoredDraft !== false;
      setTitle("");
      setStatus(defaultStatus);
      setPriority(defaultPriority);
      setScheduleDate(defaultScheduleDate);
      setDueDate(undefined);
      setEstimation(undefined);
      setSelectedBoardId(
        defaultBoardId ?? boardOptions?.[0]?.id ?? taskBoardId,
      );
      setIsExpanded(false);
      if (removeStoredDraft && typeof window !== "undefined") {
        try {
          window.localStorage.removeItem(draftStorageKey);
        } catch {
          /* ignore */
        }
      }
    },
    [
      defaultBoardId,
      boardOptions,
      taskBoardId,
      defaultPriority,
      defaultScheduleDate,
      defaultStatus,
      draftStorageKey,
    ],
  );

  const hasDraftContent = useCallback(() => {
    const defaultBoard = defaultBoardId ?? boardOptions?.[0]?.id ?? taskBoardId;
    return (
      title.trim() !== "" ||
      status !== defaultStatus ||
      priority !== defaultPriority ||
      dueDate != null ||
      estimation != null ||
      !sameCalendarDay(scheduleDate, defaultScheduleDate) ||
      (isMultiBoard && selectedBoardId !== defaultBoard)
    );
  }, [
    title,
    status,
    defaultStatus,
    priority,
    defaultPriority,
    dueDate,
    estimation,
    scheduleDate,
    defaultScheduleDate,
    isMultiBoard,
    selectedBoardId,
    defaultBoardId,
    boardOptions,
    taskBoardId,
  ]);

  const persistDraftToStorage = useCallback(() => {
    if (typeof window === "undefined") return;
    const payload: QuickCreateStoredDraft = {
      v: QUICK_CREATE_DRAFT_VERSION,
      title,
      status,
      priority,
      scheduleDateISO: scheduleDate?.toISOString(),
      dueDateISO: dueDate?.toISOString(),
      estimation,
      selectedBoardId,
    };
    try {
      window.localStorage.setItem(draftStorageKey, JSON.stringify(payload));
    } catch {
      /* ignore quota / private mode */
    }
  }, [
    draftStorageKey,
    title,
    status,
    priority,
    scheduleDate,
    dueDate,
    estimation,
    selectedBoardId,
  ]);

  useClickOutside(containerRef, isExpanded, () => {
    if (hasDraftContent()) {
      persistDraftToStorage();
    } else if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(draftStorageKey);
      } catch {
        /* ignore */
      }
    }
    reset({ removeStoredDraft: false });
  });

  const draftHydratedForOpenRef = useRef(false);

  useEffect(() => {
    if (!isExpanded) {
      draftHydratedForOpenRef.current = false;
      return;
    }
    if (draftHydratedForOpenRef.current) {
      queueMicrotask(() => inputRef.current?.focus());
      return;
    }
    draftHydratedForOpenRef.current = true;
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem(draftStorageKey);
        if (raw) {
          const parsed = JSON.parse(raw) as QuickCreateStoredDraft;
          if (parsed.v === QUICK_CREATE_DRAFT_VERSION) {
            setTitle(parsed.title ?? "");
            if (parsed.status) setStatus(parsed.status);
            if (parsed.priority) setPriority(parsed.priority);
            setScheduleDate(
              parsed.scheduleDateISO
                ? new Date(parsed.scheduleDateISO)
                : defaultScheduleDate,
            );
            setDueDate(
              parsed.dueDateISO ? new Date(parsed.dueDateISO) : undefined,
            );
            setEstimation(parsed.estimation);
            if (isMultiBoard && parsed.selectedBoardId && boardOptions) {
              const allowed = boardOptions.some(
                (b) => b.id === parsed.selectedBoardId,
              );
              if (allowed) setSelectedBoardId(parsed.selectedBoardId);
            }
          }
        }
      } catch {
        /* ignore */
      }
    }
    queueMicrotask(() => inputRef.current?.focus());
  }, [
    isExpanded,
    draftStorageKey,
    isMultiBoard,
    boardOptions,
    defaultScheduleDate,
  ]);

  const resolvedBoardId = isMultiBoard ? selectedBoardId : taskBoardId;

  const handleSubmit = useCallback(
    async (event?: FormEvent) => {
      event?.preventDefault();
      const trimmed = title.trim();
      if (!trimmed || !resolvedBoardId || isSubmitting) return;
      setIsSubmitting(true);
      try {
        await onCreate({
          summary: trimmed,
          priority,
          status,
          scheduleDate,
          dueDate,
          estimation,
          taskBoardId: resolvedBoardId,
        });
        reset();
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      title,
      resolvedBoardId,
      isSubmitting,
      onCreate,
      status,
      priority,
      scheduleDate,
      dueDate,
      estimation,
      reset,
    ],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        reset();
      }
    },
    [reset],
  );

  if (!isExpanded) {
    return (
      <button
        type="button"
        ref={setContainerRef}
        onClick={() => setIsExpanded(true)}
        className={cn(
          "quick-create-appear group flex w-full cursor-pointer items-center gap-2 rounded-lg border border-dashed border-input-border bg-transparent px-4 py-3 text-left text-sm text-text-tertiary transition-colors duration-200 hover:border-focus-ring hover:bg-focus-ring/[0.06] hover:text-focus-ring focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
          className,
        )}
        aria-label={triggerLabel}
      >
        <PlusIcon
          size={16}
          className="text-text-tertiary transition-colors group-hover:text-focus-ring"
        />
        <span>{triggerLabel}</span>
      </button>
    );
  }

  return (
    <form
      ref={setContainerRef}
      onSubmit={handleSubmit}
      className={cn(
        "flex w-full flex-col gap-2 rounded-lg border border-input-border bg-background-secondary/40 px-3 py-2 shadow-sm transition-colors focus-within:border-focus-ring/70",
        className,
      )}
    >
      <input
        ref={inputRef}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Task name…"
        className="m-0 w-full appearance-none border-0 bg-transparent p-0 text-sm font-medium text-text-primary outline-none placeholder:text-text-tertiary"
        aria-label="Task name"
        disabled={isSubmitting}
      />

      <div className="flex flex-wrap items-center gap-1.5">
        <StatusChip
          value={status}
          onChange={setStatus}
          disabled={isSubmitting}
        />
        <PriorityChip
          value={priority}
          onChange={setPriority}
          disabled={isSubmitting}
        />
        <ScheduleChip
          value={scheduleDate}
          onChange={setScheduleDate}
          disabled={isSubmitting}
        />
        <DueDateChip
          value={dueDate}
          onChange={setDueDate}
          disabled={isSubmitting}
        />
        <EstimationChip
          value={estimation}
          onChange={setEstimation}
          disabled={isSubmitting}
        />
        {isMultiBoard ? (
          <BoardChip
            options={boardOptions!}
            value={selectedBoardId}
            onChange={setSelectedBoardId}
            disabled={isSubmitting}
          />
        ) : null}
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => reset()}
            disabled={isSubmitting}
            className="cursor-pointer rounded-md border-0 bg-transparent px-2.5 py-1 text-xs text-text-secondary transition-colors hover:bg-white/[0.04] hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim() || !resolvedBoardId || isSubmitting}
            className="cursor-pointer rounded-md border-0 bg-[#7255c1] px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-[#6346b0] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </form>
  );
}

interface StatusChipProps {
  value: TaskStatus;
  onChange: (next: TaskStatus) => void;
  disabled?: boolean;
}

function StatusChip({ value, onChange, disabled }: StatusChipProps) {
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
                ? "border-l-2 border-l-indigo-400/70 bg-white/[0.07] pl-2 text-white"
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

function PriorityChip({ value, onChange, disabled }: PriorityChipProps) {
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
                ? "border-l-2 border-l-indigo-400/70 bg-white/[0.07] pl-2 text-white"
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

function ScheduleChip({ value, onChange, disabled }: ScheduleChipProps) {
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

function DueDateChip({ value, onChange, disabled }: DueDateChipProps) {
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

function EstimationChip({ value, onChange, disabled }: EstimationChipProps) {
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

function BoardChip({ options, value, onChange, disabled }: BoardChipProps) {
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
  children: React.ReactNode;
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
