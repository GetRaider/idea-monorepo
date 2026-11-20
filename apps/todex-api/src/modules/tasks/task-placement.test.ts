import { describe, expect, it } from "vitest";
import { TaskStatus } from "@repo/api/todex";

import {
  assertProgressStageForStatus,
  resolveTaskPlacement,
  TaskPlacementError,
} from "./task-placement";

const current = {
  currentSectionId: "general",
  currentProgressStageId: "design",
  defaultSectionId: "dest-general",
};

describe("resolveTaskPlacement", () => {
  it("keeps the current area and stage on the same board", () => {
    expect(
      resolveTaskPlacement({
        ...current,
        spaceChanged: false,
        requestedSectionId: undefined,
        requestedProgressStageId: undefined,
        sectionOnDestination: false,
        stageOnDestination: false,
      }),
    ).toEqual({ sectionId: "general", progressStageId: "design" });
  });

  it("clears the stage when it is set to null", () => {
    expect(
      resolveTaskPlacement({
        ...current,
        spaceChanged: false,
        requestedSectionId: undefined,
        requestedProgressStageId: null,
        sectionOnDestination: false,
        stageOnDestination: false,
      }).progressStageId,
    ).toBeNull();
  });

  it("resets area and stage when the task moves boards", () => {
    expect(
      resolveTaskPlacement({
        ...current,
        spaceChanged: true,
        requestedSectionId: undefined,
        requestedProgressStageId: undefined,
        sectionOnDestination: false,
        stageOnDestination: false,
      }),
    ).toEqual({ sectionId: "dest-general", progressStageId: null });
  });

  it("accepts an area and stage that belong to the destination board", () => {
    expect(
      resolveTaskPlacement({
        ...current,
        spaceChanged: true,
        requestedSectionId: "launch",
        requestedProgressStageId: "build",
        sectionOnDestination: true,
        stageOnDestination: true,
      }),
    ).toEqual({ sectionId: "launch", progressStageId: "build" });
  });

  it("rejects an area from another board", () => {
    expect(() =>
      resolveTaskPlacement({
        ...current,
        spaceChanged: true,
        requestedSectionId: "other",
        requestedProgressStageId: undefined,
        sectionOnDestination: false,
        stageOnDestination: false,
      }),
    ).toThrow(TaskPlacementError);
  });
});

describe("assertProgressStageForStatus", () => {
  it("allows a stage while the task is in progress", () => {
    expect(() =>
      assertProgressStageForStatus(TaskStatus.IN_PROGRESS, "design"),
    ).not.toThrow();
  });

  it("allows clearing or omitting the stage on any status", () => {
    expect(() =>
      assertProgressStageForStatus(TaskStatus.TODO, null),
    ).not.toThrow();
    expect(() =>
      assertProgressStageForStatus(TaskStatus.DONE, undefined),
    ).not.toThrow();
  });

  it("rejects a stage unless the task is in progress", () => {
    expect(() =>
      assertProgressStageForStatus(TaskStatus.TODO, "design"),
    ).toThrow(TaskPlacementError);
    expect(() =>
      assertProgressStageForStatus(TaskStatus.DONE, "design"),
    ).toThrow(/In Progress/);
  });
});
