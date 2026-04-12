"use client";

import { ConfirmDialog } from "@/components/Dialogs";
import { useTaskMetadataModel } from "@/hooks/taskMetadata/useTaskMetadataModel";

import { TaskMetadataLabelsSection } from "./TaskMetadataLabelsSection";
import { TaskMetadataScheduleFields } from "./TaskMetadataScheduleFields";
import { MetadataContainer } from "./TaskMetadata.ui";

import type { TaskMetadataProps } from "./taskMetadata.types";

export function TaskMetadata(props: TaskMetadataProps) {
  const model = useTaskMetadataModel(props);
  const {
    labelPendingDelete,
    setLabelPendingDelete,
    handleConfirmDeleteLabel,
  } = model;

  return (
    <MetadataContainer>
      <TaskMetadataScheduleFields model={model} />
      <TaskMetadataLabelsSection model={model} />

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
    </MetadataContainer>
  );
}

export type { TaskMetadataProps } from "./taskMetadata.types";
