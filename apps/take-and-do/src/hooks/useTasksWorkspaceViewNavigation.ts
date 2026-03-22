"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { tasksUrlHelper } from "@/helpers/tasks-url.helper";

export function useTasksWorkspaceViewNavigation() {
  const router = useRouter();

  const navigateToWorkspaceView = useCallback(
    (view: string) => {
      if (view === "today" || view === "tomorrow") {
        router.push(tasksUrlHelper.routing.buildScheduleUrl(view));
        return;
      }
      router.push(tasksUrlHelper.routing.buildBoardUrl(view));
    },
    [router],
  );

  return { navigateToWorkspaceView };
}
