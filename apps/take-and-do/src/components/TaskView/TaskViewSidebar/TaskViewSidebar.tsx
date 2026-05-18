"use client";

import { useCallback, useRef, useState } from "react";

import { ClockIcon } from "@/components/Icons";
import { StatusIcon } from "@/components/Boards/KanbanBoard/Column/Column.ui";
import { ConfirmDialog } from "@/components/Dialogs";
import { useTaskMetadataModel } from "@/hooks/taskMetadata/useTaskMetadataModel";
import { tasksHelper } from "@/helpers/task.helper";
import { TaskSchedulePicker } from "@/components/TaskView/TaskSchedulePicker";
import { TaskStatusGlyph } from "@/components/TaskStatusGlyph";
import { TaskPriority, TaskStatus } from "../../Boards/KanbanBoard/types";
import { useClickOutside } from "@/hooks/ui/useClickOutside";
import { TaskMetadataLabelsSection } from "../TaskMetadata/TaskMetadataLabelsSection";
import {
  DropdownContainer,
  DropdownItem,
  PriorityIconSpan,
} from "../TaskView.ui";
import {
  EstimationInput,
  EstimationLabel,
} from "../TaskMetadata/TaskMetadata.ui";
import {
  SidebarPropertyRow,
  SidebarPropertyLabel,
  SidebarPropertyValue,
  SidebarValueButton,
} from "../TaskView.ui";
import type { TaskMetadataProps } from "../TaskMetadata/taskMetadata.types";

interface TaskViewSidebarProps extends TaskMetadataProps {
  onStatusSelect: (status: TaskStatus) => void;
  onPrioritySelect: (priority: TaskPriority) => void;
}

