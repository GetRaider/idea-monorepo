"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";

import type { Task } from "@/components/Boards/KanbanBoard/types";
import { TaskStatus } from "@/components/Boards/KanbanBoard/types";
import {
  TaskKey,
  TaskSummary,
} from "@/components/Boards/ListBoard/ListBoard.ui";
import type { DropdownOption } from "@/components/Dropdown";
import { Dropdown } from "@/components/Dropdown";
import { DropdownMultiSelect } from "@/components/DropdownMultiSelect";
import { DialogFormGroup, DialogFormLabel } from "@/components/Dialogs";
import { ChevronRightIcon } from "@/components/Icons/ChevronRightIcon";
import { TaskStatusGlyph } from "@/components/TaskStatusGlyph";
import { tasksHelper } from "@/helpers/task.helper";
import { useIsAnonymous } from "@/hooks/auth/use-is-anonymous";
import { useTasks } from "@/hooks/tasks/useTasks";
import { useGuestTasks } from "@/hooks/tasks/use-guest-store";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/styles/utils";
import { clientServices } from "@/services";
import { guestTasksForBoard } from "@/stores/guest/guest-task-filters";

type ScopeToken = string;

interface CalendarTaskScopeSelectorProps {
  /** Stored in CalendarEvent.taskScope / CalendarBacklogItem.taskScope */
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  className?: string;
}

interface TaskScopeSelectedTaskRowProps {
  task: Task;
  boardLabel: string;
  onRemove: () => void;
}

function TaskScopeTaskPickerRow({ task }: { task: Task }) {
  const hasSub = !!task.subtasks?.length;
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <span className="inline-flex w-4 shrink-0 justify-center text-text-secondary">
        {hasSub ? (
          <ChevronRightIcon size={12} className="opacity-70" aria-hidden />
        ) : null}
      </span>
      <span className="inline-flex shrink-0 items-center justify-center">
        <TaskStatusGlyph status={task.status} size={14} />
      </span>
      <span
        className="flex shrink-0 items-center justify-center text-sm leading-none"
        aria-hidden
      >
        {tasksHelper.priority.getIconLabel(task.priority)}
      </span>
      <TaskKey className="max-w-[5.5rem] truncate">
        {task.taskKey ?? task.id}
      </TaskKey>
      <TaskSummary
        isDone={task.status === TaskStatus.DONE}
        className="min-w-0 flex-1"
      >
        {task.summary}
      </TaskSummary>
    </div>
  );
}

function TaskScopeSelectedTaskRow({
  task,
  boardLabel,
  onRemove,
}: TaskScopeSelectedTaskRowProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex shrink-0 items-center justify-center">
            <TaskStatusGlyph status={task.status} size={14} />
          </span>
          <span
            className="flex shrink-0 items-center justify-center text-sm leading-none"
            aria-hidden
          >
            {tasksHelper.priority.getIconLabel(task.priority)}
          </span>
          <TaskKey className="max-w-[5.5rem] shrink-0 truncate">
            {task.taskKey ?? task.id}
          </TaskKey>
          <TaskSummary
            isDone={task.status === TaskStatus.DONE}
            className="min-w-0 flex-1 font-semibold text-text-primary"
          >
            {task.summary}
          </TaskSummary>
        </div>
        <p className="m-0 truncate text-xs text-zinc-500">{boardLabel}</p>
      </div>
      <button
        type="button"
        className="shrink-0 rounded-md p-1 text-zinc-500 transition-colors hover:bg-white/[0.08] hover:text-zinc-200"
        aria-label="Remove task from scope"
        onClick={onRemove}
      >
        ×
      </button>
    </div>
  );
}

