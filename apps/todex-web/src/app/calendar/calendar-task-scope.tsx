"use client";

import { useMemo, useState } from "react";
import {
  Button,
  Checkbox,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import { TaskStatus, type Task, type TaskBoard } from "@repo/api/todex";

export function TaskScopePicker({
  boards,
  tasks,
  value,
  selection,
  disabled,
  onChange,
}: {
  boards: TaskBoard[];
  tasks: Task[];
  value: string[];
  selection: "single" | "multiple";
  disabled?: boolean;
  onChange: (taskIds: string[]) => void;
}) {
  const [boardId, setBoardId] = useState(
    () => boards.find((board) => board.name === "Inbox")?.id ?? boards[0]?.id ?? "",
  );
  const [query, setQuery] = useState("");
  const activeBoardId = boardId || boards[0]?.id || "";
  const boardName = useMemo(() => {
    const names = new Map(boards.map((board) => [board.id, board.name]));
    return (taskBoardId: string) => names.get(taskBoardId) ?? "Board";
  }, [boards]);
  const selected = tasks.filter((task) => value.includes(task.id));
  const needle = query.trim().toLowerCase();
  const boardTasks = tasks.filter((task) => {
    if (task.taskBoardId !== activeBoardId) return false;
    if (task.status === TaskStatus.DONE || task.status === TaskStatus.CANCELLED) {
      return value.includes(task.id);
    }
    if (!needle) return true;
    return `${task.taskKey} ${task.summary}`.toLowerCase().includes(needle);
  });

  function toggle(taskId: string, checked: boolean) {
    if (selection === "single") {
      onChange(checked ? [taskId] : []);
      return;
    }
    onChange(
      checked ? [...value, taskId] : value.filter((current) => current !== taskId),
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {selection === "multiple" && selected.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {selected.map((task) => (
            <li
              key={task.id}
              className="flex items-center gap-2 rounded-md border border-border px-2 py-1 text-sm"
            >
              <span className="min-w-0 flex-1 truncate">
                <span className="text-muted-foreground">{task.taskKey}</span> {task.summary}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {boardName(task.taskBoardId)}
              </span>
              <button
                type="button"
                className="text-xs text-muted-foreground"
                disabled={disabled}
                aria-label={`Remove ${task.summary}`}
                onClick={() => toggle(task.id, false)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <Select
        value={activeBoardId || undefined}
        disabled={disabled || boards.length === 0}
        onValueChange={(next) => {
          setBoardId(next);
          setQuery("");
        }}
      >
        <SelectTrigger aria-label="Board">
          <SelectValue placeholder="Board" />
        </SelectTrigger>
        <SelectContent>
          {boards.map((board) => (
            <SelectItem key={board.id} value={board.id}>
              {board.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        value={query}
        disabled={disabled}
        placeholder="Search tasks"
        aria-label="Search tasks"
        className="h-8"
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="flex max-h-40 flex-col gap-0.5 overflow-y-auto">
        {boardTasks.length === 0 ? (
          <p className="px-1 py-2 text-xs text-muted-foreground">No tasks on this board</p>
        ) : (
          boardTasks.map((task) => {
            const checked = value.includes(task.id);
            return (
              <label
                key={task.id}
                className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-sm hover:bg-accent"
              >
                {selection === "multiple" ? (
                  <Checkbox
                    checked={checked}
                    disabled={disabled}
                    onCheckedChange={(next) => toggle(task.id, next === true)}
                  />
                ) : (
                  <input
                    type="radio"
                    name="calendar-task"
                    className="accent-foreground"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggle(task.id, true)}
                  />
                )}
                <span className="min-w-0 truncate">
                  <span className="text-muted-foreground">{task.taskKey}</span> {task.summary}
                </span>
              </label>
            );
          })
        )}
      </div>
      {selection === "single" && selected[0] ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="justify-start px-1 text-muted-foreground"
          disabled={disabled}
          onClick={() => onChange([])}
        >
          Clear {selected[0].taskKey}
        </Button>
      ) : null}
    </div>
  );
}
