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

    buildBoardUrl(spaceName: string, taskKey?: string): string {
      const base = `${TASKS_ROOT_PATH}/space/${encodeURIComponent(spaceName)}`;
      return taskKey ? `${base}/${encodeURIComponent(taskKey)}` : base;
    },

    buildEpicUrl(spaceName: string, epicId: string): string {
      return `${TASKS_ROOT_PATH}/space/${encodeURIComponent(spaceName)}/epics/${epicId}`;
    },

    parseSpacePath(spacePath: string[]): SpacePath | null {
      const spaceNameSegment = spacePath[0];
      if (!spaceNameSegment) return null;
      const spaceName = decodePathSegment(spaceNameSegment);
      if (spacePath[1] === "epics" && spacePath[2]) {
        return { kind: "epic", spaceName, epicId: spacePath[2] };
      }
      return {
        kind: "space",
        spaceName,
        taskKey: spacePath[1] ? decodePathSegment(spacePath[1]) : undefined,
      };
    },

    parseBoardPath(boardPath: string[]): BoardPath | null {
      const parsed = tasksUrlHelper.routing.parseSpacePath(boardPath);
      if (!parsed || parsed.kind !== "space") return null;
      return { spaceName: parsed.spaceName, taskKey: parsed.taskKey };
    },

    getBoardNameFromPathname(pathname: string): string | null {
      const match = pathname.match(/^\/tasks\/space\/([^/]+)/);
      if (!match?.[1]) return null;
      return decodePathSegment(match[1]);
    },

    getTaskKeyFromPathname(pathname: string): string | undefined {
      const boardMatch = pathname.match(/^\/tasks\/space\/[^/]+\/([^/]+)/);
      if (boardMatch?.[1] && boardMatch[1] !== "epics") {
        return decodePathSegment(boardMatch[1]);
      }
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
  spaceName: string;
  taskKey?: string;
}

export type SpacePath =
  | { kind: "space"; spaceName: string; taskKey?: string }
  | { kind: "epic"; spaceName: string; epicId: string };
