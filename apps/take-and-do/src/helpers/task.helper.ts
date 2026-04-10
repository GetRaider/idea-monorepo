import {
  Task,
  TaskPriority,
  TaskStatus,
  TaskUpdate,
  toTaskPriority,
  toTaskStatus,
} from "@/components/Boards/KanbanBoard/types";

const PRIORITY_NAMES: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: "Low",
  [TaskPriority.MEDIUM]: "Medium",
  [TaskPriority.HIGH]: "High",
  [TaskPriority.CRITICAL]: "Critical",
};

const STATUS_NAMES: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: "To Do",
  [TaskStatus.IN_PROGRESS]: "In Progress",
  [TaskStatus.DONE]: "Done",
};

export const tasksHelper = {
  schedule: {
    sortTasksByStatus(
      schedule: ScheduleType,
      recentTasks: Task[],
      todayTasks: Task[],
      tomorrowTasks: Task[],
      customDateTasks: Task[],
    ): Task[] {
      const scheduledTasks = {
        new: recentTasks,
        today: todayTasks,
        tomorrow: tomorrowTasks,
        custom: customDateTasks,
      };
      const tasks = scheduledTasks[schedule];
      return tasksHelper.status.sort(tasks);
    },
    getLabel(schedule: ScheduleType, customDate: string) {
      if (schedule === "new") return "last 7 days";
      if (schedule === "today") return "today";
      if (schedule === "tomorrow") return "tomorrow";
      if (schedule === "custom" && customDate) {
        const d = tasksHelper.date.parse(customDate);
        return d ? tasksHelper.date.formatForDisplay(d) : "selected date";
      }
      return "selected date";
    },
    getDate(schedule: "today" | "tomorrow"): Date {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (schedule === "tomorrow") {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
      }
      return today;
    },
    isSchedule(view: string): view is "today" | "tomorrow" {
      return view === "today" || view === "tomorrow";
    },
  },
  estimation: {
    parse(totalHours: number): ParsedEstimation {
      const totalMinutes = Math.round(totalHours * 60);
      const days = Math.floor(totalMinutes / (24 * 60));
      const remainingAfterDays = totalMinutes % (24 * 60);
      const hours = Math.floor(remainingAfterDays / 60);
      const minutes = remainingAfterDays % 60;
      return { days, hours, minutes };
    },
    toTotalHours(days: number, hours: number, minutes: number): number {
      return days * 24 + hours + minutes / 60;
    },
    format(totalHours: number): string {
      const { days, hours, minutes } = this.parse(totalHours);
      const parts: string[] = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0) parts.push(`${minutes}m`);
      return parts.length > 0 ? parts.join(" ") : "0h";
    },
    hours(hours: number): string {
      if (!hours) return "—";
      return `${hours}h`;
    },
  },
  date: {
    parse(raw: unknown): Date | undefined {
      if (raw === undefined || raw === null) return undefined;
      if (raw instanceof Date) {
        const copy = new Date(raw.getTime());
        return Number.isNaN(copy.getTime()) ? undefined : copy;
      }
      if (typeof raw === "string" || typeof raw === "number") {
        const date = new Date(raw);
        return Number.isNaN(date.getTime()) ? undefined : date;
      }
      return undefined;
    },

    parseCalendarDay(isoYyyyMmDd: unknown): Date | undefined {
      if (typeof isoYyyyMmDd !== "string") return undefined;
      const trimmed = isoYyyyMmDd.trim();
      const parts = trimmed.split("-");
      if (parts.length !== 3) return undefined;
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if ([year, month + 1, day].some((n) => Number.isNaN(n))) return undefined;
      const date = new Date(year, month, day);
      if (Number.isNaN(date.getTime())) return undefined;
      return date;
    },

    getTime(raw: unknown): number | undefined {
      return this.parse(raw)?.getTime();
    },

    toISOString(raw: unknown): string | undefined {
      return this.parse(raw)?.toISOString();
    },

    formatCustomDate(customDate: unknown): Date {
      const local = this.parseCalendarDay(customDate);
      if (local) return local;
      return this.parse(customDate) ?? new Date(NaN);
    },

    formatForInput(rawDate: unknown): string {
      const date = this.parse(rawDate);
      if (!date) return "";
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      return `${year}-${month}-${day}`;
    },

    formatForAPI(date: unknown): string {
      const d = this.parse(date);
      if (!d) return "";
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, "0");
      const day = d.getDate().toString().padStart(2, "0");
      return `${year}-${month}-${day}`;
    },

    formatForDisplay(rawDate: unknown): string {
      const date = this.parse(rawDate);
      if (!date) return "";
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    },

    formatForSchedule(rawDate: unknown): string {
      const date = this.parse(rawDate);
      if (!date) return "";
      const schedule = this.getScheduleFromDate(date);
      if (schedule === "today") return "Today";
      if (schedule === "tomorrow") return "Tomorrow";
      return this.formatForDisplay(date);
    },

    getScheduleFromDate(rawDate: unknown): "today" | "tomorrow" | null {
      const date = this.parse(rawDate);
      if (!date) return null;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);

      if (checkDate.getTime() === today.getTime()) return "today";
      if (checkDate.getTime() === tomorrow.getTime()) return "tomorrow";
      return null;
    },
  },
  priority: {
    format(priority: unknown): TaskPriority {
      if (!priority) return TaskPriority.MEDIUM;

      const priorityString = String(priority).toLowerCase();
      const validPriorities = Object.values(TaskPriority) as string[];

      if (validPriorities.includes(priorityString)) {
        return priorityString as TaskPriority;
      }

      return TaskPriority.MEDIUM;
    },
    getName(priority: TaskPriority): string {
      return PRIORITY_NAMES[priority] ?? "Medium";
    },
    getIconLabel(priority: TaskPriority): string {
      switch (priority) {
        case TaskPriority.LOW:
          return "🔵";
        case TaskPriority.MEDIUM:
          return "🟡";
        case TaskPriority.HIGH:
          return "🔴";
        case TaskPriority.CRITICAL:
          return "🟣";
        default:
          return "🚫";
      }
    },
  },
  status: {
    getName(status: TaskStatus): string {
      return STATUS_NAMES[status] ?? status;
    },
    sort(tasks: Task[]): Task[] {
      const statusOrder: Record<TaskStatus, number> = {
        [TaskStatus.TODO]: 0,
        [TaskStatus.IN_PROGRESS]: 1,
        [TaskStatus.DONE]: 2,
      };
      return [...tasks].sort(
        (a, b) => (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99),
      );
    },
    getIcon(status: TaskStatus): string {
      switch (status) {
        case TaskStatus.TODO:
          return "◯";
        case TaskStatus.IN_PROGRESS:
          return "◐";
        case TaskStatus.DONE:
          return "✓";
        default:
          return "◯";
      }
    },
  },
  description: {
    plainToHtml(text: string): string {
      const lines = text.split("\n");
      const result: string[] = [];
      let listItems: string[] = [];
      let listType: "ol" | "ul" | null = null;

      const flushList = () => {
        if (!listItems.length || !listType) return;
        result.push(
          `<${listType}>${listItems.map((item) => `<li>${item}</li>`).join("")}</${listType}>`,
        );
        listItems = [];
        listType = null;
      };

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          flushList();
          continue;
        }

        const numberedMatch = trimmed.match(/^\d+\.\s+(.+)/);
        const bulletMatch = trimmed.match(/^[•\-*]\s+(.+)/);

        if (numberedMatch) {
          if (listType === "ul") flushList();
          listType = "ol";
          listItems.push(numberedMatch[1]);
        } else if (bulletMatch) {
          if (listType === "ol") flushList();
          listType = "ul";
          listItems.push(bulletMatch[1]);
        } else {
          flushList();
          result.push(`<p>${trimmed}</p>`);
        }
      }

      flushList();
      return result.join("");
    },
  },
  fromJson: {
    labels(raw: unknown): string[] | undefined {
      if (!Array.isArray(raw)) return undefined;
      const list = raw.filter((x): x is string => typeof x === "string");
      return list.length > 0 ? list : undefined;
    },

    task(body: unknown): Task {
      if (body === null || typeof body !== "object" || Array.isArray(body)) {
        return {
          id: "",
          taskBoardId: "",
          summary: "",
          description: "",
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
        };
      }
      const raw = body as Record<string, unknown>;
      const nested = raw.subtasks;
      const subtasks =
        Array.isArray(nested) && nested.length > 0
          ? nested.map((item) => tasksHelper.fromJson.task(item))
          : undefined;
      return {
        id: typeof raw.id === "string" ? raw.id : "",
        taskBoardId: typeof raw.taskBoardId === "string" ? raw.taskBoardId : "",
        taskKey: typeof raw.taskKey === "string" ? raw.taskKey : undefined,
        summary: typeof raw.summary === "string" ? raw.summary : "",
        description: typeof raw.description === "string" ? raw.description : "",
        status: toTaskStatus(raw.status),
        priority: toTaskPriority(raw.priority),
        labels: tasksHelper.fromJson.labels(raw.labels),
        dueDate: tasksHelper.date.parse(raw.dueDate),
        scheduleDate: tasksHelper.date.parse(raw.scheduleDate),
        estimation:
          typeof raw.estimation === "number" && !Number.isNaN(raw.estimation)
            ? raw.estimation
            : undefined,
        subtasks,
      };
    },

    createTask(body: unknown): Omit<Task, "id"> {
      const full = tasksHelper.fromJson.task(body);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _, ...rest } = full;
      return rest;
    },

    postPayload(body: unknown): TaskPostPayload {
      if (body === null || typeof body !== "object" || Array.isArray(body)) {
        throw new Error("Invalid JSON body");
      }
      const src = body as Record<string, unknown>;
      const { shouldUseAI, text, _composeOnly, taskBoardName, ...rest } = src;
      return {
        shouldUseAI: shouldUseAI === true ? true : undefined,
        text: typeof text === "string" ? text : undefined,
        _composeOnly: _composeOnly === true ? true : undefined,
        taskBoardName:
          typeof taskBoardName === "string" ? taskBoardName.trim() : undefined,
        task: tasksHelper.fromJson.createTask(rest),
      };
    },

    subtasksFromArray(raw: unknown): Task[] | undefined {
      if (!Array.isArray(raw)) return undefined;
      return raw.map((item) => tasksHelper.fromJson.task(item));
    },

    patch(body: unknown): TaskUpdate {
      if (body === null || typeof body !== "object" || Array.isArray(body)) {
        return {};
      }
      const src = body as Record<string, unknown>;
      const out = { ...src } as TaskUpdate;
      if ("dueDate" in src) {
        out.dueDate =
          src.dueDate === null ? null : tasksHelper.date.parse(src.dueDate);
      }
      if ("scheduleDate" in src) {
        out.scheduleDate =
          src.scheduleDate === null
            ? null
            : tasksHelper.date.parse(src.scheduleDate);
      }
      if ("subtasks" in src && Array.isArray(src.subtasks)) {
        out.subtasks = tasksHelper.fromJson.subtasksFromArray(src.subtasks);
      }
      return out;
    },
  },
};

export type TaskPostPayload = {
  shouldUseAI?: boolean;
  text?: string;
  _composeOnly?: boolean;
  /** Sent with creates so guest/in-memory keying can use the real board name. */
  taskBoardName?: string;
  task: Omit<Task, "id">;
};

export interface ParsedEstimation {
  days: number;
  hours: number;
  minutes: number;
}

export type ScheduleType = "new" | "today" | "tomorrow" | "custom";
