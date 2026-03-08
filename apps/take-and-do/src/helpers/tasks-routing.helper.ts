/**
 * Path-based routing utilities for /tasks pages.
 *
 * Routes:
 * - /tasks/schedule/today
 * - /tasks/schedule/tomorrow
 * - /tasks/board/{boardName}
 * - /tasks/board/{boardName}/{taskKey}
 * - /tasks/board/{boardName}/{taskKey}/{subtaskKey}
 */

export type ScheduleDate = "today" | "tomorrow";

export type ScheduleView = {
  type: "schedule";
  date: ScheduleDate;
};

export type BoardView = {
  type: "board";
  boardName: string;
  taskKey?: string;
  subtaskKey?: string;
};

export type TasksView = ScheduleView | BoardView;

const VALID_SCHEDULE_DATES: ScheduleDate[] = ["today", "tomorrow"];

export function isValidScheduleDate(value: string): value is ScheduleDate {
  return VALID_SCHEDULE_DATES.includes(value as ScheduleDate);
}

/**
 * Build URL for schedule view
 */
export function buildScheduleUrl(date: ScheduleDate): string {
  return `/tasks/schedule/${date}`;
}

/**
 * Build URL for board view, optionally with task/subtask
 */
export function buildBoardUrl(
  boardName: string,
  taskKey?: string,
  subtaskKey?: string,
): string {
  const encodedBoardName = encodeURIComponent(boardName);

  if (subtaskKey && taskKey) {
    return `/tasks/board/${encodedBoardName}/${taskKey}/${subtaskKey}`;
  }
  if (taskKey) {
    return `/tasks/board/${encodedBoardName}/${taskKey}`;
  }
  return `/tasks/board/${encodedBoardName}`;
}

/**
 * Build URL from a TasksView object
 */
export function buildTasksUrl(view: TasksView): string {
  switch (view.type) {
    case "schedule":
      return buildScheduleUrl(view.date);
    case "board":
      return buildBoardUrl(view.boardName, view.taskKey, view.subtaskKey);
  }
}

/**
 * Parse board path segments: [boardName] | [boardName, taskKey] | [boardName, taskKey, subtaskKey]
 */
export function parseBoardPath(boardPath: string[]): BoardView | null {
  if (boardPath.length === 0) return null;

  const [boardName, taskKey, subtaskKey] = boardPath;
  const decodedBoardName = decodeURIComponent(boardName);

  return {
    type: "board",
    boardName: decodedBoardName,
    taskKey,
    subtaskKey,
  };
}
