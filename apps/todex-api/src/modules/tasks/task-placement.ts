import {
  TaskStatus,
  type TaskStatus as TaskStatusValue,
} from "@repo/api/todex";

export function resolveTaskPlacement(input: TaskPlacementInput): TaskPlacement {
  if (input.requestedSectionId !== undefined && !input.sectionOnDestination) {
    throw new TaskPlacementError("Section does not belong to this space");
  }
  if (input.requestedProgressStageId != null && !input.stageOnDestination) {
    throw new TaskPlacementError(
      "Progress stage does not belong to this space",
    );
  }
  if (input.spaceChanged) {
    return {
      sectionId: input.requestedSectionId ?? input.defaultSectionId,
      progressStageId: input.requestedProgressStageId ?? null,
    };
  }
  return {
    sectionId: input.requestedSectionId ?? input.currentSectionId,
    progressStageId:
      input.requestedProgressStageId === undefined
        ? input.currentProgressStageId
        : input.requestedProgressStageId,
  };
}

export function assertProgressStageForStatus(
  status: TaskStatusValue,
  progressStageId: string | null | undefined,
) {
  if (progressStageId && status !== TaskStatus.IN_PROGRESS) {
    throw new TaskPlacementError(
      "Progress stage is available only when status is In Progress",
    );
  }
}

export class TaskPlacementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TaskPlacementError";
  }
}

interface TaskPlacementInput {
  spaceChanged: boolean;
  currentSectionId: string;
  currentProgressStageId: string | null;
  requestedSectionId: string | undefined;
  requestedProgressStageId: string | null | undefined;
  defaultSectionId: string;
  sectionOnDestination: boolean;
  stageOnDestination: boolean;
}

interface TaskPlacement {
  sectionId: string;
  progressStageId: string | null;
}
