export function resolveTaskPlacement(input: TaskPlacementInput): TaskPlacement {
  if (input.requestedAreaId !== undefined && !input.areaOnDestination) {
    throw new TaskPlacementError("Area does not belong to this board");
  }
  if (input.requestedProgressStageId != null && !input.stageOnDestination) {
    throw new TaskPlacementError(
      "Progress stage does not belong to this board",
    );
  }
  if (input.boardChanged) {
    return {
      areaId: input.requestedAreaId ?? input.defaultAreaId,
      progressStageId: input.requestedProgressStageId ?? null,
    };
  }
  return {
    areaId: input.requestedAreaId ?? input.currentAreaId,
    progressStageId:
      input.requestedProgressStageId === undefined
        ? input.currentProgressStageId
        : input.requestedProgressStageId,
  };
}

export class TaskPlacementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TaskPlacementError";
  }
}

interface TaskPlacementInput {
  boardChanged: boolean;
  currentAreaId: string;
  currentProgressStageId: string | null;
  requestedAreaId: string | undefined;
  requestedProgressStageId: string | null | undefined;
  defaultAreaId: string;
  areaOnDestination: boolean;
  stageOnDestination: boolean;
}

interface TaskPlacement {
  areaId: string;
  progressStageId: string | null;
}