export function TaskViewSidebar({
  task,
  initialTask,
  isCreating,
  onTaskChange,
  onPendingMetadataUpdates,
  onStatusSelect,
  onPrioritySelect,
}: TaskViewSidebarProps) {
  const model = useTaskMetadataModel({
    task,
    initialTask,
    isCreating,
    onTaskChange,
    onPendingMetadataUpdates,
  });

  const {
    labelPendingDelete,
    setLabelPendingDelete,
    handleConfirmDeleteLabel,
  } = model;

  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);

  const closeStatus = useCallback(() => setIsStatusOpen(false), []);
  const closePriority = useCallback(() => setIsPriorityOpen(false), []);

  useClickOutside(statusRef, isStatusOpen, closeStatus);
  useClickOutside(priorityRef, isPriorityOpen, closePriority);

  const handleStatusPick = (status: TaskStatus) => {
    setIsStatusOpen(false);
    onStatusSelect(status);
  };

  const handlePriorityPick = (priority: TaskPriority) => {
    setIsPriorityOpen(false);
    onPrioritySelect(priority);
  };

  return (
    <div className="px-1 py-4 space-y-0.5">
      {/* Status */}
      <SidebarPropertyRow>
        <SidebarPropertyLabel>Status</SidebarPropertyLabel>
        <SidebarPropertyValue className="justify-start">
          <div ref={statusRef} className="relative">
            <SidebarValueButton onClick={() => setIsStatusOpen((o) => !o)}>
              <StatusIcon status={task.status}>
                <TaskStatusGlyph status={task.status} size={14} />
              </StatusIcon>
              <span>{tasksHelper.status.getName(task.status)}</span>
            </SidebarValueButton>
            <DropdownContainer
              isOpen={isStatusOpen}
              className="right-0 left-auto"
            >
              {Object.values(TaskStatus).map((status) => (
                <DropdownItem
                  key={status}
                  onClick={() => handleStatusPick(status)}
                  aria-current={status === task.status ? "true" : undefined}
                  className={
                    status === task.status
                      ? "border-l-2 border-l-white/35 bg-white/[0.07] pl-2 text-text-primary"
                      : undefined
                  }
                >
                  <PriorityIconSpan>
                    <StatusIcon status={status}>
                      <TaskStatusGlyph status={status} size={14} />
                    </StatusIcon>
                  </PriorityIconSpan>
                  {tasksHelper.status.getName(status)}
                </DropdownItem>
              ))}
            </DropdownContainer>
          </div>
        </SidebarPropertyValue>
      </SidebarPropertyRow>

      {/* Priority */}
      <SidebarPropertyRow>
        <SidebarPropertyLabel>Priority</SidebarPropertyLabel>
        <SidebarPropertyValue className="justify-start">
          <div ref={priorityRef} className="relative">
            <SidebarValueButton onClick={() => setIsPriorityOpen((o) => !o)}>
              <span>{tasksHelper.priority.getIconLabel(task.priority)}</span>
              <span>{tasksHelper.priority.getName(task.priority)}</span>
            </SidebarValueButton>
            <DropdownContainer
              isOpen={isPriorityOpen}
              className="right-0 left-auto"
            >
              {Object.values(TaskPriority).map((priority) => (
                <DropdownItem
                  key={priority}
                  onClick={() => handlePriorityPick(priority)}
                  aria-current={priority === task.priority ? "true" : undefined}
                  className={
                    priority === task.priority
                      ? "border-l-2 border-l-white/35 bg-white/[0.07] pl-2 text-text-primary"
                      : undefined
                  }
                >
                  <PriorityIconSpan>
                    {tasksHelper.priority.getIconLabel(priority)}
                  </PriorityIconSpan>
                  {tasksHelper.priority.getName(priority)}
                </DropdownItem>
              ))}
            </DropdownContainer>
          </div>
        </SidebarPropertyValue>
      </SidebarPropertyRow>

      {/* Due Date */}
      <SidebarPropertyRow>
        <SidebarPropertyLabel>Due date</SidebarPropertyLabel>
        <SidebarPropertyValue className="justify-start">
          <TaskSchedulePicker
            value={task.dueDate}
            onChange={model.commitDueDate}
            variant="sidebar"
            emptyLabel="Set due date"
            triggerTitle="Choose due date and time"
          />
        </SidebarPropertyValue>
      </SidebarPropertyRow>

      {/* Schedule Date */}
      <SidebarPropertyRow>
        <SidebarPropertyLabel>Schedule</SidebarPropertyLabel>
        <SidebarPropertyValue className="justify-start">
          <TaskSchedulePicker
            value={task.scheduleDate}
            onChange={model.commitScheduleDate}
            variant="sidebar"
            emptyLabel="Set schedule"
            emphasize
            triggerTitle="Choose schedule date and time"
          />
        </SidebarPropertyValue>
      </SidebarPropertyRow>

      {/* Estimation */}
      <SidebarPropertyRow>
        <SidebarPropertyLabel>Estimate</SidebarPropertyLabel>
        <SidebarPropertyValue className="justify-start">
          {model.isEditingEstimation ? (
            <div
              ref={model.estimationGroupRef}
              className="flex shrink-0 items-center gap-px rounded-md border border-input-border bg-input-bg px-1 py-0.5 focus-within:border-accent-primary"
            >
              <EstimationInput
                type="number"
                value={model.estimationDays || ""}
                onChange={(e) =>
                  model.setEstimationDays(parseInt(e.target.value) || 0)
                }
                onKeyDown={(e) =>
                  e.key === "Enter" && model.handleEstimationSave()
                }
                onBlur={model.handleEstimationBlur}
                placeholder="0"
                min="0"
                className="w-7 px-0.5 py-0.5 text-[12px]"
              />
              <EstimationLabel>d</EstimationLabel>
              <EstimationInput
                type="number"
                value={model.estimationHours || ""}
                onChange={(e) =>
                  model.setEstimationHours(parseInt(e.target.value) || 0)
                }
                onKeyDown={(e) =>
                  e.key === "Enter" && model.handleEstimationSave()
                }
                onBlur={model.handleEstimationBlur}
                placeholder="0"
                min="0"
                max="23"
                autoFocus
                className="w-7 px-0.5 py-0.5 text-[12px]"
              />
              <EstimationLabel>h</EstimationLabel>
              <EstimationInput
                type="number"
                value={model.estimationMinutes || ""}
                onChange={(e) =>
                  model.setEstimationMinutes(parseInt(e.target.value) || 0)
                }
                onKeyDown={(e) =>
                  e.key === "Enter" && model.handleEstimationSave()
                }
                onBlur={model.handleEstimationBlur}
                placeholder="0"
                min="0"
                max="59"
                className="w-7 px-0.5 py-0.5 text-[12px]"
              />
              <EstimationLabel>m</EstimationLabel>
            </div>
          ) : (
            <SidebarValueButton
              onClick={model.handleEstimationClick}
              title="Click to edit estimation"
            >
              <ClockIcon size={13} />
              <span>
                {task.estimation
                  ? tasksHelper.estimation.format(task.estimation)
                  : "Set estimate"}
              </span>
            </SidebarValueButton>
          )}
        </SidebarPropertyValue>
      </SidebarPropertyRow>

      {/* Labels */}
      <SidebarPropertyRow className="items-start min-h-[40px]">
        <SidebarPropertyLabel className="pt-1">Labels</SidebarPropertyLabel>
        <SidebarPropertyValue className="min-w-0 justify-start">
          <TaskMetadataLabelsSection model={model} labelMenuPlacement="up" />
        </SidebarPropertyValue>
      </SidebarPropertyRow>

      {labelPendingDelete && (
        <ConfirmDialog
          title={`Delete "${labelPendingDelete}" label?`}
          description="This removes the label from your workspace and unassigns it from all tasks. This cannot be undone."
          confirmLabel="Delete label"
          maxWidth={380}
          onConfirm={handleConfirmDeleteLabel}
          onClose={() => setLabelPendingDelete(null)}
        />
      )}
    </div>
  );
}
