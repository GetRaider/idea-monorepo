"use client";

import { useEffect, useState, type FormEvent, type ReactNode, type RefObject } from "react";
import { Button, Input, cn } from "@repo/ui";
import { TaskPriority, TaskStatus } from "@repo/api/todex";
import type { Task } from "@repo/api/todex";

import { PlusIcon } from "@components/icons";

import {
  DateChip,
  EstimationChip,
  PriorityChip,
  StatusChip,
} from "./task-chips";
import { TASKS_CREATE_TASK_EVENT } from "./task-create-events";
import type { CreateTaskInput } from "./tasks-provider";

export function QuickCreateTaskRow({
  disabled,
  inputRef,
  leading,
  defaultScheduleDate,
  onCreate,
}: QuickCreateTaskRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState<Task["status"]>(TaskStatus.TODO);
  const [priority, setPriority] = useState<Task["priority"]>(
    TaskPriority.MEDIUM,
  );
  const [scheduleDate, setScheduleDate] = useState<string | null>(
    defaultScheduleDate,
  );
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [estimation, setEstimation] = useState<number | null>(null);

  useEffect(() => {
    const expand = () => {
      if (disabled) return;
      setIsExpanded(true);
    };
    window.addEventListener(TASKS_CREATE_TASK_EVENT, expand);
    return () => window.removeEventListener(TASKS_CREATE_TASK_EVENT, expand);
  }, [disabled]);

  useEffect(() => {
    if (!isExpanded) return;
    inputRef.current?.focus();
  }, [inputRef, isExpanded]);

  const reset = () => {
    setSummary("");
    setStatus(TaskStatus.TODO);
    setPriority(TaskPriority.MEDIUM);
    setScheduleDate(defaultScheduleDate);
    setDueDate(null);
    setEstimation(null);
    setIsExpanded(false);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!summary.trim() || disabled) return;
    onCreate({
      summary: summary.trim(),
      status,
      priority,
      scheduleDate,
      dueDate,
      estimation,
    });
    reset();
  };

  if (!isExpanded) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsExpanded(true)}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-left text-sm text-muted-foreground transition-colors",
          disabled
            ? "cursor-not-allowed opacity-60"
            : "hover:border-ring hover:bg-surface hover:text-foreground",
        )}
      >
        <PlusIcon size={14} />
        Create a new task
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="flex w-full flex-col gap-2 rounded-lg border border-border bg-background px-3 py-2"
      onPointerDown={(event) => event.stopPropagation()}
    >
      {leading}
      <Input
        ref={inputRef}
        value={summary}
        onChange={(event) => setSummary(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          reset();
        }}
        placeholder="Task name…"
        disabled={disabled}
        className="h-auto border-0 px-0 shadow-none focus-visible:ring-0"
        aria-label="Task name"
      />
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusChip status={status} onChange={setStatus} />
        <PriorityChip priority={priority} onChange={setPriority} />
        <DateChip
          value={scheduleDate}
          emptyLabel="Schedule"
          onChange={setScheduleDate}
        />
        <DateChip value={dueDate} emptyLabel="Due" onChange={setDueDate} />
        <EstimationChip value={estimation} onChange={setEstimation} />
        <div className="ml-auto flex items-center gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={reset}
            disabled={disabled}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={disabled || !summary.trim()}>
            Add
          </Button>
        </div>
      </div>
    </form>
  );
}

interface QuickCreateTaskRowProps {
  disabled: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  leading?: ReactNode;
  defaultScheduleDate: string | null;
  onCreate: (input: CreateTaskInput) => void;
}
