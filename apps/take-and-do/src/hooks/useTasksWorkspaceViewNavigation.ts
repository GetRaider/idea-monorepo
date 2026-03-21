"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { buildBoardUrl, buildScheduleUrl } from "@/helpers/tasks-routing.helper";

export function useTasksWorkspaceViewNavigation() {
  const router = useRouter();

  const navigateToWorkspaceView = useCallback(
    (view: string) => {
      if (view === "today" || view === "tomorrow") {
        router.push(buildScheduleUrl(view));
        return;
      }
      router.push(buildBoardUrl(view));
    },
    [router],
  );

  return { navigateToWorkspaceView };
}
