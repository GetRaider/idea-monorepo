import type { SidePanelCollapsePolicy } from "@/components/SidePanel/SidePanel.types";
import { TaskStatus } from "@/constants/tasks.constants";
import type { CalendarEventType } from "@/types/calendar.types";

export const CAL_PANEL_SECTION_ORDER = [
  "month",
  "calendars",
  "tasks",
  "eventTypes",
  "backlog",
] as const;

export type CalPanelSectionId = (typeof CAL_PANEL_SECTION_ORDER)[number];

export const CAL_PANEL_DEFAULT_OPEN: Record<CalPanelSectionId, boolean> = {
  month: true,
  calendars: false,
  tasks: false,
  eventTypes: false,
  backlog: false,
};

export const CALENDAR_SIDE_PANEL_COLLAPSE_POLICY: SidePanelCollapsePolicy = {
  mode: "limited",
  maxOpen: 2,
  sectionOrder: [...CAL_PANEL_SECTION_ORDER],
};

export const CAL_PANEL_BODY_GUTTER = "pl-2 pr-1" as const;

export const WEEK_LETTERS = ["M", "T", "W", "T", "F", "S", "S"] as const;

export const CALENDAR_KIND_ROWS: { kind: CalendarEventType; label: string }[] =
  [
    { kind: "timeBlock", label: "Time Blocks" },
    { kind: "common", label: "Common" },
    { kind: "task", label: "Tasks" },
  ];

export const TASK_DRAG_DURATION_MINUTES = 60;

export const TASK_STATUS_RANK: Record<TaskStatus, number> = {
  [TaskStatus.IN_PROGRESS]: 0,
  [TaskStatus.TODO]: 1,
  [TaskStatus.DONE]: 2,
};
