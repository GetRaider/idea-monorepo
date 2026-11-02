const TASKS_ROOT_PATH = "/planning";

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

    buildBoardUrl(spaceId: string, taskKey?: string): string {
      const base = `${TASKS_ROOT_PATH}/space/${encodeURIComponent(spaceId)}`;
      return taskKey ? `${base}/${encodeURIComponent(taskKey)}` : base;
    },

    buildEpicUrl(spaceId: string, epicId: string): string {
      return `${TASKS_ROOT_PATH}/space/${encodeURIComponent(spaceId)}/epics/${epicId}`;
    },

    parseSpacePath(spacePath: string[]): SpacePath | null {
      const spaceIdSegment = spacePath[0];
      if (!spaceIdSegment) return null;
      const spaceId = decodePathSegment(spaceIdSegment);
      if (spacePath[1] === "epics" && spacePath[2]) {
        return { kind: "epic", spaceId, epicId: spacePath[2] };
      }
      return {
        kind: "space",
        spaceId,
        taskKey: spacePath[1] ? decodePathSegment(spacePath[1]) : undefined,
      };
    },

    parseBoardPath(boardPath: string[]): BoardPath | null {
      const parsed = tasksUrlHelper.routing.parseSpacePath(boardPath);
      if (!parsed || parsed.kind !== "space") return null;
      return { spaceId: parsed.spaceId, taskKey: parsed.taskKey };
    },

    getSpaceIdFromPathname(pathname: string): string | null {
      const match = pathname.match(/^\/planning\/space\/([^/]+)/);
      if (!match?.[1]) return null;
      return decodePathSegment(match[1]);
    },

    getTaskKeyFromPathname(pathname: string): string | undefined {
      const boardMatch = pathname.match(/^\/planning\/space\/[^/]+\/([^/]+)/);
      if (boardMatch?.[1] && boardMatch[1] !== "epics") {
        return decodePathSegment(boardMatch[1]);
      }
      const scheduleMatch = pathname.match(
        /^\/planning\/schedule\/(?:today|tomorrow)\/([^/]+)/,
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
      if (/^\/planning\/schedule\/today(?:\/|$)/.test(pathname)) return "today";
      if (/^\/planning\/schedule\/tomorrow(?:\/|$)/.test(pathname)) {
        return "tomorrow";
      }
      return tasksUrlHelper.routing.getSpaceIdFromPathname(pathname) ?? "";
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
  spaceId: string;
  taskKey?: string;
}

export type SpacePath =
  | { kind: "space"; spaceId: string; taskKey?: string }
  | { kind: "epic"; spaceId: string; epicId: string };
