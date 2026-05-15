"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { QuickCreateTaskRow } from "@/components/Boards/shared/QuickCreateTaskRow";
import {
  TaskPriority,
  TaskStatus,
} from "@/components/Boards/KanbanBoard/types";
import { queryKeys } from "@/lib/query-keys";
import { clientServices } from "@/services";
import { useTaskActions, useTasks } from "@/hooks/tasks/useTasks";
import { toast } from "sonner";

import { DialogFormGroup, DialogFormLabel } from "@/components/Dialogs";
import { Dropdown } from "@/components/Dropdown";
import { cn } from "@/lib/styles/utils";

interface CalendarEventTaskSectionProps {
  taskBoardId: string;
  taskId: string;
  isGuest: boolean;
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
  isGuest,
  inputClass: _inputClass,
  onBoardChange,
  onTaskChange,
  onTitleSync,
  boardTrailing,
  sectionClassName,
}: CalendarEventTaskSectionProps) {
  const boardsQuery = useQuery({
    queryKey: queryKeys.taskBoards.all,
    queryFn: () => clientServices.taskBoards.getAll(),
    enabled: !isGuest,
  });

  const boardOptions = useMemo(
    () =>
      (boardsQuery.data ?? []).map((b) => ({
        id: b.id,
        name: b.name,
        emoji: b.emoji,
      })),
    [boardsQuery.data],
  );

  const { tasks, isLoading: tasksLoading } = useTasks({
    taskBoardId: taskBoardId || undefined,
  });

  const { createTask } = useTaskActions();

  const taskOptions = useMemo(
    () => tasks.map((t) => ({ id: t.id, summary: t.summary })),
    [tasks],
  );

  if (isGuest) {
    return (
      <p className="m-0 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-400">
        Sign in to link calendar events to boards and tasks.
      </p>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4", sectionClassName)}>
      <DialogFormGroup>
        <DialogFormLabel>Board</DialogFormLabel>
        <div className="flex min-w-0 items-center gap-2">
          <div className="min-w-0 flex-1">
            <Dropdown<string>
              options={[
                { value: "", label: "Select a board…" },
                ...boardOptions.map((b) => ({
                  value: b.id,
                  label: `${b.emoji ? `${b.emoji} ` : ""}${b.name}`,
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
                  label: tasksLoading ? "Loading…" : "Select a task…",
                },
                ...taskOptions.map((t) => ({ value: t.id, label: t.summary })),
              ]}
              value={taskId}
              onChange={(id) => {
                const t = taskOptions.find((x) => x.id === id);
                onTaskChange(id, t?.summary ?? "");
                if (t && onTitleSync) onTitleSync(t.summary);
              }}
              disabled={tasksLoading}
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
                const board = (boardsQuery.data ?? []).find(
                  (b) => b.id === input.taskBoardId,
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
