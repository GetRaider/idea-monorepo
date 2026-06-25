"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { TASKS_ROOT_VIEW_ID, tasksUrlHelper } from "@/helpers/tasks-url.helper";

export function useTasksWorkspaceViewNavigation() {
  const router = useRouter();

  const navigateToWorkspaceView = useCallback(
    (view: string) => {
      switch (true) {
        case view === "today" || view === "tomorrow":
          return router.push(tasksUrlHelper.routing.buildScheduleUrl(view));
        case view === TASKS_ROOT_VIEW_ID:
          return router.push(tasksUrlHelper.routing.buildRootUrl());
        default:
          return router.push(tasksUrlHelper.routing.buildBoardUrl(view));
      }
    },
    [router],
  );

  return { navigateToWorkspaceView };
}
