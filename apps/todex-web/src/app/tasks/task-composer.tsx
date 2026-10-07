"use client";

import { useState, useEffect, type ComponentProps, type FormEvent, type ReactNode } from "react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  cn,
} from "@repo/ui";
import { parseEstimation, TaskPriority, TaskStatus } from "@repo/api/todex";
import type { Task } from "@repo/api/todex";

import { PlusIcon } from "@components/icons";

import { PriorityGlyph, StatusGlyph } from "./task-board.ui";
import { DatePicker, EstimatePicker } from "./task-pickers";
import {
  dateInputToLocalDayStartIso,
  dateInputToScheduleIso,
  STATUS_LABEL,
  STATUS_ORDER,
} from "./task-helpers";

export function TaskComposer({
  titleRef,
  boards,
  defaultBoardId,
  defaultScheduleDate = "",
  open = false,
  onOpenChange,
  onCreate,
}: {
  titleRef?: ComponentProps<"input">["ref"];
  boards?: ComposerBoard[];
  defaultBoardId?: string | null;
  defaultScheduleDate?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCreate: (values: TaskComposerValues) => void;
}) {
  const [summary, setSummary] = useState("");
  const [estimationText, setEstimationText] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>(TaskPriority.MEDIUM);
  const [status, setStatus] = useState<Task["status"]>(TaskStatus.TODO);
  const [scheduleDate, setScheduleDate] = useState(defaultScheduleDate);
  const [dueDate, setDueDate] = useState("");
  const [taskBoardId, setTaskBoardId] = useState(
    defaultBoardId ?? boards?.[0]?.id ?? "",
  );
  const [estimationInvalid, setEstimationInvalid] = useState(false);
  const showBoardSelect = (boards?.length ?? 0) > 1;

  useEffect(() => {
    if (defaultBoardId) setTaskBoardId(defaultBoardId);
  }, [defaultBoardId]);

  useEffect(() => {
    setScheduleDate(defaultScheduleDate);
  }, [defaultScheduleDate]);

  function reset() {
    setSummary("");
    setEstimationText("");
    setPriority(TaskPriority.MEDIUM);
    setStatus(TaskStatus.TODO);
    setScheduleDate(defaultScheduleDate);
    setDueDate("");
    setEstimationInvalid(false);
    onOpenChange?.(false);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextSummary = summary.trim();
    const parsedEstimation = parseEstimation(estimationText);
    const invalid = estimationText.trim() !== "" && parsedEstimation === null;
    setEstimationInvalid(invalid);
    if (!nextSummary || invalid) return;
    if (showBoardSelect && !taskBoardId) return;
    onCreate({
      summary: nextSummary,
      status,
      priority,
      estimation: estimationText.trim() ? parsedEstimation : null,
      taskBoardId: taskBoardId || null,
      scheduleDate: dateInputToScheduleIso(scheduleDate),
      dueDate: dateInputToLocalDayStartIso(dueDate),
    });
    reset();
  }

  if (!open) {
    return (
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border bg-transparent px-4 py-3 text-left text-sm text-muted-foreground hover:bg-surface hover:text-foreground"
        onClick={() => onOpenChange?.(true)}
      >
        <PlusIcon size={16} />
        Create a new task
      </button>
    );
  }

  return (
    <form
      className="flex w-full flex-col gap-2 rounded-lg border border-border bg-panel px-3 py-2"
      onSubmit={handleSubmit}
      onKeyDown={(event) => {
        if (event.key === "Escape") reset();
      }}
    >
      <input
        ref={titleRef}
        autoFocus
        aria-label="Task name"
        value={summary}
        placeholder="Task name…"
        className="w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground"
        onChange={(event) => setSummary(event.target.value)}
      />
      <div className="flex flex-wrap items-center gap-1.5">
        <ChoiceChip label={STATUS_LABEL[status]} menuLabel="Status">
          {STATUS_ORDER.map((option) => (
            <DropdownMenuItem key={option} onSelect={() => setStatus(option)}>
              <StatusGlyph status={option} />
              {STATUS_LABEL[option]}
            </DropdownMenuItem>
          ))}
        </ChoiceChip>
        <ChoiceChip
          label={
            <span className="inline-flex items-center gap-1">
              <PriorityGlyph priority={priority} />
              {PRIORITY_LABEL[priority]}
            </span>
          }
          menuLabel="Priority"
        >
          {PRIORITY_OPTIONS.map((option) => (
            <DropdownMenuItem key={option} onSelect={() => setPriority(option)}>
              <PriorityGlyph priority={option} />
              {PRIORITY_LABEL[option]}
            </DropdownMenuItem>
          ))}
        </ChoiceChip>
        <DatePicker
          emptyLabel="Schedule"
          value={scheduleDate}
          onChange={setScheduleDate}
        />
        <DatePicker
          emptyLabel="Due date"
          value={dueDate}
          onChange={setDueDate}
        />
        <EstimatePicker
          value={estimationText}
          onChange={(next) => {
            setEstimationText(next);
            setEstimationInvalid(false);
          }}
        />
        {showBoardSelect ? (
          <ChoiceChip
            label={boards?.find((board) => board.id === taskBoardId)?.name ?? "Board"}
            menuLabel="Board"
          >
            {boards?.map((board) => (
              <DropdownMenuItem
                key={board.id}
                onSelect={() => setTaskBoardId(board.id)}
              >
                {board.name}
              </DropdownMenuItem>
            ))}
          </ChoiceChip>
        ) : null}
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            className="rounded-md px-2.5 py-1 text-xs text-muted-foreground hover:bg-surface hover:text-foreground"
            onClick={reset}
          >
            Cancel
          </button>
          <Button
            type="submit"
            size="sm"
            className="h-7 px-3 text-xs"
            disabled={!summary.trim()}
          >
            Create
          </Button>
        </div>
      </div>
      {estimationInvalid ? (
        <p className="text-xs text-destructive">Use 1h, 30m, or 2d</p>
      ) : null}
    </form>
  );
}

function ChoiceChip({
  label,
  menuLabel,
  children,
}: {
  label: ReactNode;
  menuLabel: string;
  children: ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ChipButton aria-label={menuLabel}>{label}</ChipButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">{children}</DropdownMenuContent>
    </DropdownMenu>
  );
}

function ChipButton({
  className,
  ...props
}: ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-transparent px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

const PRIORITY_OPTIONS = [
  TaskPriority.LOW,
  TaskPriority.MEDIUM,
  TaskPriority.HIGH,
  TaskPriority.CRITICAL,
] as const;

const PRIORITY_LABEL: Record<Task["priority"], string> = {
  [TaskPriority.LOW]: "Low",
  [TaskPriority.MEDIUM]: "Medium",
  [TaskPriority.HIGH]: "High",
  [TaskPriority.CRITICAL]: "Critical",
};

interface ComposerBoard {
  id: string;
  name: string;
}

export interface TaskComposerValues {
  summary: string;
  status: Task["status"];
  priority: Task["priority"];
  estimation: number | null;
  taskBoardId: string | null;
  scheduleDate: string | null;
  dueDate: string | null;
}
