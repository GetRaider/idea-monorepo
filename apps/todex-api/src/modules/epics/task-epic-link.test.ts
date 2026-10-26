import { describe, expect, it } from "vitest";

import { resolveTaskEpicLink } from "./task-epic-link";

describe("resolveTaskEpicLink", () => {
  it("keeps the epic when the request omits it", () => {
    expect(
      resolveTaskEpicLink({
        spaceChanged: false,
        currentEpicId: "epic-1",
        requestedEpicId: undefined,
      }),
    ).toBe("epic-1");
  });

  it("clears the epic when the task changes space and no epic is sent", () => {
    expect(
      resolveTaskEpicLink({
        spaceChanged: true,
        currentEpicId: "epic-1",
        requestedEpicId: undefined,
      }),
    ).toBeNull();
  });

  it("applies an explicit epic", () => {
    expect(
      resolveTaskEpicLink({
        spaceChanged: true,
        currentEpicId: "epic-1",
        requestedEpicId: "epic-2",
      }),
    ).toBe("epic-2");
  });

  it("clears the epic when null is sent", () => {
    expect(
      resolveTaskEpicLink({
        spaceChanged: false,
        currentEpicId: "epic-1",
        requestedEpicId: null,
      }),
    ).toBeNull();
  });
});
