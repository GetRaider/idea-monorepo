import { describe, expect, it } from "vitest";

import { TASKS_ROOT_VIEW_ID, tasksUrlHelper } from "./tasks-url.helper";

describe("tasksUrlHelper.routing.isRootPathname", () => {
  it("treats /planning and trailing-slash variants as root", () => {
    expect(tasksUrlHelper.routing.isRootPathname("/planning")).toBe(true);
    expect(tasksUrlHelper.routing.isRootPathname("/planning/")).toBe(true);
  });

  it("does not treat board or schedule pages as root", () => {
    expect(tasksUrlHelper.routing.isRootPathname("/planning/space/Inbox")).toBe(
      false,
    );
    expect(
      tasksUrlHelper.routing.isRootPathname("/planning/space/Inbox/T-1"),
    ).toBe(false);
    expect(tasksUrlHelper.routing.isRootPathname("/planning/schedule/today")).toBe(
      false,
    );
    expect(
      tasksUrlHelper.routing.isRootPathname("/planning/schedule/tomorrow"),
    ).toBe(false);
  });
});

describe("tasksUrlHelper.routing.getActiveViewFromPathname", () => {
  it("returns the root view id only for /planning", () => {
    expect(tasksUrlHelper.routing.getActiveViewFromPathname("/planning")).toBe(
      TASKS_ROOT_VIEW_ID,
    );
    expect(
      tasksUrlHelper.routing.getActiveViewFromPathname("/planning/space/Inbox"),
    ).not.toBe(TASKS_ROOT_VIEW_ID);
  });

  it("returns today and tomorrow for schedule routes", () => {
    expect(
      tasksUrlHelper.routing.getActiveViewFromPathname("/planning/schedule/today"),
    ).toBe("today");
    expect(
      tasksUrlHelper.routing.getActiveViewFromPathname(
        "/planning/schedule/tomorrow",
      ),
    ).toBe("tomorrow");
    expect(
      tasksUrlHelper.routing.getActiveViewFromPathname(
        "/planning/schedule/today/T-1",
      ),
    ).toBe("today");
  });
});

describe("tasksUrlHelper.routing board urls", () => {
  it("encodes space ids and parses them back", () => {
    const href = tasksUrlHelper.routing.buildBoardUrl("space-1");
    expect(href).toBe("/planning/space/space-1");
    expect(tasksUrlHelper.routing.getSpaceIdFromPathname(href)).toBe("space-1");
  });

  it("parses optional taskKey", () => {
    const parsed = tasksUrlHelper.routing.parseBoardPath(["space-1", "T-1"]);
    expect(parsed).toEqual({ spaceId: "space-1", taskKey: "T-1" });
  });

  it("treats an epics segment as an epic page", () => {
    expect(tasksUrlHelper.routing.buildEpicUrl("space-1", "epic-1")).toBe(
      "/planning/space/space-1/epics/epic-1",
    );
    expect(
      tasksUrlHelper.routing.parseSpacePath(["space-1", "epics", "epic-1"]),
    ).toEqual({ kind: "epic", spaceId: "space-1", epicId: "epic-1" });
    expect(
      tasksUrlHelper.routing.getTaskKeyFromPathname(
        "/planning/space/Todex/epics/epic-1",
      ),
    ).toBeUndefined();
  });

  it("builds and reads taskKey segments", () => {
    expect(tasksUrlHelper.routing.buildBoardUrl("space-1", "T-1")).toBe(
      "/planning/space/space-1/T-1",
    );
    expect(tasksUrlHelper.routing.buildScheduleUrl("today", "T-12")).toBe(
      "/planning/schedule/today/T-12",
    );
    expect(
      tasksUrlHelper.routing.getTaskKeyFromPathname("/planning/space/Inbox/T-1"),
    ).toBe("T-1");
    expect(
      tasksUrlHelper.routing.getTaskKeyFromPathname(
        "/planning/schedule/tomorrow/T-9",
      ),
    ).toBe("T-9");
    expect(
      tasksUrlHelper.routing.getTaskKeyFromPathname("/planning/space/Inbox"),
    ).toBeUndefined();
  });
});
