import { describe, expect, it } from "vitest";

import { deriveHasWorkspaceTaskData } from "./derive-has-workspace-task-data";

describe("deriveHasWorkspaceTaskData", () => {
  it("enables overview controls when the workspace has tasks outside the monthly window", () => {
    expect(
      deriveHasWorkspaceTaskData({
        isAnonymous: false,
        guestTaskCount: 0,
        workspaceTaskTotal: 12,
      }),
    ).toBe(true);
  });

  it("must not use month-scoped stats to gate workspace controls", () => {
    const monthScopedTotal = 0;
    const allTimeTotal = 8;

    expect(
      deriveHasWorkspaceTaskData({
        isAnonymous: false,
        guestTaskCount: 0,
        workspaceTaskTotal: monthScopedTotal,
      }),
    ).toBe(false);

    expect(
      deriveHasWorkspaceTaskData({
        isAnonymous: false,
        guestTaskCount: 0,
        workspaceTaskTotal: allTimeTotal,
      }),
    ).toBe(true);
  });

  it("disables overview controls when monthly stats are zero but all-time total is zero", () => {
    expect(
      deriveHasWorkspaceTaskData({
        isAnonymous: false,
        guestTaskCount: 0,
        workspaceTaskTotal: 0,
      }),
    ).toBe(false);
  });

  it("disables overview controls when all-time stats failed to load", () => {
    expect(
      deriveHasWorkspaceTaskData({
        isAnonymous: false,
        guestTaskCount: 0,
        workspaceTaskTotal: null,
      }),
    ).toBe(false);
  });

  it("uses guest task count for anonymous sessions", () => {
    expect(
      deriveHasWorkspaceTaskData({
        isAnonymous: true,
        guestTaskCount: 2,
        workspaceTaskTotal: 0,
      }),
    ).toBe(true);
  });
});
