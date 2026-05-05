"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import type { DropdownOption } from "@/components/Dropdown";
import { Dropdown } from "@/components/Dropdown";
import { DropdownMultiSelect } from "@/components/DropdownMultiSelect";
import { DialogFormGroup, DialogFormLabel } from "@/components/Dialogs";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/styles/utils";
import { clientServices } from "@/services";
import { useTasks } from "@/hooks/tasks/useTasks";

type ScopeToken = string;

function boardToken(boardId: string): ScopeToken {
  return `board:${boardId}`;
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
  tasksByKey: Map<string, string>,
): string {
  if (token.startsWith("text:")) return token.slice("text:".length);
  if (token.startsWith("board:")) {
    const id = token.slice("board:".length);
    const b = boardsById.get(id);
    return b ? `${b.emoji ? `${b.emoji} ` : ""}${b.name}` : "Board";
  }
  const t = parseTaskToken(token);
  if (t) {
    const label = tasksByKey.get(`${t.boardId}:${t.taskId}`);
    if (label) return label;
    const b = boardsById.get(t.boardId);
    return `${b ? `${b.emoji ? `${b.emoji} ` : ""}${b.name}: ` : ""}Task`;
  }
  return token;
}

interface CalendarTaskScopeSelectorProps {
  /** Stored in CalendarScheduledEvent.taskScope / CalendarBacklogItem.taskScope */
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  className?: string;
}

export function CalendarTaskScopeSelector({
  value,
  onChange,
  disabled = false,
  className,
}: CalendarTaskScopeSelectorProps) {
  const [boardForTasks, setBoardForTasks] = useState<string>("");

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

  const boardScopeTokens = useMemo(
    () => value.filter((t) => t.startsWith("board:")),
    [value],
  );

  const taskScopeTokens = useMemo(
    () => value.filter((t) => t.startsWith("task:")),
    [value],
  );

  const migratedValue = useMemo(() => {
    if (!value.some(isLegacyTextToken)) return value;
    return value.map((t) => (isLegacyTextToken(t) ? toTextToken(t) : t));
  }, [value]);

  const { tasks, isLoading: tasksLoading } = useTasks({
    taskBoardId: boardForTasks || undefined,
  });

  const taskOptions: DropdownOption<string>[] = useMemo(
    () =>
      tasks.map((t) => ({
        value: taskToken(boardForTasks, t.id),
        label: t.summary,
      })),
    [tasks, boardForTasks],
  );

  const tasksByKey = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of tasks) m.set(`${boardForTasks}:${t.id}`, t.summary);
    return m;
  }, [tasks, boardForTasks]);

  useEffect(() => {
    if (migratedValue !== value) onChange(migratedValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [migratedValue]);

  const boardScopeOptions: DropdownOption<string>[] = useMemo(
    () =>
      boardOptions.map((opt) => ({
        value: boardToken(opt.value),
        label: opt.label,
      })),
    [boardOptions],
  );

  const taskOptionsInBoard = taskOptions;

  const combinedLabel = (token: string) =>
    displayLabelForToken(token, boardsById, tasksByKey);

  const allTokens = useMemo(() => migratedValue, [migratedValue]);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <DialogFormGroup>
        <DialogFormLabel>Task scope</DialogFormLabel>
        <DropdownMultiSelect<string>
          options={boardScopeOptions}
          value={boardScopeTokens}
          onChange={(nextBoards) => {
            const rest = allTokens.filter((t) => !t.startsWith("board:"));
            onChange([...rest, ...nextBoards]);
          }}
          placeholder="Boards (optional)"
          listTitle="Boards"
          emptyMessage={disabled ? "Sign in to browse boards" : "No boards"}
          id="calendar-scope-boards"
          className="w-full"
          onOpenChange={() => {
            /* keep stable */
          }}
        />
        <p className="m-0 mt-1 text-xs text-zinc-500">
          Pick boards and tasks you want to work on during this event.
        </p>
      </DialogFormGroup>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DialogFormGroup>
          <DialogFormLabel>Add tasks from board</DialogFormLabel>
          <Dropdown<string>
            options={boardOptions}
            value={boardForTasks || undefined}
            onChange={setBoardForTasks}
            placeholder={disabled ? "Sign in to browse" : "Select a board…"}
            disabled={disabled}
            fullWidth
          />
        </DialogFormGroup>

        <DialogFormGroup>
          <DialogFormLabel>Tasks</DialogFormLabel>
          <DropdownMultiSelect<string>
            options={taskOptionsInBoard}
            value={taskScopeTokens.filter((t) =>
              t.startsWith(`task:${boardForTasks}:`),
            )}
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
                  : "Select tasks (optional)"
                : "Pick a board first"
            }
            emptyMessage={boardForTasks ? "No tasks" : "Pick a board first"}
            listTitle="Tasks"
            id="calendar-scope-tasks"
            className="w-full"
          />
        </DialogFormGroup>
      </div>

      <DialogFormGroup>
        <DialogFormLabel>Selected</DialogFormLabel>
        <div className="flex flex-wrap gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-3">
          {allTokens.length ? (
            allTokens.map((t) => (
              <button
                key={t}
                type="button"
                className="rounded-full border border-white/12 bg-white/[0.05] px-3 py-1 text-xs text-zinc-200 hover:bg-white/[0.08]"
                title="Remove"
                onClick={() => onChange(allTokens.filter((x) => x !== t))}
              >
                {combinedLabel(t)} <span className="ml-1 text-zinc-500">×</span>
              </button>
            ))
          ) : (
            <span className="text-xs text-zinc-500">No scope selected</span>
          )}
        </div>
      </DialogFormGroup>
    </div>
  );
}