export function CalendarTaskScopeSelector({
  value,
  onChange,
  disabled = false,
  className,
}: CalendarTaskScopeSelectorProps) {
  const [boardForTasks, setBoardForTasks] = useState<string>("");
  const isAnonymous = useIsAnonymous();
  const { tasks: guestTasks } = useGuestTasks();

  const boardsQuery = useQuery({
    queryKey: queryKeys.taskBoards.all,
    queryFn: () => clientServices.taskBoards.getAll(),
    enabled: !disabled,
  });

  const boardOptions: DropdownOption<string>[] = useMemo(
    () =>
      (boardsQuery.data ?? []).map((b) => ({
        value: b.id,
        label: `${b.emoji ? `${b.emoji} ` : ""}${b.name}`,
      })),
    [boardsQuery.data],
  );

  const boardsById = useMemo(() => {
    const m = new Map<string, { name: string; emoji?: string | null }>();
    for (const b of boardsQuery.data ?? []) {
      m.set(b.id, { name: b.name, emoji: b.emoji });
    }
    return m;
  }, [boardsQuery.data]);

  const migratedValue = useMemo(() => {
    const normalized = value.map((t) =>
      isLegacyTextToken(t) ? toTextToken(t) : t,
    );
    return normalized.filter((t) => !t.startsWith("board:"));
  }, [value]);

  const boardIdsFromSelection = useMemo(() => {
    const ids = new Set<string>();
    for (const token of migratedValue) {
      const p = parseTaskToken(token);
      if (p) ids.add(p.boardId);
    }
    return [...ids].sort();
  }, [migratedValue]);

  const taskQueries = useQueries({
    queries: boardIdsFromSelection.map((boardId) => ({
      queryKey: queryKeys.tasks.byBoard(boardId),
      queryFn: () => clientServices.tasks.getByBoardId(boardId),
      enabled: !disabled && !isAnonymous && boardIdsFromSelection.length > 0,
    })),
  });

  const { tasks, isLoading: tasksLoading } = useTasks({
    taskBoardId: boardForTasks || undefined,
  });

  const taskByToken = useMemo(() => {
    const m = new Map<string, Task>();
    if (isAnonymous) {
      for (const boardId of boardIdsFromSelection) {
        for (const t of guestTasksForBoard(guestTasks, boardId)) {
          m.set(taskToken(boardId, t.id), t);
        }
      }
    } else {
      for (let i = 0; i < boardIdsFromSelection.length; i++) {
        const boardId = boardIdsFromSelection[i];
        const list = taskQueries[i]?.data;
        if (!list) continue;
        for (const t of list) {
          m.set(taskToken(boardId, t.id), t);
        }
      }
    }
    if (boardForTasks) {
      for (const t of tasks) {
        m.set(taskToken(boardForTasks, t.id), t);
      }
    }
    return m;
  }, [
    isAnonymous,
    guestTasks,
    boardIdsFromSelection,
    taskQueries,
    boardForTasks,
    tasks,
  ]);

  const summaryByToken = useMemo(() => {
    const map = new Map<string, string>();
    for (const [token, task] of taskByToken) {
      map.set(token, task.summary);
    }
    return map;
  }, [taskByToken]);

  const taskOptions: DropdownOption<string>[] = useMemo(
    () =>
      tasks.map((t) => ({
        value: taskToken(boardForTasks, t.id),
        label: t.summary,
      })),
    [tasks, boardForTasks],
  );

  useEffect(() => {
    if (!taskScopeTokenArraysEqual(migratedValue, value)) {
      onChange(migratedValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [migratedValue, value]);

  const combinedLabel = (token: string) =>
    displayLabelForToken(token, boardsById, summaryByToken);

  const allTokens = useMemo(() => migratedValue, [migratedValue]);

  const tasksInBoardSelection = allTokens.filter((t) =>
    t.startsWith(`task:${boardForTasks}:`),
  );

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
        <DialogFormGroup className="min-w-0 gap-1.5">
          <DialogFormLabel>Board</DialogFormLabel>
          <Dropdown<string>
            options={boardOptions}
            value={boardForTasks || undefined}
            onChange={setBoardForTasks}
            placeholder={disabled ? "Sign in to browse" : "Select a board…"}
            disabled={disabled}
            fullWidth
          />
        </DialogFormGroup>

        <DialogFormGroup className="min-w-0 gap-1.5">
          <DialogFormLabel>Tasks</DialogFormLabel>
          <DropdownMultiSelect<string>
            options={taskOptions}
            value={tasksInBoardSelection}
            onChange={(nextTasksInBoard) => {
              const others = allTokens.filter(
                (t) => !t.startsWith(`task:${boardForTasks}:`),
              );
              onChange([...others, ...nextTasksInBoard]);
            }}
            placeholder={
              boardForTasks
                ? tasksLoading
                  ? "Loading…"
                  : "Select tasks…"
                : "Pick a board first"
            }
            emptyMessage={boardForTasks ? "No tasks" : "Pick a board first"}
            listTitle="Tasks"
            menuMinWidth={400}
            id="calendar-scope-tasks"
            className="w-full"
            renderOption={(option) => {
              const task = tasks.find(
                (t) => taskToken(boardForTasks, t.id) === option.value,
              );
              if (!task) {
                return (
                  <span className="text-sm text-slate-200">{option.label}</span>
                );
              }
              return <TaskScopeTaskPickerRow task={task} />;
            }}
          />
        </DialogFormGroup>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-zinc-300">
            Selected tasks
          </span>
          {allTokens.length > 0 ? (
            <button
              type="button"
              className="shrink-0 rounded-full border border-white/20 px-2.5 py-1 text-xs font-medium text-zinc-200 transition-colors hover:bg-white/[0.06]"
              onClick={() => onChange([])}
            >
              Clear all
            </button>
          ) : null}
        </div>

        {allTokens.length === 0 ? (
          <p className="m-0 text-xs text-zinc-500">No scope selected</p>
        ) : (
          <div className="flex max-h-[280px] flex-col gap-2 overflow-y-auto pr-1">
            {allTokens.map((token) => {
              const parsed = parseTaskToken(token);
              if (parsed) {
                const task = taskByToken.get(token);
                if (task) {
                  return (
                    <TaskScopeSelectedTaskRow
                      key={token}
                      task={task}
                      boardLabel={boardDisplayName(parsed.boardId, boardsById)}
                      onRemove={() =>
                        onChange(allTokens.filter((x) => x !== token))
                      }
                    />
                  );
                }
                return (
                  <div
                    key={token}
                    className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5"
                  >
                    <span className="min-w-0 truncate text-sm text-zinc-200">
                      {combinedLabel(token)}
                    </span>
                    <button
                      type="button"
                      className="shrink-0 rounded-md p-1 text-zinc-500 transition-colors hover:bg-white/[0.08] hover:text-zinc-200"
                      aria-label="Remove from scope"
                      onClick={() =>
                        onChange(allTokens.filter((x) => x !== token))
                      }
                    >
                      ×
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={token}
                  className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5"
                >
                  <span className="min-w-0 truncate text-sm text-zinc-200">
                    {combinedLabel(token)}
                  </span>
                  <button
                    type="button"
                    className="shrink-0 rounded-md p-1 text-zinc-500 transition-colors hover:bg-white/[0.08] hover:text-zinc-200"
                    aria-label="Remove from scope"
                    onClick={() =>
                      onChange(allTokens.filter((x) => x !== token))
                    }
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function taskScopeTokenArraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function taskToken(boardId: string, taskId: string): ScopeToken {
  return `task:${boardId}:${taskId}`;
}

function parseTaskToken(
  token: ScopeToken,
): { boardId: string; taskId: string } | null {
  if (!token.startsWith("task:")) return null;
  const parts = token.split(":");
  if (parts.length !== 3) return null;
  const [, boardId, taskId] = parts;
  if (!boardId || !taskId) return null;
  return { boardId, taskId };
}

function isLegacyTextToken(token: ScopeToken) {
  return (
    !token.startsWith("board:") &&
    !token.startsWith("task:") &&
    !token.startsWith("text:")
  );
}

function toTextToken(text: string): ScopeToken {
  return `text:${text}`;
}

function displayLabelForToken(
  token: ScopeToken,
  boardsById: Map<string, { name: string; emoji?: string | null }>,
  summaryByToken: Map<string, string>,
): string {
  if (token.startsWith("text:")) return token.slice("text:".length);
  if (token.startsWith("board:")) {
    const id = token.slice("board:".length);
    const b = boardsById.get(id);
    return b ? `${b.emoji ? `${b.emoji} ` : ""}${b.name}` : "Board";
  }
  const t = parseTaskToken(token);
  if (t) {
    const label = summaryByToken.get(token);
    if (label) return label;
    const b = boardsById.get(t.boardId);
    return `${b ? `${b.emoji ? `${b.emoji} ` : ""}${b.name}: ` : ""}Task`;
  }
  return token;
}

function boardDisplayName(
  boardId: string,
  boardsById: Map<string, { name: string; emoji?: string | null }>,
) {
  const b = boardsById.get(boardId);
  if (!b) return "Board";
  return `${b.emoji ? `${b.emoji} ` : ""}${b.name}`;
}
