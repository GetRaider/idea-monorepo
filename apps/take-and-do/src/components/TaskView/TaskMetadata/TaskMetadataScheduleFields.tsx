"use client";

import { ClockIcon } from "@/components/Icons";
import { tasksHelper } from "@/helpers/task.helper";
import type { TaskMetadataModel } from "@/hooks/taskMetadata/useTaskMetadataModel";
import { TaskSchedulePicker } from "../TaskSchedulePicker";

import {
  EstimationInput,
  EstimationLabel,
  MetadataIcon,
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
    commitDueDate,
    commitScheduleDate,
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
      <TaskSchedulePicker
        value={task.scheduleDate}
        onChange={commitScheduleDate}
        variant="metadata"
        emptyLabel="Set schedule"
        emphasize
        triggerTitle="Choose schedule date and time"
      />

      <TaskSchedulePicker
        value={task.dueDate}
        onChange={commitDueDate}
        variant="metadata"
        emptyLabel="Set due date"
        triggerTitle="Choose due date and time"
      />

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
