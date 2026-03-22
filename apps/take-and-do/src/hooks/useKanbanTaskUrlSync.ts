"use client";

import { usePathname } from "next/navigation";
import { useCallback, useSyncExternalStore } from "react";

import { tasksUrlHelper, type ScheduleDate } from "@/helpers/tasks-url.helper";

export function useTaskUrlPathname(): string {
  const nextPath = usePathname() ?? "";
  const tick = useSyncExternalStore(
    tasksUrlHelper.shallow.subscribePathname,
    tasksUrlHelper.shallow.getPathname,
    () => nextPath,
  );

  if (typeof window === "undefined") return nextPath;
  void tick;
  return tasksUrlHelper.shallow.getPathname();
}

export function useBoardTaskUrlSync(boardName: string) {
  const onTaskOpen = useCallback(
    (task: { taskKey?: string }) =>
      tasksUrlHelper.modal.board.open(boardName, task),
    [boardName],
  );

  const onTaskClose = useCallback(
    () => tasksUrlHelper.modal.board.close(boardName),
    [boardName],
  );

  const onSubtaskOpen = useCallback(
    (parent: { taskKey?: string }, sub: { taskKey?: string }) =>
      tasksUrlHelper.modal.board.openSubtask(boardName, parent, sub),
    [boardName],
  );

  return { onTaskOpen, onTaskClose, onSubtaskOpen };
}

export function useScheduleTaskUrlSync(date: ScheduleDate) {
  const onTaskOpen = useCallback(
    (task: { taskKey?: string }) =>
      tasksUrlHelper.modal.schedule.open(date, task),
    [date],
  );

  const onTaskClose = useCallback(
    () => tasksUrlHelper.modal.schedule.close(date),
    [date],
  );

  const onSubtaskOpen = useCallback(
    (parent: { taskKey?: string }, sub: { taskKey?: string }) =>
      tasksUrlHelper.modal.schedule.openSubtask(date, parent, sub),
    [date],
  );

  return { onTaskOpen, onTaskClose, onSubtaskOpen };
}
