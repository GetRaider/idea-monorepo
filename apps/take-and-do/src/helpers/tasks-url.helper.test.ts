import { describe, expect, it } from "vitest";

import { TASKS_ROOT_VIEW_ID, tasksUrlHelper } from "./tasks-url.helper";

describe("tasksUrlHelper.routing.isRootPathname", () => {
  it("treats /tasks and trailing-slash variants as root", () => {
    expect(tasksUrlHelper.routing.isRootPathname("/tasks")).toBe(true);
    expect(tasksUrlHelper.routing.isRootPathname("/tasks/")).toBe(true);
  });

  it("does not treat board or schedule pages as root", () => {
    expect(tasksUrlHelper.routing.isRootPathname("/tasks/board/Inbox")).toBe(
      false,
    );
    expect(
      tasksUrlHelper.routing.isRootPathname("/tasks/board/Inbox/T-1"),
    ).toBe(false);
    expect(tasksUrlHelper.routing.isRootPathname("/tasks/schedule/today")).toBe(
      false,
    );
    expect(
      tasksUrlHelper.routing.isRootPathname("/tasks/schedule/tomorrow"),
    ).toBe(false);
  });
});

describe("tasksUrlHelper.routing.getActiveViewFromPathname", () => {
  it("returns the root view id only for /tasks", () => {
    expect(tasksUrlHelper.routing.getActiveViewFromPathname("/tasks")).toBe(
      TASKS_ROOT_VIEW_ID,
    );
    expect(
      tasksUrlHelper.routing.getActiveViewFromPathname("/tasks/board/Inbox"),
    ).not.toBe(TASKS_ROOT_VIEW_ID);
  });
});
