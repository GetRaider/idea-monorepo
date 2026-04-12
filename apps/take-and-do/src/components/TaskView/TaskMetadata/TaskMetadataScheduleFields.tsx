"use client";

import { CalendarIcon, ClockIcon } from "@/components/Icons";
import { tasksHelper } from "@/helpers/task.helper";
import type { TaskMetadataModel } from "@/hooks/taskMetadata/useTaskMetadataModel";

import {
  EstimationInput,
  EstimationLabel,
  MetadataIcon,
  MetadataInput,
  MetadataItem,
} from "./TaskMetadata.ui";

type TaskMetadataScheduleFieldsProps = {
  model: TaskMetadataModel;
};

export function TaskMetadataScheduleFields({
  model,
}: TaskMetadataScheduleFieldsProps) {
  const {
    task,
    isEditingScheduleDate,
    scheduleDateValue,
    handleScheduleDateClick,
    handleScheduleDateChange,
    handleScheduleDateBlur,
    isEditingDueDate,
    dueDateValue,
    handleDueDateClick,
    handleDueDateChange,
    handleDueDateBlur,
    isEditingEstimation,
    estimationDays,
    estimationHours,
    estimationMinutes,
    setEstimationDays,
    setEstimationHours,
    setEstimationMinutes,
    estimationGroupRef,
    handleEstimationClick,
    handleEstimationSave,
    handleEstimationBlur,
  } = model;

  return (
    <>
      {isEditingScheduleDate ? (
        <MetadataInput
          type="date"
          value={scheduleDateValue}
          onChange={handleScheduleDateChange}
          onBlur={handleScheduleDateBlur}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
            e.key === "Enter" && e.currentTarget.blur()
          }
          autoFocus
          width="130px"
        />
      ) : (
        <MetadataItem
          onClick={handleScheduleDateClick}
          title="Click to edit schedule date"
        >
          <MetadataIcon>
            <CalendarIcon size={14} showDot />
          </MetadataIcon>
          <span>
            {task.scheduleDate
              ? tasksHelper.date.formatForSchedule(task.scheduleDate)
              : "Set schedule"}
          </span>
        </MetadataItem>
      )}

      {isEditingDueDate ? (
        <MetadataInput
          type="date"
          value={dueDateValue}
          onChange={handleDueDateChange}
          onBlur={handleDueDateBlur}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
            e.key === "Enter" && e.currentTarget.blur()
          }
          autoFocus
          width="130px"
        />
      ) : (
        <MetadataItem
          onClick={handleDueDateClick}
          title="Click to edit due date"
        >
          <MetadataIcon>
            <CalendarIcon size={14} />
          </MetadataIcon>
          <span>
            {task.dueDate
              ? tasksHelper.date.formatForDisplay(task.dueDate)
              : "Set due date"}
          </span>
        </MetadataItem>
      )}

      {isEditingEstimation ? (
        <div
          ref={estimationGroupRef}
          className="flex shrink-0 items-center gap-0.5 rounded-md border border-input-border bg-input-bg px-2 py-1 focus-within:border-accent-primary"
        >
          <EstimationInput
            type="number"
            value={estimationDays || ""}
            onChange={(e) => setEstimationDays(parseInt(e.target.value) || 0)}
            onKeyDown={(e) => e.key === "Enter" && handleEstimationSave()}
            onBlur={handleEstimationBlur}
            placeholder="0"
            min="0"
          />
          <EstimationLabel>d</EstimationLabel>
          <EstimationInput
            type="number"
            value={estimationHours || ""}
            onChange={(e) => setEstimationHours(parseInt(e.target.value) || 0)}
            onKeyDown={(e) => e.key === "Enter" && handleEstimationSave()}
            onBlur={handleEstimationBlur}
            placeholder="0"
            min="0"
            max="23"
            autoFocus
          />
          <EstimationLabel>h</EstimationLabel>
          <EstimationInput
            type="number"
            value={estimationMinutes || ""}
            onChange={(e) =>
              setEstimationMinutes(parseInt(e.target.value) || 0)
            }
            onKeyDown={(e) => e.key === "Enter" && handleEstimationSave()}
            onBlur={handleEstimationBlur}
            placeholder="0"
            min="0"
            max="59"
          />
          <EstimationLabel>m</EstimationLabel>
        </div>
      ) : (
        <MetadataItem
          onClick={handleEstimationClick}
          title="Click to edit estimation"
        >
          <MetadataIcon>
            <ClockIcon size={14} />
          </MetadataIcon>
          <span>
            {task.estimation
              ? tasksHelper.estimation.format(task.estimation)
              : "Set estimation"}
          </span>
        </MetadataItem>
      )}
    </>
  );
}
