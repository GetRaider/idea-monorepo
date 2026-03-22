import { Task, TaskStatus } from "@/components/Boards/KanbanBoard/types";

const PATHNAME_SYNC_EVENT = "app:shallow-url-pathname";

const VALID_SCHEDULE_DATES = ["today", "tomorrow"] as const;

export type ScheduleDate = (typeof VALID_SCHEDULE_DATES)[number];

export const tasksUrlHelper = {
  shallow: {
    replace(href: string): void {
      if (typeof window === "undefined") return;
      window.history.replaceState(null, "", href);
      window.dispatchEvent(new Event(PATHNAME_SYNC_EVENT));
    },

    subscribePathname(onChange: () => void): () => void {
      if (typeof window === "undefined") return () => {};
      window.addEventListener("popstate", onChange);
      window.addEventListener(PATHNAME_SYNC_EVENT, onChange);
      return () => {
        window.removeEventListener("popstate", onChange);
        window.removeEventListener(PATHNAME_SYNC_EVENT, onChange);
      };
    },

    getPathname(): string {
      return typeof window !== "undefined" ? window.location.pathname : "";
    },
  },

  routing: {
    isValidScheduleDate(value: string): value is ScheduleDate {
      return VALID_SCHEDULE_DATES.includes(value as ScheduleDate);
    },

    buildScheduleUrl(date: ScheduleDate): string {
      return `/tasks/schedule/${date}`;
    },

    buildScheduleTaskUrl(
      date: ScheduleDate,
      taskKey?: string,
      subtaskKey?: string,
    ): string {
      const base = tasksUrlHelper.routing.buildScheduleUrl(date);
      if (subtaskKey && taskKey) return `${base}/${taskKey}/${subtaskKey}`;
      if (taskKey) return `${base}/${taskKey}`;
      return base;
    },

    buildBoardUrl(
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
    },

    buildTasksUrl(view: TasksView): string {
      switch (view.type) {
        case "schedule":
          return tasksUrlHelper.routing.buildScheduleUrl(view.date);
        case "board":
          return tasksUrlHelper.routing.buildBoardUrl(
            view.boardName,
            view.taskKey,
            view.subtaskKey,
          );
      }
    },

    parseBoardPath(boardPath: string[]): BoardView | null {
      if (boardPath.length === 0) return null;

      const [boardName, taskKey, subtaskKey] = boardPath;
      const decodedBoardName = decodeURIComponent(boardName);

      return {
        type: "board",
        boardName: decodedBoardName,
        taskKey,
        subtaskKey,
      };
    },

    getBoardNameFromPathname(pathname: string): string | null {
      const match = pathname.match(/^\/tasks\/board\/([^/]+)/);
      return match ? decodeURIComponent(match[1]) : null;
    },

    getActiveViewFromPathname(pathname: string): string {
      if (/^\/tasks\/schedule\/today(?:\/|$)/.test(pathname)) return "today";
      if (/^\/tasks\/schedule\/tomorrow(?:\/|$)/.test(pathname))
        return "tomorrow";
      const board = tasksUrlHelper.routing.getBoardNameFromPathname(pathname);
      return board ?? "";
    },
  },

  modal: {
    board: {
      open(boardName: string, task: { taskKey?: string }): void {
        if (task.taskKey) {
          tasksUrlHelper.shallow.replace(
            tasksUrlHelper.routing.buildBoardUrl(boardName, task.taskKey),
          );
        }
      },
      close(boardName: string): void {
        tasksUrlHelper.shallow.replace(
          tasksUrlHelper.routing.buildBoardUrl(boardName),
        );
      },
      openSubtask(
        boardName: string,
        parent: { taskKey?: string },
        sub: { taskKey?: string },
      ): void {
        if (parent.taskKey && sub.taskKey) {
          tasksUrlHelper.shallow.replace(
            tasksUrlHelper.routing.buildBoardUrl(
              boardName,
              parent.taskKey,
              sub.taskKey,
            ),
          );
        }
      },
    },
    schedule: {
      open(date: ScheduleDate, task: { taskKey?: string }): void {
        if (task.taskKey) {
          tasksUrlHelper.shallow.replace(
            tasksUrlHelper.routing.buildScheduleTaskUrl(date, task.taskKey),
          );
        }
      },
      close(date: ScheduleDate): void {
        tasksUrlHelper.shallow.replace(
          tasksUrlHelper.routing.buildScheduleTaskUrl(date),
        );
      },
      openSubtask(
        date: ScheduleDate,
        parent: { taskKey?: string },
        sub: { taskKey?: string },
      ): void {
        if (parent.taskKey && sub.taskKey) {
          tasksUrlHelper.shallow.replace(
            tasksUrlHelper.routing.buildScheduleTaskUrl(
              date,
              parent.taskKey,
              sub.taskKey,
            ),
          );
        }
      },
    },
  },

  boardRoute: {
    keysSignature(taskKey: string, subtaskKey?: string): string {
      return JSON.stringify([taskKey, subtaskKey ?? null]);
    },

    keysFromPathname(
      pathname: string,
      boardName: string,
    ): { taskKey?: string; subtaskKey?: string } {
      const path = pathname.replace(/\/$/, "") || "/";
      const prefix = `/tasks/board/${encodeURIComponent(boardName)}`;
      if (path === prefix || !path.startsWith(`${prefix}/`)) return {};

      const parts = path
        .slice(prefix.length + 1)
        .split("/")
        .filter(Boolean);
      const [a, b] = parts;
      return {
        taskKey: a ? decodeBoardPathSegment(a) : undefined,
        subtaskKey: b ? decodeBoardPathSegment(b) : undefined,
      };
    },

    findTaskByUrlKeys(
      tasksByStatus: Record<TaskStatus, Task[]>,
      taskKey: string,
      subtaskKey?: string,
    ): { parent: Task | null; task: Task | null } {
      const all = Object.values(tasksByStatus).flat();

      if (!subtaskKey) {
        return {
          parent: null,
          task: all.find((t) => t.taskKey === taskKey) ?? null,
        };
      }

      for (const parent of all) {
        if (parent.taskKey !== taskKey) continue;
        const sub = parent.subtasks?.find((s) => s.taskKey === subtaskKey);
        if (sub) return { parent, task: sub };
      }

      for (const parent of all) {
        const sub = parent.subtasks?.find((s) => s.taskKey === subtaskKey);
        if (sub) return { parent, task: sub };
      }

      return { parent: null, task: null };
    },
  },
};

function decodeBoardPathSegment(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

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
