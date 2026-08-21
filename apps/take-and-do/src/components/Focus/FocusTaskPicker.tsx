"use client";

import { useMemo, useState } from "react";

import { FeatureGate } from "@/components/FeatureGate";
import { Dropdown } from "@/components/Dropdown";
import { ChevronDownIcon } from "@/components/Icons";
import { useFocusSessionContext } from "@/contexts/FocusSessionContext";
import { useWorkspaceRepository } from "@/repositories/workspace";
import { cn } from "@/lib/styles/utils";
import { chromePrimaryButtonClassName } from "@/lib/styles/chrome-primary-button-classes";

export function FocusTaskPicker({
  compact = false,
  defaultExpanded = false,
}: FocusTaskPickerProps) {
  return (
    <FeatureGate feature="focus">
      <FocusTaskPickerContent
        compact={compact}
        defaultExpanded={defaultExpanded}
      />
    </FeatureGate>
  );
}

function FocusTaskPickerContent({
  compact = false,
  defaultExpanded = false,
}: FocusTaskPickerProps) {
  const { draft, configureSession } = useFocusSessionContext();
  const [boardId, setBoardId] = useState("");
  const [expanded, setExpanded] = useState(defaultExpanded);
  const { taskBoards, tasks, isTasksLoading } = useWorkspaceRepository({
    taskBoardId: boardId || undefined,
  });

  const boardOptions = useMemo(
    () =>
      taskBoards.map((board) => ({
        value: board.id,
        label: `${board.emoji ? `${board.emoji} ` : ""}${board.name}`,
      })),
    [taskBoards],
  );

  const taskOptions = useMemo(
    () => tasks.map((task) => ({ value: task.id, label: task.summary })),
    [tasks],
  );

  const selectedBoardLabel =
    boardOptions.find((option) => option.value === boardId)?.label ??
    "Select board";
  const selectedTaskLabel =
    taskOptions.find((option) => option.value === draft.taskId)?.label ??
    (boardId
      ? isTasksLoading
        ? "Loading…"
        : "Select task"
      : "Select board first");

  if (compact) {
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          className="flex items-center gap-1.5 text-left text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
          onClick={() => setExpanded((previous) => !previous)}
        >
          <ChevronDownIcon
            size={14}
            className={cn(
              "shrink-0 transition-transform",
              expanded ? "rotate-180" : "rotate-0",
            )}
          />
          Link to task
        </button>

        {expanded ? (
          <div className="flex flex-col gap-2">
            <Dropdown
              options={[{ value: "", label: "No board" }, ...boardOptions]}
              value={boardId}
              onChange={(nextBoardId) => {
                setBoardId(nextBoardId);
                configureSession({ taskId: null, name: draft.name });
              }}
              trigger={
                <span
                  className={cn(
                    chromePrimaryButtonClassName,
                    "inline-flex w-full items-center justify-center px-5 py-2.5 text-sm font-semibold",
                  )}
                >
                  {selectedBoardLabel}
                </span>
              }
              fullWidth
            />

            <Dropdown
              options={[
                {
                  value: "",
                  label: boardId
                    ? isTasksLoading
                      ? "Loading…"
                      : "No task"
                    : "Pick a board first",
                },
                ...taskOptions,
              ]}
              value={draft.taskId ?? ""}
              onChange={(nextTaskId) => {
                if (!nextTaskId) {
                  configureSession({ taskId: null });
                  return;
                }
                const task = tasks.find((item) => item.id === nextTaskId);
                configureSession({
                  taskId: nextTaskId,
                  name: task?.summary ?? draft.name,
                });
              }}
              disabled={!boardId || isTasksLoading}
              trigger={
                <span
                  className={cn(
                    chromePrimaryButtonClassName,
                    "inline-flex w-full items-center justify-center px-5 py-2.5 text-sm font-semibold",
                    (!boardId || isTasksLoading) &&
                      "cursor-not-allowed opacity-50",
                  )}
                >
                  {selectedTaskLabel}
                </span>
              }
              fullWidth
            />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Dropdown
        options={[{ value: "", label: "No board" }, ...boardOptions]}
        value={boardId}
        onChange={(nextBoardId) => {
          setBoardId(nextBoardId);
          configureSession({ taskId: null, name: draft.name });
        }}
        placeholder="Select a board…"
        fullWidth
      />
      <Dropdown
        options={[
          {
            value: "",
            label: boardId
              ? isTasksLoading
                ? "Loading…"
                : "No task"
              : "Pick a board first",
          },
          ...taskOptions,
        ]}
        value={draft.taskId ?? ""}
        onChange={(nextTaskId) => {
          if (!nextTaskId) {
            configureSession({ taskId: null });
            return;
          }
          const task = tasks.find((item) => item.id === nextTaskId);
          configureSession({
            taskId: nextTaskId,
            name: task?.summary ?? draft.name,
          });
        }}
        disabled={!boardId || isTasksLoading}
        placeholder="Select a task…"
        fullWidth
      />
    </div>
  );
}

interface FocusTaskPickerProps {
  compact?: boolean;
  defaultExpanded?: boolean;
}
