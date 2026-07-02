"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { TASKS_ROOT_VIEW_ID, tasksUrlHelper } from "@/helpers/tasks-url.helper";

export function useTasksViewRouter() {
  const router = useRouter();

  const navigateToView = useCallback(
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

  return { navigateToView };
}
