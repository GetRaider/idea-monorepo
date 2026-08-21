"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";

import { QuickCreateTaskRow } from "@/components/Boards/shared/QuickCreateTaskRow";
import {
  TaskPriority,
  TaskStatus,
} from "@/components/Boards/KanbanBoard/types";
import { useWorkspaceRepository } from "@/repositories/workspace";
import { toast } from "sonner";

import { DialogFormGroup, DialogFormLabel } from "@/components/Dialogs";
import { Dropdown } from "@/components/Dropdown";
import { cn } from "@/lib/styles/utils";

interface CalendarEventTaskSectionProps {
  taskBoardId: string;
  taskId: string;
  inputClass: string;
  onBoardChange: (boardId: string) => void;
  onTaskChange: (taskId: string, summarySnapshot: string) => void;
  onTitleSync?: (summary: string) => void;
  /** Renders to the right of the Board dropdown (e.g. color picker); other rows stay full width. */
  boardTrailing?: ReactNode;
  /** Merged onto the outer column (e.g. `gap-2` for compact quick-menu spacing). */
  sectionClassName?: string;
}

export function CalendarEventTaskSection({
  taskBoardId,
  taskId,
  inputClass: _inputClass,
  onBoardChange,
  onTaskChange,
  onTitleSync,
  boardTrailing,
  sectionClassName,
}: CalendarEventTaskSectionProps) {
  const { taskBoards, createTask, tasks, isTasksLoading } =
    useWorkspaceRepository({ taskBoardId: taskBoardId || undefined });

  const boardOptions = useMemo(
    () =>
      taskBoards.map((board) => ({
        id: board.id,
        name: board.name,
        emoji: board.emoji,
      })),
    [taskBoards],
  );

  const taskOptions = useMemo(
    () => tasks.map((task) => ({ id: task.id, summary: task.summary })),
    [tasks],
  );

  return (
    <div className={cn("flex flex-col gap-4", sectionClassName)}>
      <DialogFormGroup>
        <DialogFormLabel>Board</DialogFormLabel>
        <div className="flex min-w-0 items-center gap-2">
          <div className="min-w-0 flex-1">
            <Dropdown<string>
              options={[
                { value: "", label: "Select a board…" },
                ...boardOptions.map((board) => ({
                  value: board.id,
                  label: `${board.emoji ? `${board.emoji} ` : ""}${board.name}`,
                })),
              ]}
              value={taskBoardId}
              onChange={onBoardChange}
              fullWidth
            />
          </div>
          {boardTrailing ? (
            <div className="flex shrink-0 items-center">{boardTrailing}</div>
          ) : null}
        </div>
      </DialogFormGroup>

      {taskBoardId ? (
        <>
          <DialogFormGroup>
            <DialogFormLabel>Task on this board</DialogFormLabel>
            <Dropdown<string>
              options={[
                {
                  value: "",
                  label: isTasksLoading ? "Loading…" : "Select a task…",
                },
                ...taskOptions.map((task) => ({
                  value: task.id,
                  label: task.summary,
                })),
              ]}
              value={taskId}
              onChange={(id) => {
                const task = taskOptions.find((option) => option.id === id);
                onTaskChange(id, task?.summary ?? "");
                if (task && onTitleSync) onTitleSync(task.summary);
              }}
              disabled={isTasksLoading}
              fullWidth
            />
          </DialogFormGroup>

          <DialogFormGroup>
            <DialogFormLabel>Or quick-create a task</DialogFormLabel>
            <QuickCreateTaskRow
              taskBoardId={taskBoardId}
              triggerLabel="Create a new task"
              defaultStatus={TaskStatus.TODO}
              defaultPriority={TaskPriority.MEDIUM}
              onCreate={async (input) => {
                const board = boardOptions.find(
                  (item) => item.id === input.taskBoardId,
                );
                const created = await createTask({
                  taskBoardId: input.taskBoardId,
                  taskBoardName: board?.name,
                  summary: input.summary,
                  description: "",
                  status: input.status,
                  priority: input.priority,
                  ...(input.scheduleDate && {
                    scheduleDate: input.scheduleDate,
                  }),
                  ...(input.dueDate && { dueDate: input.dueDate }),
                  ...(input.estimation != null && {
                    estimation: input.estimation,
                  }),
                });
                if (!created) {
                  toast.error("Can't create task");
                  return;
                }
                onTaskChange(created.id, created.summary);
                if (onTitleSync) onTitleSync(created.summary);
                toast.success("Task created and linked");
              }}
            />
          </DialogFormGroup>
        </>
      ) : null}
    </div>
  );
}
