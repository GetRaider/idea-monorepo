"use client";

import { Dropdown } from "@/components/Dropdown";
import { TaskStatusGlyph } from "@/components/TaskStatusGlyph";
import { cn } from "@/lib/styles/utils";
import { tasksHelper } from "@/helpers/task.helper";
import type { Task } from "@/types/task";

import {
  CAL_PANEL_BODY_GUTTER,
  TASK_DRAG_DURATION_MINUTES,
} from "./calendar-panel.constants";

export function CalendarPanelTasksBody({
  boardOptions,
  selectedBoardId,
  onSelectedBoardIdChange,
  isBoardsLoading,
  tasksLoading,
  sortedBoardTasks,
  boardTasksCount,
}: CalendarPanelTasksBodyProps) {
  return (
    <div className={cn("space-y-2", CAL_PANEL_BODY_GUTTER)}>
      <Dropdown
        fullWidth
        options={boardOptions}
        value={selectedBoardId || undefined}
        onChange={onSelectedBoardIdChange}
        placeholder={getBoardDropdownPlaceholder(isBoardsLoading)}
        disabled={isBoardsLoading || boardOptions.length === 0}
      />
      <CalendarPanelTasksBodyContent
        selectedBoardId={selectedBoardId}
        isBoardsLoading={isBoardsLoading}
        tasksLoading={tasksLoading}
        sortedBoardTasks={sortedBoardTasks}
        boardTasksCount={boardTasksCount}
      />
      {!isBoardsLoading && boardOptions.length === 0 ? (
        <p className="text-xs leading-snug text-zinc-500">
          Create a task board under Tasks to drag work onto the calendar.
        </p>
      ) : null}
    </div>
  );
}

function CalendarPanelTasksBodyContent({
  selectedBoardId,
  isBoardsLoading,
  tasksLoading,
  sortedBoardTasks,
  boardTasksCount,
}: CalendarPanelTasksBodyContentProps) {
  const view = resolveCalendarPanelTasksBodyView({
    selectedBoardId,
    isBoardsLoading,
    tasksLoading,
    sortedBoardTasksCount: sortedBoardTasks.length,
  });

  if (view === "pick-board") {
    return (
      <p className="text-xs leading-snug text-zinc-500">
        Choose a board to list tasks you can drag to the grid.
      </p>
    );
  }

  if (view === "loading") {
    return <p className="text-xs text-zinc-500">Loading tasks…</p>;
  }

  if (view === "empty") {
    return (
      <p className="text-xs text-zinc-500">
        {getEmptyBoardTasksMessage(boardTasksCount)}
      </p>
    );
  }

  return (
    <ul className="flex max-h-[220px] min-h-[60px] flex-col gap-2 overflow-y-auto pr-0.5">
      {sortedBoardTasks.map((task) => (
        <li key={task.id}>
          <div
            className="calendar-panel-task-draggable cursor-grab rounded-lg border border-white/10 bg-input-bg/90 px-3 py-2 transition-colors hover:border-white/18 active:cursor-grabbing"
            data-calendar-task-board-id={task.taskBoardId}
            data-calendar-task-id={task.id}
            data-calendar-task-title={task.summary}
            data-calendar-task-summary-snapshot={task.summary}
            data-calendar-task-duration-minutes={String(
              TASK_DRAG_DURATION_MINUTES,
            )}
            title={`${task.status} · ${tasksHelper.priority.getName(
              tasksHelper.priority.format(task.priority),
            )}`}
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="inline-flex shrink-0 items-center justify-center"
                aria-hidden
              >
                <TaskStatusGlyph status={task.status} size={14} />
              </span>
              <span
                className="flex shrink-0 items-center justify-center text-[13px] leading-none"
                aria-hidden
              >
                {tasksHelper.priority.getIconLabel(
                  tasksHelper.priority.format(task.priority),
                )}
              </span>
              <div className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">
                {task.summary}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function resolveCalendarPanelTasksBodyView({
  selectedBoardId,
  isBoardsLoading,
  tasksLoading,
  sortedBoardTasksCount,
}: ResolveCalendarPanelTasksBodyViewInput): CalendarPanelTasksBodyView {
  if (!selectedBoardId) return "pick-board";
  if (isBoardsLoading || tasksLoading) return "loading";
  if (sortedBoardTasksCount === 0) return "empty";
  return "list";
}

function getBoardDropdownPlaceholder(isBoardsLoading: boolean): string {
  if (isBoardsLoading) return "Loading boards…";
  return "Select a board…";
}

function getEmptyBoardTasksMessage(boardTasksCount: number): string {
  if (boardTasksCount > 0) {
    return "No tasks to drag (scheduled or completed tasks are hidden).";
  }
  return "No tasks on this board.";
}

type CalendarPanelTasksBodyView = "pick-board" | "loading" | "empty" | "list";

type CalendarPanelTasksBodyProps = {
  boardOptions: { value: string; label: string }[];
  selectedBoardId: string;
  onSelectedBoardIdChange: (boardId: string) => void;
  isBoardsLoading: boolean;
  tasksLoading: boolean;
  sortedBoardTasks: Task[];
  boardTasksCount: number;
};

type CalendarPanelTasksBodyContentProps = {
  selectedBoardId: string;
  isBoardsLoading: boolean;
  tasksLoading: boolean;
  sortedBoardTasks: Task[];
  boardTasksCount: number;
};

type ResolveCalendarPanelTasksBodyViewInput = {
  selectedBoardId: string;
  isBoardsLoading: boolean;
  tasksLoading: boolean;
  sortedBoardTasksCount: number;
};
