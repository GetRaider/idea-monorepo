import { describe, expect, it } from "vitest";

import {
  planProgressStageReplace,
  ProgressStagePlanError,
} from "./progress-stage-plan";

describe("planProgressStageReplace", () => {
  it("keeps known ids, inserts new stages, and removes the rest", () => {
    expect(
      planProgressStageReplace(
        ["discovery", "design"],
        [{ id: "design", name: "Design" }, { name: "Build" }],
      ),
    ).toEqual({
      updates: [{ id: "design", name: "Design", position: 0 }],
      inserts: [{ name: "Build", position: 1 }],
      removeIds: ["discovery"],
    });
  });

  it("rejects a duplicate name", () => {
    expect(() =>
      planProgressStageReplace([], [{ name: "Design" }, { name: "design" }]),
    ).toThrow(ProgressStagePlanError);
  });

  it("rejects an unknown id", () => {
    expect(() =>
      planProgressStageReplace(["design"], [{ id: "missing", name: "Design" }]),
    ).toThrow(ProgressStagePlanError);
  });
});
