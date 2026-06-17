"use client";

import { PlusIcon } from "@/components/Icons";
import { chromePrimaryButtonClassName } from "@/lib/styles/chrome-primary-button-classes";
import { cn } from "@/lib/styles/utils";

import { TaskPriority, TaskStatus } from "../../KanbanBoard/types";

import {
  BoardChip,
  DueDateChip,
  EstimationChip,
  PriorityChip,
  ScheduleChip,
  StatusChip,
} from "./QuickCreateTaskRow.ui";
import { useQuickCreateTaskRow } from "./useQuickCreateTaskRow";

import type { QuickCreateTaskRowProps } from "./QuickCreateTaskRow.types";

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
  const row = useQuickCreateTaskRow({
    onCreate,
    defaultStatus,
    defaultPriority,
    defaultScheduleDate,
    taskBoardId,
    boardOptions,
    defaultBoardId,
  });

  const {
    isExpanded,
    setIsExpanded,
    title,
    setTitle,
    status,
    setStatus,
    priority,
    setPriority,
    scheduleDate,
    setScheduleDate,
    dueDate,
    setDueDate,
    estimation,
    setEstimation,
    selectedBoardId,
    setSelectedBoardId,
    isSubmitting,
    inputRef,
    setContainerRef,
    handleSubmit,
    handleKeyDown,
    reset,
    isMultiBoard,
    resolvedBoardId,
    boardOptions: boardOptionsResolved,
  } = row;

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
        {isMultiBoard && boardOptionsResolved ? (
          <BoardChip
            options={boardOptionsResolved}
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
            className={cn(
              chromePrimaryButtonClassName,
              "cursor-pointer rounded-md px-3 py-1 text-xs font-medium",
            )}
          >
            {isSubmitting ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </form>
  );
}
