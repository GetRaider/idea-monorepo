"use client";

import { useState, useRef, type ComponentProps } from "react";

import { Input } from "@/components/Input";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
} from "@/components/Icons";
import { tasksHelper } from "@/helpers/task.helper";
import { useTaskActions } from "@/hooks/useTasks";
import { genericHelper } from "@/helpers/generic.helper";

import { Task, TaskPriority, TaskStatus } from "../../Boards/KanbanBoard/types";
import { StatusIcon } from "../../Boards/KanbanBoard/Column/Column.ui";
import { cn } from "@/lib/styles/utils";
import type { UiProps } from "@/lib/styles/ui-props";

export function TaskSubtasks({
  task,
  onSubtaskClick,
  onTaskUpdate,
}: TaskSubtasksProps) {
  const { updateTask } = useTaskActions();
  const [isSubtasksExpanded, setIsSubtasksExpanded] = useState(
    !!task.subtasks?.length,
  );
  const [isCreatingSubtask, setIsCreatingSubtask] = useState(false);
  const [newSubtaskSummary, setNewSubtaskSummary] = useState("");
  const isSavingSubtaskRef = useRef(false);

  const handleSubtaskClick = (subtask: Task) => {
    if (onSubtaskClick) {
      onSubtaskClick(subtask);
    }
  };

  const handleToggleSubtasks = () => {
    setIsSubtasksExpanded(!isSubtasksExpanded);
  };

  const handleCreateSubtask = async () => {
    if (!task || !newSubtaskSummary.trim()) return;
    if (isSavingSubtaskRef.current) return;
    isSavingSubtaskRef.current = true;

    try {
      const newSubtask: Task = {
        id: genericHelper.generateId(),
        taskBoardId: task.taskBoardId,
        summary: newSubtaskSummary.trim(),
        description: "",
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        subtasks: [],
      };

      const updatedSubtasks = [...(task.subtasks || []), newSubtask];
      const updatedTask = await updateTask(task.id, {
        subtasks: updatedSubtasks,
      });

      if (onTaskUpdate) {
        onTaskUpdate(updatedTask);
      }

      setNewSubtaskSummary("");
      setIsCreatingSubtask(false);
    } catch (error) {
      console.error("Failed to create subtask:", error);
    } finally {
      isSavingSubtaskRef.current = false;
    }
  };

  return (
    <SubtasksSection>
      <SubtasksHeader>
        <span>Subtasks</span>
        <SubtasksHeaderButtons>
          <SubtasksHeaderButton
            onClick={() => setIsCreatingSubtask(true)}
            title="Add subtask"
          >
            <PlusIcon />
          </SubtasksHeaderButton>
          <SubtasksHeaderButton
            onClick={handleToggleSubtasks}
            title={isSubtasksExpanded ? "Collapse" : "Expand"}
          >
            {isSubtasksExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
          </SubtasksHeaderButton>
        </SubtasksHeaderButtons>
      </SubtasksHeader>
      <SubtasksContainer isExpanded={isSubtasksExpanded}>
        {isCreatingSubtask && (
          <div style={{ marginBottom: "8px" }}>
            <SubtaskInput
              type="text"
              value={newSubtaskSummary}
              onChange={(e) => setNewSubtaskSummary(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleCreateSubtask();
                } else if (e.key === "Escape") {
                  setIsCreatingSubtask(false);
                  setNewSubtaskSummary("");
                }
              }}
              placeholder="Enter subtask summary..."
              autoFocus
              onBlur={() => {
                if (!newSubtaskSummary.trim()) {
                  setIsCreatingSubtask(false);
                }
              }}
            />
          </div>
        )}
        {task.subtasks && task.subtasks.length > 0 ? (
          task.subtasks.map((subtask, index) => {
            return (
              <SubtaskItem
                key={subtask.id || index}
                onClick={() => handleSubtaskClick(subtask)}
              >
                <SubtaskHeader>
                  <StatusIcon status={subtask.status}>
                    {tasksHelper.status.getIcon(subtask.status)}
                  </StatusIcon>
                  <SubtaskIcon>
                    {tasksHelper.priority.getIconLabel(subtask.priority)}
                  </SubtaskIcon>
                  {subtask.taskKey && (
                    <SubtaskKey>{subtask.taskKey}</SubtaskKey>
                  )}
                </SubtaskHeader>
                <SubtaskContent>{subtask.summary}</SubtaskContent>
              </SubtaskItem>
            );
          })
        ) : !isCreatingSubtask ? (
          <EmptySubtasksMessage>No subtasks yet</EmptySubtasksMessage>
        ) : null}
      </SubtasksContainer>
    </SubtasksSection>
  );
}

function SubtasksSection({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "mx-6 mb-8 rounded-xl border border-border-app bg-[#1a1a1a]",
        className,
      )}
      {...props}
    />
  );
}

function SubtasksHeader({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-between px-5 py-4 text-[15px] font-semibold text-white",
        className,
      )}
      {...props}
    />
  );
}

function SubtasksHeaderButtons({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  );
}

function SubtasksHeaderButton({
  className,
  type = "button",
  ref,
  ...props
}: UiProps<"button">) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "flex h-7 w-7 cursor-pointer items-center justify-center rounded border-0 bg-transparent p-1 text-lg text-[#666] transition-all duration-200 hover:bg-[#2a2a2a] hover:text-white",
        className,
      )}
      {...props}
    />
  );
}

type SubtasksContainerProps = UiProps<"div"> & {
  isExpanded: boolean;
};

function SubtasksContainer({
  className,
  isExpanded,
  ref,
  ...props
}: SubtasksContainerProps) {
  return (
    <div
      ref={ref}
      className={cn("px-3 pb-3", isExpanded ? "block" : "hidden", className)}
      {...props}
    />
  );
}

function SubtaskItem({
  className,
  type = "button",
  ref,
  ...props
}: UiProps<"button">) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "mb-2 flex w-full cursor-pointer flex-col items-start gap-2 rounded-lg border border-input-border bg-input-bg px-3.5 py-3 text-left transition-all duration-200 last:mb-0 hover:border-[#4a4a4a] hover:bg-[#333]",
        className,
      )}
      {...props}
    />
  );
}

function SubtaskHeader({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("flex w-full items-center gap-2", className)}
      {...props}
    />
  );
}

function SubtaskKey({ className, ref, ...props }: UiProps<"span">) {
  return (
    <span
      ref={ref}
      className={cn("text-[13px] font-medium text-[#888]", className)}
      {...props}
    />
  );
}

function SubtaskIcon({ className, ref, ...props }: UiProps<"span">) {
  return (
    <span
      ref={ref}
      className={cn(
        "flex shrink-0 items-center justify-center text-sm leading-none",
        className,
      )}
      {...props}
    />
  );
}

function SubtaskContent({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn(
        "line-clamp-2 overflow-hidden text-ellipsis text-sm leading-snug text-white [-webkit-box-orient:vertical] [-webkit-line-clamp:2] [display:-webkit-box]",
        className,
      )}
      {...props}
    />
  );
}

type SubtaskInputProps = ComponentProps<typeof Input>;

function SubtaskInput({ className, ref, ...props }: SubtaskInputProps) {
  return <Input ref={ref} className={className} {...props} />;
}

function EmptySubtasksMessage({ className, ref, ...props }: UiProps<"div">) {
  return (
    <div
      ref={ref}
      className={cn("p-2 text-sm text-[#666]", className)}
      {...props}
    />
  );
}

interface TaskSubtasksProps {
  task: Task;
  onSubtaskClick?: (subtask: Task) => void;
  onTaskUpdate?: (updatedTask: Task) => void;
}
