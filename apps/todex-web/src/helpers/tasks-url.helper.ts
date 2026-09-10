const TASKS_ROOT_PATH = "/tasks";

const VALID_SCHEDULE_DATES = ["today", "tomorrow"] as const;

export const TASKS_ROOT_VIEW_ID = "__tasks_root__";

export const tasksUrlHelper = {
  routing: {
    isValidScheduleDate(value: string): value is ScheduleDate {
      return VALID_SCHEDULE_DATES.includes(value as ScheduleDate);
    },

    buildRootUrl(): string {
      return TASKS_ROOT_PATH;
    },

    buildScheduleUrl(date: ScheduleDate, taskKey?: string): string {
      const base = `${TASKS_ROOT_PATH}/schedule/${date}`;
      return taskKey ? `${base}/${encodeURIComponent(taskKey)}` : base;
    },

    buildBoardUrl(boardName: string, taskKey?: string): string {
      const base = `${TASKS_ROOT_PATH}/board/${encodeURIComponent(boardName)}`;
      return taskKey ? `${base}/${encodeURIComponent(taskKey)}` : base;
    },

    parseBoardPath(boardPath: string[]): BoardPath | null {
      const boardNameSegment = boardPath[0];
      if (!boardNameSegment) return null;
      return {
        boardName: decodePathSegment(boardNameSegment),
        taskKey: boardPath[1] ? decodePathSegment(boardPath[1]) : undefined,
      };
    },

    getBoardNameFromPathname(pathname: string): string | null {
      const match = pathname.match(/^\/tasks\/board\/([^/]+)/);
      if (!match?.[1]) return null;
      return decodePathSegment(match[1]);
    },

    getTaskKeyFromPathname(pathname: string): string | undefined {
      const boardMatch = pathname.match(/^\/tasks\/board\/[^/]+\/([^/]+)/);
      if (boardMatch?.[1]) return decodePathSegment(boardMatch[1]);
      const scheduleMatch = pathname.match(
        /^\/tasks\/schedule\/(?:today|tomorrow)\/([^/]+)/,
      );
      if (scheduleMatch?.[1]) return decodePathSegment(scheduleMatch[1]);
      return undefined;
    },

    isRootPathname(pathname: string): boolean {
      const normalized = pathname.replace(/\/+$/, "") || "/";
      return normalized === TASKS_ROOT_PATH;
    },

    getActiveViewFromPathname(pathname: string): string {
      if (tasksUrlHelper.routing.isRootPathname(pathname)) {
        return TASKS_ROOT_VIEW_ID;
      }
      if (/^\/tasks\/schedule\/today(?:\/|$)/.test(pathname)) return "today";
      if (/^\/tasks\/schedule\/tomorrow(?:\/|$)/.test(pathname)) {
        return "tomorrow";
      }
      return tasksUrlHelper.routing.getBoardNameFromPathname(pathname) ?? "";
    },
  },
};

function decodePathSegment(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export type ScheduleDate = (typeof VALID_SCHEDULE_DATES)[number];

export interface BoardPath {
  boardName: string;
  taskKey?: string;
}
