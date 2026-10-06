import { describe, expect, it } from "vitest";

import { resolveTaskPlacement, TaskPlacementError } from "./task-placement";

const current = {
  currentAreaId: "general",
  currentProgressStageId: "design",
  defaultAreaId: "dest-general",
};

describe("resolveTaskPlacement", () => {
  it("keeps the current area and stage on the same board", () => {
    expect(
      resolveTaskPlacement({
        ...current,
        boardChanged: false,
        requestedAreaId: undefined,
        requestedProgressStageId: undefined,
        areaOnDestination: false,
        stageOnDestination: false,
      }),
    ).toEqual({ areaId: "general", progressStageId: "design" });
  });

  it("clears the stage when it is set to null", () => {
    expect(
      resolveTaskPlacement({
        ...current,
        boardChanged: false,
        requestedAreaId: undefined,
        requestedProgressStageId: null,
        areaOnDestination: false,
        stageOnDestination: false,
      }).progressStageId,
    ).toBeNull();
  });

  it("resets area and stage when the task moves boards", () => {
    expect(
      resolveTaskPlacement({
        ...current,
        boardChanged: true,
        requestedAreaId: undefined,
        requestedProgressStageId: undefined,
        areaOnDestination: false,
        stageOnDestination: false,
      }),
    ).toEqual({ areaId: "dest-general", progressStageId: null });
  });

  it("accepts an area and stage that belong to the destination board", () => {
    expect(
      resolveTaskPlacement({
        ...current,
        boardChanged: true,
        requestedAreaId: "launch",
        requestedProgressStageId: "build",
        areaOnDestination: true,
        stageOnDestination: true,
      }),
    ).toEqual({ areaId: "launch", progressStageId: "build" });
  });

  it("rejects an area from another board", () => {
    expect(() =>
      resolveTaskPlacement({
        ...current,
        boardChanged: true,
        requestedAreaId: "other",
        requestedProgressStageId: undefined,
        areaOnDestination: false,
        stageOnDestination: false,
      }),
    ).toThrow(TaskPlacementError);
  });
});
