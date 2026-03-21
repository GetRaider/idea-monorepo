"use client";

import { useCallback } from "react";

import {
  buildBoardUrl,
  buildScheduleTaskUrl,
  type ScheduleDate,
} from "@/helpers/tasks-routing.helper";

export function useBoardTaskUrlSync(boardName: string) {
  const onTaskOpen = useCallback(
    (task: TaskKeyCarrier) => {
      if (task.taskKey)
        window.history.replaceState(
          null,
          "",
          buildBoardUrl(boardName, task.taskKey),
        );
    },
    [boardName],
  );

  const onTaskClose = useCallback(() => {
    window.history.replaceState(null, "", buildBoardUrl(boardName));
  }, [boardName]);

  const onSubtaskOpen = useCallback(
    (parentTask: TaskKeyCarrier, subtask: TaskKeyCarrier) => {
      if (parentTask.taskKey && subtask.taskKey) {
        window.history.replaceState(
          null,
          "",
          buildBoardUrl(boardName, parentTask.taskKey, subtask.taskKey),
        );
      }
    },
    [boardName],
  );

  return { onTaskOpen, onTaskClose, onSubtaskOpen };
}

export function useScheduleTaskUrlSync(date: ScheduleDate) {
  const onTaskOpen = useCallback(
    (task: TaskKeyCarrier) => {
      if (task.taskKey)
        window.history.replaceState(
          null,
          "",
          buildScheduleTaskUrl(date, task.taskKey),
        );
    },
    [date],
  );

  const onTaskClose = useCallback(() => {
    window.history.replaceState(null, "", buildScheduleTaskUrl(date));
  }, [date]);

  const onSubtaskOpen = useCallback(
    (parentTask: TaskKeyCarrier, subtask: TaskKeyCarrier) => {
      if (parentTask.taskKey && subtask.taskKey) {
        window.history.replaceState(
          null,
          "",
          buildScheduleTaskUrl(date, parentTask.taskKey, subtask.taskKey),
        );
      }
    },
    [date],
  );

  return { onTaskOpen, onTaskClose, onSubtaskOpen };
}

type TaskKeyCarrier = { taskKey?: string };
