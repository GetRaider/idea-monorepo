"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { TASKS_ROOT_VIEW_ID, tasksUrlHelper } from "@/helpers/tasks-url.helper";

export function useTasksWorkspaceViewNavigation() {
  const router = useRouter();

  const navigateToWorkspaceView = useCallback(
    (view: string) => {
      if (view === "today" || view === "tomorrow") {
        router.push(tasksUrlHelper.routing.buildScheduleUrl(view));
        return;
      }
      if (view === TASKS_ROOT_VIEW_ID) {
        router.push(tasksUrlHelper.routing.buildRootUrl());
        return;
      }
      router.push(tasksUrlHelper.routing.buildBoardUrl(view));
    },
    [router],
  );

  return { navigateToWorkspaceView };
}
