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

  it("returns today and tomorrow for schedule routes", () => {
    expect(
      tasksUrlHelper.routing.getActiveViewFromPathname("/tasks/schedule/today"),
    ).toBe("today");
    expect(
      tasksUrlHelper.routing.getActiveViewFromPathname(
        "/tasks/schedule/tomorrow",
      ),
    ).toBe("tomorrow");
    expect(
      tasksUrlHelper.routing.getActiveViewFromPathname(
        "/tasks/schedule/today/T-1",
      ),
    ).toBe("today");
  });
});

describe("tasksUrlHelper.routing board urls", () => {
  it("encodes board names and parses them back", () => {
    const href = tasksUrlHelper.routing.buildBoardUrl("My Board");
    expect(href).toBe("/tasks/board/My%20Board");
    expect(tasksUrlHelper.routing.getBoardNameFromPathname(href)).toBe(
      "My Board",
    );
  });

  it("parses optional taskKey without using it in P0", () => {
    const parsed = tasksUrlHelper.routing.parseBoardPath(["Inbox", "T-1"]);
    expect(parsed).toEqual({ boardName: "Inbox", taskKey: "T-1" });
  });

  it("builds and reads taskKey segments", () => {
    expect(tasksUrlHelper.routing.buildBoardUrl("Inbox", "T-1")).toBe(
      "/tasks/board/Inbox/T-1",
    );
    expect(
      tasksUrlHelper.routing.buildScheduleUrl("today", "T-12"),
    ).toBe("/tasks/schedule/today/T-12");
    expect(
      tasksUrlHelper.routing.getTaskKeyFromPathname("/tasks/board/Inbox/T-1"),
    ).toBe("T-1");
    expect(
      tasksUrlHelper.routing.getTaskKeyFromPathname(
        "/tasks/schedule/tomorrow/T-9",
      ),
    ).toBe("T-9");
    expect(
      tasksUrlHelper.routing.getTaskKeyFromPathname("/tasks/board/Inbox"),
    ).toBeUndefined();
  });
});
